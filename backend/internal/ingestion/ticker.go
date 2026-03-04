package ingestion

import (
	"context"
	"log"
	"time"

	"github.com/v13478/omnitrade/backend/internal/database"
)

// TickEngine simulates real-time market data ingestion.
// In a production environment, this would ingest data from Polygon.io or Alpaca.
type TickEngine struct {
	db *database.DB
}

// NewTickEngine creates a new TickEngine instance.
func NewTickEngine(db *database.DB) *TickEngine {
	return &TickEngine{
		db: db,
	}
}

// Start begins the ingestion process.
func (e *TickEngine) Start(ctx context.Context) {
	log.Println("Starting Data Ingestion: Tick Engine...")

	go func() {
		ticker := time.NewTicker(5 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				log.Println("Tick Engine stopped.")
				return
			case <-ticker.C:
				// Simulate fetching and storing a tick
				e.ingestTick()
			}
		}
	}()
}

func (e *TickEngine) ingestTick() {
	// TODO: Connect to actual data source (Polygon/Alpaca)
	// For now, this just logs that the ingestion pipeline is active.
	log.Println("[Ingestion] Processed incoming market tick...")
}
