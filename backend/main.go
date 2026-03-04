package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/firebase/genkit/go/genkit"

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

	// Initialize Genkit
	g := genkit.Init(ctx)

	// Initialize Agent Orchestrator with the database connection and Genkit instance
	agent.InitOrchestrator(dbConn, g)

	// Setup REST API Core
	apiServer := api.NewAPI(dbConn)

	// Start Data Ingestion Pipeline
	tickEngine := ingestion.NewTickEngine(dbConn)
	tickEngine.Start(ctx)

	// Setup Genkit routes
	// The frontend will interact with the Genkit flows directly via these routes.
	// The frontend will interact with the Genkit flows directly via these routes.

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting OmniTrade Backend on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, apiServer.Router))
}
