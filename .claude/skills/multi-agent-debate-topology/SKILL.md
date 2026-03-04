---
name: multi-agent-debate-topology
description: Use when designing or implementing OmniTrade's multi-agent orchestration — agent hierarchy, parallel analysis, Risk Manager veto, Portfolio Manager synthesis, or conflict resolution.
---

# Multi-Agent Debate Topology

## Overview

OmniTrade uses a hierarchical "Debate Topology" where specialist agents analyze in parallel, then a Portfolio Manager synthesizes their reports into a final proposal. The Risk Manager holds mandatory veto power — its REJECT cannot be overridden.

## Architecture

```
Trigger (Cron / API Signal)
        ↓
   Data Fetcher (Go, no LLM)
        ↓
┌────────────────────────────┐
│    Parallel Analysis Layer  │
│  Fundamental Analyst        │
│  Technical Analyst          │
│  Sentiment Analyst          │
│  News Summarizer            │
│  Alt Data Analyst           │
└────────────────────────────┘
        ↓
┌────────────────────────────┐
│     Strategy Layer          │
│  Day Trading Specialist     │
│  Positional Specialist      │
└────────────────────────────┘
        ↓
   Risk Manager (VETO)
        ↓
  Portfolio Manager (Synthesis)
        ↓
  TradeProposal → HITL Queue
```

## Step 1: Data Fetcher (No LLM)

```go
// Pure Go — deterministic, fast (< 5s)
type MarketSnapshot struct {
    Symbol    string
    OHLCV     []MarketBar          // last 90 days
    Indicators TechnicalIndicators // pre-computed RSI, MACD, BBands
    NewsChunks []FundamentalChunk  // top-K RAG results
}

func fetchMarketSnapshot(ctx context.Context, symbol string) (MarketSnapshot, error) {
    // Query read-only DB — no LLM
}
```

## Step 2: Parallel Analysis (errgroup — required vs optional)

Required agents return errors that abort the flow. Optional agents log errors and continue:

```go
var reports AgentReports
eg, egCtx := errgroup.WithContext(ctx)

// Required — error aborts entire flow
eg.Go(func() error {
    r, err := runFundamentalAnalyst(egCtx, snapshot)
    reports.Fundamental = r
    return err // propagates → flow aborts
})
eg.Go(func() error {
    r, err := runTechnicalAnalyst(egCtx, snapshot)
    reports.Technical = r
    return err
})

// Optional — error logged, flow continues, absence noted in CoT
eg.Go(func() error {
    r, err := runSentimentAnalyst(egCtx, snapshot)
    if err != nil {
        log.Printf("sentiment agent error: %v — proceeding without it", err)
        reports.SentimentUnavailable = true
        return nil // do NOT propagate
    }
    reports.Sentiment = r
    return nil
})

if err := eg.Wait(); err != nil {
    return nil, fmt.Errorf("required agent failed: %w", err)
}
```

## Step 3: Risk Manager (MANDATORY VETO)

```go
type RiskDecision struct {
    ApprovalStatus string   // "APPROVE" | "REJECT" | "REDUCE_SIZE"
    RiskFactors    []string
    VIXLevel       float64
    Reasoning      string
}

riskDecision, err := runRiskManager(ctx, snapshot, reports)

// HARD VETO — cannot be overridden
if riskDecision.ApprovalStatus == "REJECT" {
    return &TradeProposalOutput{
        Symbol:          input.Symbol,
        Action:          "HOLD",
        ConfidenceScore: 0,
        Reasoning:       "Risk Manager veto: " + riskDecision.Reasoning,
    }, nil
}

if riskDecision.ApprovalStatus == "REDUCE_SIZE" {
    // Pass reduction factor to Portfolio Manager
}
```

## Step 4: Portfolio Manager (Synthesis)

```go
// Receives ALL agent reports + risk decision
// Produces final Chain-of-Thought proposal
synthesis := buildSynthesisPrompt(AgentBundle{
    Fundamental: reports.Fundamental,
    Technical:   reports.Technical,
    Sentiment:   reports.Sentiment,
    Risk:        riskDecision,
    // strategy specialist reports if available
})

output, err := ai.GenerateText(ctx, g,
    ai.WithModel("claude-3-5-sonnet"),
    ai.WithSystem(portfolioManagerSystemPrompt),
    ai.WithPrompt(synthesis),
    ai.WithOutputType(TradeProposalOutput{}),
)
```

## Agent Output Schemas

### Fundamental Analyst
```go
type FundamentalAnalysis struct {
    Symbol                 string   `json:"symbol"`
    OverallSentimentScore  float64  `json:"overall_sentiment_score"` // -1 to 1
    KeyDrivers             []string `json:"key_drivers"`
    IdentifiedRisks        []string `json:"identified_risks"`
    SourcesCited           []string `json:"sources_cited"` // doc UUIDs
}
```

