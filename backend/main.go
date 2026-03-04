package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/firebase/genkit/go/genkit"

	"github.com/v13478/omnitrade/backend/internal/action"
	"github.com/v13478/omnitrade/backend/internal/agent"
	"github.com/v13478/omnitrade/backend/internal/api"
	"github.com/v13478/omnitrade/backend/internal/database"
	"github.com/v13478/omnitrade/backend/internal/ingestion"
)

func main() {
	// Initialize context
	ctx := context.Background()

	// Initialize Database Connection (Read-Only AI configuration)
	dbConn, err := database.InitDB()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer dbConn.Close()

	// Initialize Redis Connection
	redisDB, err := database.InitRedis()
	if err != nil {
		log.Printf("Warning: Failed to connect to Redis: %v (continuing without Redis logic)", err)
	} else {
		defer redisDB.Close()
	}

	// Initialize Action Plane Database (Write role)
	actionDB, err := action.NewActionPlaneDB()
	if err != nil {
		log.Printf("Warning: Failed to connect Action Plane database: %v (continuing without write access)", err)
		// Continue without action plane - some features will be disabled
	} else {
		defer actionDB.Close()
	}

	// Initialize Genkit
	g := genkit.Init(ctx)

	// Initialize Agent Orchestrator with proper dependency injection
	orchestrator := agent.NewOrchestrator(g, redisDB)
	agent.InitOrchestrator(orchestrator)

	// Setup REST API Core with database connection
	apiServer := api.NewAPI(dbConn, redisDB)

	// Setup Action Plane routes if available
	if actionDB != nil {
		actionPlaneAPI := api.NewActionPlaneAPI(actionDB)
		actionPlaneAPI.SetupActionRoutes(apiServer.Router)
	}

	// Start Data Ingestion Pipeline
	tickEngine := ingestion.NewTickEngine(dbConn)
	tickEngine.Start(ctx)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting OmniTrade Backend on port %s", port)
	log.Printf("Intelligence Plane: Read-only database connection active")
	litellmURL := os.Getenv("LITELLM_URL")
	if litellmURL == "" {
		litellmURL = "http://litellm:4000"
	}
	log.Printf("LLM Gateway: LiteLLM AI Gateway at %s", litellmURL)
	if actionDB != nil {
		log.Printf("Action Plane: Write database connection active (HITL enabled)")
	}

	log.Fatal(http.ListenAndServe(":"+port, apiServer.Router))
}
