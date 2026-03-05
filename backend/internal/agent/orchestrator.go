package agent

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/v13478/omnitrade/backend/internal/database"
)

// Orchestrator manages the multi-agent system and holds dependencies.
// It uses dependency injection rather than global state for thread safety.
type Orchestrator struct {
	semanticCache *SemanticCache
	memoryService *MemoryService
}

// NewOrchestrator creates a new Orchestrator with the given dependencies.
func NewOrchestrator(redisDB *database.RedisDB) *Orchestrator {
	return &Orchestrator{
		semanticCache: NewSemanticCache(redisDB),
		memoryService: NewMemoryService(redisDB),
	}
}

// GenerateTradeProposal generates a trade proposal for the given symbol and strategy.
// This is the primary orchestration method for the Intelligence Plane.
func (o *Orchestrator) GenerateTradeProposal(ctx context.Context, input TradeProposalInput) (*TradeProposalOutput, error) {
	// This represents the Multi-Agent Orchestration layer.

	log.Printf("Received signal request for: %s (Strategy: %s)", input.Symbol, input.Strategy)

	// ** Semantic Caching Layer **
	// Generate a unique query fingerprint based on inputs
	queryFingerprint := fmt.Sprintf("%s|%s", input.Symbol, input.Strategy)

	if cachedOutput, hit := o.semanticCache.CheckCache(ctx, queryFingerprint); hit {
		// Bypass LLM completely!
		// Log to Working Memory that we used a cache hit
		o.memoryService.SaveWorkingMemory(ctx, input.Symbol, MemoryEntry{
			Role:      "system",
			Content:   fmt.Sprintf("Cache HIT for %s. Bypassed LLM.", input.Symbol),
			Timestamp: time.Now(),
		})
		return cachedOutput, nil
	}

	// Save initial task intent to Working Memory
	o.memoryService.SaveWorkingMemory(ctx, input.Symbol, MemoryEntry{
		Role:      "user",
		Content:   fmt.Sprintf("Analyze %s using %s strategy.", input.Symbol, input.Strategy),
		Timestamp: time.Now(),
	})

	// Step 1: Data Fetcher Agent (Simulated interaction with DB/API)
	// In production, this would fetch real market data from the database.
	currentPrice := simulateFetchPrice(input.Symbol)

	// Step 2: RAG Agent (Simulated Vector Search)
	// fundamentalContext := fetchRAGContext(input.Symbol)

	// Step 3: Portfolio Manager Synthesizer (The LLM Call)
	// PROMPT CACHING REQUIREMENT:
	// Ensure the static system instructions (Agent Persona, strict JSON rules, etc.)
	// are > 1024 tokens and placed at the absolute beginning of the prompt context
	// to trigger provider-side Prompt Caching (e.g., Anthropic/OpenAI).
	// We would use an AI model here (e.g., Anthropic Claude 3.5 Sonnet / Ministral 3)
	// to synthesize the fetched data into a strict JSON output matching TradeProposalOutput.

	reasoning := fmt.Sprintf("Based on simulated data (Price: %.2f) and the %s strategy, this asset shows strong momentum.", currentPrice, input.Strategy)

	// Step 4: Output structure matching the Action Plane database schema
	output := &TradeProposalOutput{
		Symbol:          input.Symbol,
		Action:          "BUY",
		ConfidenceScore: 0.88,
		Reasoning:       reasoning,
	}

	// Save result to Episodic Memory for long-term recall
	o.memoryService.SaveEpisodicMemory(ctx, "default_user", MemoryEntry{
		Role:      "assistant",
		Content:   fmt.Sprintf("Generated %s signal for %s with %.2f confidence. Reasoning: %s", output.Action, output.Symbol, output.ConfidenceScore, output.Reasoning),
		Timestamp: time.Now(),
	})

	// Save to Semantic Cache
	if err := o.semanticCache.SetCache(ctx, queryFingerprint, output); err != nil {
		log.Printf("Warning: Failed to set semantic cache: %v", err)
	}

	// Note: We DO NOT insert this into `trade_proposals` here directly.
	// The output is returned to the caller (e.g., the REST handler), which
	// uses a different database role (write access) to persist the proposal
	// for Human-in-the-Loop review.

	return output, nil
}

// Input definition for the primary orchestration flow
type TradeProposalInput struct {
	Symbol          string  `json:"symbol"`
	Strategy        string  `json:"strategy"`
	AllocatorBudget float64 `json:"allocator_budget"`
}

// Strictly typed output conforming to the Action Plane database schema
type TradeProposalOutput struct {
	Symbol          string  `json:"symbol"`
	Action          string  `json:"action"` // BUY or SELL
	ConfidenceScore float64 `json:"confidence_score"`
	Reasoning       string  `json:"reasoning"`
}

// Helper to simulate data fetching logic before feeding to LLMs
func simulateFetchPrice(symbol string) float64 {
	// In a real scenario, this queries the `market_data` table via the `medisync_readonly` role.
	if symbol == "AAPL" {
		return 150.00
	}
	return 100.00
}
