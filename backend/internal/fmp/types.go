package fmp

import (
	"time"
)

// FMPTickerData represents stored JSONB data from PostgreSQL
type FMPTickerData struct {
	ID        int64     `db:"id" json:"id"`
	Symbol    string    `db:"symbol" json:"symbol"`
	Category  string    `db:"category" json:"category"`
	Data      any       `db:"data" json:"data"`
	DataHash  string    `db:"data_hash" json:"data_hash"`
	FetchedAt time.Time `db:"fetched_at" json:"fetched_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

// FMPSyncMetadata represents sync state tracking
type FMPSyncMetadata struct {
	ID           int64      `db:"id" json:"id"`
	Symbol       string     `db:"symbol" json:"symbol"`
	Category     string     `db:"category" json:"category"`
	LastSyncedAt *time.Time `db:"last_synced_at" json:"last_synced_at"`
	LastDataHash string     `db:"last_data_hash" json:"last_data_hash"`
	SyncCount    int        `db:"sync_count" json:"sync_count"`
	TTLSeconds   int        `db:"ttl_seconds" json:"ttl_seconds"`
	LastError    *string    `db:"last_error" json:"last_error"`
}

// FMPRequest represents the input for the Genkit flow
type FMPRequest struct {
	Symbol   string `json:"symbol"`
	Category string `json:"category,omitempty"` // Optional: filter by category
	Refresh  bool   `json:"refresh,omitempty"`  // Not used in read-only yet
}

// FMPResponse represents the output for the Genkit flow
type FMPResponse struct {
	Symbol   string          `json:"symbol"`
	Data     []FMPTickerData `json:"data"`
	Freshness map[string]bool `json:"freshness"`
}
