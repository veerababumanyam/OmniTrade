package agent

import (
	"context"
	"fmt"
	"log"

	"github.com/firebase/genkit/go/genkit"
	"github.com/v13478/omnitrade/backend/internal/database"
)

var dbConn *database.DB

// InitOrchestrator initializes the Genkit flows with the database dependency
func InitOrchestrator(db *database.DB, g *genkit.Genkit) {
	dbConn = db
	log.Println("Initializing OmniTrade Genkit Orchestrator...")

	// Define the Trade Proposal Flow
	genkit.DefineFlow(g,
		"GenerateTradeProposal",
		func(ctx context.Context, input TradeProposalInput) (*TradeProposalOutput, error) {
			// This represents the Multi-Agent Orchestration layer.

			log.Printf("Received signal request for: %s (Strategy: %s)", input.Symbol, input.Strategy)

			// Step 1: Data Fetcher Agent (Simulated interaction with DB/API)
			// In production, this would be a specialized Genkit tool/action.
			currentPrice := simulateFetchPrice(input.Symbol)

			// Step 2: RAG Agent (Simulated Vector Search)
			// fundamentalContext := fetchRAGContext(input.Symbol)

			// Step 3: Portfolio Manager Synthesizer (The LLM Call)
			// We would use an AI model here (e.g., Anthropic Claude 3.5 Sonnet / Llama-3)
			// to synthesize the fetched data into a strict JSON output matching TradeProposalOutput.

			reasoning := fmt.Sprintf("Based on simulated data (Price: %.2f) and the %s strategy, this asset shows strong momentum.", currentPrice, input.Strategy)

			// Step 4: Output structure matching the Action Plane requirements
			output := &TradeProposalOutput{
				Symbol:          input.Symbol,
				Action:          "BUY",
				ConfidenceScore: 0.88,
				Reasoning:       reasoning,
			}

			// Note: We DO NOT insert this into `trade_proposals` here directly.
			// The output is returned to the caller (e.g., the REST handler), which
			// uses a different database role (write access) to persist the proposal
			// for Human-in-the-Loop review.

			return output, nil
		},
	)
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
