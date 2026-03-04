---
name: genkit-multi-agent-flows
description: Use when defining or modifying Genkit flows, agent tools, or multi-agent orchestration in OmniTrade's Intelligence Plane (Go SDK).
---

# Genkit Multi-Agent Flows (Go SDK)

## Overview

OmniTrade uses Google Genkit Go SDK 1.4+ for multi-agent orchestration. Each agent is a typed Go function called within a `genkit.DefineFlow()`. Agents use read-only DB access and return structured JSON — they never write to the database.

## Key Constraint

**Genkit flows access DB via `omnitrade_readonly` role only.** The flow output is returned to the REST handler, which uses a write role to persist proposals.

```
Flow output → REST handler → write-role DB insert → PENDING_REVIEW status
```

## Initializing Genkit

```go
// main.go
import "github.com/firebase/genkit/go/genkit"

g, err := genkit.Init(ctx, genkit.WithPlugins(
    googleai.Init(ctx, &googleai.Config{APIKey: os.Getenv("GEMINI_API_KEY")}),
    anthropic.Init(ctx, &anthropic.Config{APIKey: os.Getenv("ANTHROPIC_API_KEY")}),
))
agent.InitOrchestrator(db, g)
```

## Defining a Flow

```go
// Always: typed input/output structs
type TradeProposalInput struct {
    Symbol          string  `json:"symbol"`
    Strategy        string  `json:"strategy"`    // "day_trading" | "positional"
    AllocatorBudget float64 `json:"allocator_budget"`
}

type TradeProposalOutput struct {
    Symbol              string  `json:"symbol"`
    Action              string  `json:"action"`               // BUY | SELL | HOLD
    ConfidenceScore     float64 `json:"confidence_score"`     // min 0.7 to propose
    Reasoning           string  `json:"reasoning"`
    ChainOfThought      string  `json:"chain_of_thought"`
    WeightedBreakdown   any     `json:"weighted_signal_breakdown"`
}

genkit.DefineFlow(g, "GenerateTradeProposal",
    func(ctx context.Context, input TradeProposalInput) (*TradeProposalOutput, error) {
        // Step 1: fetch data (no LLM)
        // Step 2: run parallel agent analysis
        // Step 3: risk manager veto check
        // Step 4: portfolio manager synthesis
        return output, nil
    },
)
```

## Defining an Agent Tool

Tools are typed Go functions exposed to LLM agents:

```go
genkit.DefineTool(g, "GetMarketData",
    "Fetch OHLCV data for a symbol from the last N days",
    func(ctx context.Context, input struct {
        Symbol string `json:"symbol"`
        Days   int    `json:"days"`
    }) ([]MarketBar, error) {
        return dbConn.GetMarketDataHist(ctx, input.Symbol, input.Days)
    },
)

genkit.DefineTool(g, "SearchFundamentalVectorDB",
    "Semantic search SEC filings and earnings transcripts",
    func(ctx context.Context, input struct {
        Symbol    string `json:"symbol"`
        Query     string `json:"query"`
        Limit     int    `json:"limit"`
    }) ([]FundamentalChunk, error) {
        return dbConn.SemanticSearch(ctx, input.Symbol, input.Query, input.Limit)
    },
)
```

## Calling an LLM Within a Flow

```go
import "github.com/firebase/genkit/go/ai"

// Use claude for analysis/synthesis
response, err := ai.GenerateText(ctx, g,
    ai.WithModel("claude-3-5-sonnet"),
    ai.WithSystem("You are the Portfolio Manager. Synthesize agent reports into a final trade proposal."),
    ai.WithPrompt(buildSynthesisPrompt(agentReports)),
    ai.WithOutputType(TradeProposalOutput{}), // structured output
)
```

## Parallel Agent Execution with Per-Agent Timeouts

Run independent agents concurrently using goroutines + errgroup. Apply per-agent timeouts from the registry:

```go
import "golang.org/x/sync/errgroup"

var (
    fundamentalReport FundamentalAnalysis
    technicalReport   TechnicalAnalysis
    sentimentReport   SentimentAnalysis
)

eg, egCtx := errgroup.WithContext(ctx)

// Required agents — errors abort the whole flow
eg.Go(func() error {
    agentCtx, cancel := context.WithTimeout(egCtx, 30*time.Second) // Fundamental: 30s
    defer cancel()
    r, err := runFundamentalAgent(agentCtx, symbol)
    fundamentalReport = r
    return err // propagates to eg.Wait() → aborts flow
})
eg.Go(func() error {
    agentCtx, cancel := context.WithTimeout(egCtx, 10*time.Second) // Technical: 10s
    defer cancel()
    r, err := runTechnicalAgent(agentCtx, symbol)
    technicalReport = r
    return err
})

// Optional agents — errors logged, flow continues
eg.Go(func() error {
    agentCtx, cancel := context.WithTimeout(egCtx, 15*time.Second) // Sentiment: 15s
    defer cancel()
    r, err := runSentimentAgent(agentCtx, symbol)
    if err != nil {
        log.Printf("sentiment agent unavailable: %v — skipping", err)
        return nil // do NOT propagate — optional agent
    }
    sentimentReport = r
    return nil
})

if err := eg.Wait(); err != nil {
    return nil, fmt.Errorf("required agent failed: %w", err)
}
```

## Confidence Threshold Gate

```go
// Enforce minimum confidence BEFORE returning output
if output.ConfidenceScore < 0.70 {
    return nil, fmt.Errorf("confidence %.2f below 0.70 minimum threshold", output.ConfidenceScore)
}
```

## Handler-Side Persist (After Flow Returns)

The flow returns output — the REST handler persists it using a write-role connection:

```go
// POST /api/v1/proposals/generate
func (h *Handler) GenerateAndSubmit(w http.ResponseWriter, r *http.Request) {
    var input agent.TradeProposalInput
    json.NewDecoder(r.Body).Decode(&input)

    // Run flow with readonly DB
    output, err := genkit.RunFlow(r.Context(), h.genkitInstance, "GenerateTradeProposal", input)
    if err != nil {
        http.Error(w, err.Error(), http.StatusUnprocessableEntity)
        return
    }

    // Handler uses write-role DB to persist
    proposal, err := h.writeDB.InsertProposal(r.Context(), output)
    if err != nil {
        http.Error(w, "failed to save", http.StatusInternalServerError)
        return
    }
    json.NewEncoder(w).Encode(proposal)
}
```

## Agent Registry (Default Models)

Edit `backend/internal/agent/orchestrator.go` to add/modify agents.

| Agent | Model | Timeout | Required |
|-------|-------|---------|---------|
| Data Fetcher | Go functions (no LLM) | 5s | Yes |
| Fundamental Analyst | gpt-4o | 30s | Yes |
| Technical Analyst | gemini-1.5-flash | 10s | Yes |
| Sentiment Analyst | llama3.2:3b (Ollama) | 15s | No |
| News Summarizer | llama3.2:1b (Ollama) | 10s | No |
| Alt Data Analyst | claude-3-5-sonnet | 20s | No |
| Risk Manager | claude-3-5-haiku | 20s | Yes |
| Portfolio Manager | claude-3-5-sonnet | 60s | Yes |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Writing to DB inside a flow | Return output to handler; handler writes |
| Using write-role DB in flow | Use `omnitrade_readonly` connection only |
| Untyped flow input/output | Always define typed structs |
| Sequential agents | Use `errgroup` for parallel analysis |
| Skipping confidence gate | Enforce 0.70 min before returning |
