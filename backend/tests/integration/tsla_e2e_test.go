package integration

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"testing"
	"time"

	"github.com/firebase/genkit/go/genkit"
	"github.com/firebase/genkit/go/plugins/googlegenai"
	"github.com/v13478/omnitrade/backend/internal/action"
	"github.com/v13478/omnitrade/backend/internal/agent/adk"
	"github.com/v13478/omnitrade/backend/internal/database"
	"github.com/v13478/omnitrade/backend/internal/fmp"
)

func TestTSLADebateWorkflowE2E(t *testing.T) {
	// Only run in integration environments, but user requested explicitly so we will run it
	if os.Getenv("SKIP_E2E") == "true" {
		t.Skip("Skipping E2E test")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// 1. Initialize ActionPlaneDB (requires active PostgreSQL)
	// Fallbacks provided for local test execution
	os.Setenv("DB_HOST", "localhost")
	os.Setenv("DB_USER", "postgres")
	os.Setenv("DB_PASSWORD", "postgres")
	os.Setenv("DB_NAME", "omnitrade")

	// Attempt DB connection
	actionDB, err := action.NewActionPlaneDB()
	if err != nil {
		t.Logf("Database not accessible, skipping DB persistence portion. Error: %v", err)
		actionDB = nil
	} else {
		defer actionDB.Close()
	}

	// 2. Initialize Read-Only DB for FMP Service
	var db *database.DB
	mainDB, err := database.InitDB()
	if err == nil {
		db = mainDB
		defer db.Close()
	}

	// Redis optional for test
	var redisDB *database.RedisDB
	rDB, err := database.InitRedis()
	if err == nil {
		redisDB = rDB
		defer redisDB.Close()
	}

	// Initialize Genkit for real LLM evaluations
	g := genkit.Init(ctx, genkit.WithPlugins(&googlegenai.GoogleAI{}))

	// FMP Service
	fmpService := fmp.NewService(db, redisDB, g)

	// 3. Setup ADK Workflows
	agents := adk.NewTradingAgents(nil)

	cfg := adk.DebateWorkflowConfig{
		Agents:   agents,
		Mediator: adk.NewMediatorAgent(),
		Cache:    nil,
		Memory:   nil,
		FMP:      fmpService,
		ActionDB: actionDB,
		GK:       g,
	}

	workflow, err := adk.NewDebateWorkflow(cfg)
	if err != nil {
		t.Fatalf("Failed to create debate workflow: %v", err)
	}

	// 4. Input the TSLA test case
	input := adk.TradeProposalInput{
		Symbol:          "TSLA",
		Strategy:        "growth",
		AllocatorBudget: 50000.0,
		UserID:          "test-e2e-user",
		SessionID:       "tsla-e2e-session",
	}

	log.Println("Starting End-to-End TSLA Debate Workflow Analysis...")

	// 5. Run the Workflow
	output, err := workflow.Run(ctx, input)
	if err != nil {
		t.Fatalf("Workflow execution failed: %v", err)
	}

	if output == nil {
		t.Fatal("Workflow returned nil output")
	}

	// 6. Verify conditions
	if output.Symbol != "TSLA" {
		t.Errorf("Expected Symbol TSLA, got %s", output.Symbol)
	}

	if output.ConfidenceScore == 0 {
		t.Error("Expected ConfidenceScore > 0")
	}

	if output.Reasoning == "" {
		t.Error("Expected popluated Reasoning string")
	}

	// 7. Output Final Results for User Verification
	b, _ := json.MarshalIndent(output, "", "  ")
	fmt.Printf("\n--- END-TO-END TSLA PROPOSAL OUTCOME ---\n%s\n----------------------------------------\n", string(b))
	log.Println("Test Completed Successfully!")
}