### Technical Analyst
```go
type TechnicalAnalysis struct {
    TrendDirection      string  `json:"trend_direction"`   // BULLISH|BEARISH|NEUTRAL
    MarketRegime        string  `json:"market_regime"`     // TREND|MEAN_REVERTING|BREAKOUT
    RSI14               float64 `json:"rsi_14"`
    MACDSignal          string  `json:"macd_signal"`       // BULLISH_CROSS|BEARISH_CROSS|NEUTRAL
    SupportLevel        float64 `json:"support_level"`
    ResistanceLevel     float64 `json:"resistance_level"`
    VolatilityAssessment string `json:"volatility_assessment"` // LOW|MEDIUM|HIGH|EXTREME
}
```

### Risk Manager
```go
type RiskDecision struct {
    ApprovalStatus string   `json:"approval_status"` // APPROVE|REJECT|REDUCE_SIZE
    RiskFactors    []string `json:"risk_factors"`
    VIXLevel       float64  `json:"vix_level"`
    Reasoning      string   `json:"reasoning"`
}
```

## Conflict Resolution (Portfolio Manager)

When agents disagree, the Portfolio Manager must:
1. Weight signals by agent reliability (Fundamental > Technical > Sentiment)
2. Apply Risk Manager constraints first
3. Document the conflict and resolution in `chain_of_thought`
4. Reduce confidence score when signals conflict — use this formula:

```go
// Conflict score reduction
func resolveConflict(scores map[string]float64, directions map[string]string) float64 {
    weights := map[string]float64{
        "fundamental": 0.50,
        "technical":   0.30,
        "sentiment":   0.20,
    }

    // Weighted average of scores for agents that agree on direction
    bullishWeight, bearishWeight := 0.0, 0.0
    for agent, dir := range directions {
        w := weights[agent]
        if dir == "BULLISH" {
            bullishWeight += w * scores[agent]
        } else if dir == "BEARISH" {
            bearishWeight += w * scores[agent]
        }
    }

    // Conflict penalty: confidence reduced proportionally to disagreement
    conflict := math.Abs(bullishWeight - bearishWeight)
    baseConfidence := math.Max(bullishWeight, bearishWeight)
    return baseConfidence * (1.0 - conflict) // penalty for disagreement
}

// Example: Fundamental=BULLISH(0.8), Technical=BEARISH(0.7)
// bullishWeight = 0.50 * 0.8 = 0.40
// bearishWeight = 0.30 * 0.7 = 0.21
// conflict = |0.40 - 0.21| = 0.19
// confidence = 0.40 * (1 - 0.19) = 0.324 → below 0.70 → HOLD
```

## Optional vs Required Agents

| Agent | Required | Fallback |
|-------|----------|---------|
| Data Fetcher | Yes | Abort — no data, no proposal |
| Fundamental Analyst | Yes | Abort |
| Technical Analyst | Yes | Abort |
| Sentiment Analyst | No | Skip, note absence in CoT |
| News Summarizer | No | Skip |
| Alt Data Analyst | No | Skip |
| Risk Manager | Yes | Default to REJECT |
| Portfolio Manager | Yes | Abort |

## Synthesis Prompt Structure

```go
func buildSynthesisPrompt(bundle AgentBundle) string {
    return fmt.Sprintf(`
Symbol: %s
Strategy: %s

=== FUNDAMENTAL ANALYSIS ===
%s

=== TECHNICAL ANALYSIS ===
%s

=== SENTIMENT ANALYSIS ===
%s

=== RISK MANAGER DECISION ===
Status: %s
Factors: %v

Based on all agent reports, produce a final trade proposal with full chain-of-thought reasoning.
Cite specific findings from each agent report.
If agents conflict, explain how you weighted the signals.
    `, bundle.Symbol, bundle.Strategy,
       formatReport(bundle.Fundamental),
       formatReport(bundle.Technical),
       formatReport(bundle.Sentiment),
       bundle.Risk.ApprovalStatus,
       bundle.Risk.RiskFactors)
}
```

## Extending the Topology

To add a new sequential agent (e.g., Macro Risk Agent after Risk Manager):

```go
// 1. Run after existing sequential stage (Risk Manager)
riskDecision, _ := runRiskManager(ctx, snapshot, reports)

// 2. New sequential agent receives prior outputs
macroDecision, err := runMacroRiskAgent(ctx, MacroInput{
    Symbol:       input.Symbol,
    RiskApproval: riskDecision.ApprovalStatus,
    // pass relevant prior reports
})
if err != nil {
    return nil, fmt.Errorf("macro risk agent: %w", err)
}

// 3. Wire into AgentBundle for Portfolio Manager
bundle := AgentBundle{
    Fundamental: reports.Fundamental,
    Risk:        riskDecision,
    MacroRisk:   macroDecision, // add to bundle
}
```

Rules for new sequential agents:
- They run AFTER the stage they depend on (not in parallel)
- They cannot override Risk Manager REJECT
- Their output must be included in the Portfolio Manager's synthesis prompt

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Sequential agent calls in parallel | Use errgroup — but keep sequential stages sequential |
| Optional agent error aborts flow | Return `nil` error for optional agents; log and continue |
| Ignoring Risk Manager REJECT | Hard veto — always returns HOLD |
| Missing CoT in output | Portfolio Manager must always produce chain_of_thought |
| New sequential agent runs in parallel layer | Sequential agents must run after their dependency |
| Required agent failure ignored | Abort flow, return error |
| Agent writing to DB | Agents return data only — handlers write |
