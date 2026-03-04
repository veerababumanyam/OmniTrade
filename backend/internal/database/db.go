package database

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

// DB Wrapper for dependency injection
type DB struct {
	*sqlx.DB
	readOnly bool
}

// NewDB creates a new DB instance with the given connection pool
func NewDB(db *sqlx.DB, readOnly bool) *DB {
	return &DB{DB: db, readOnly: readOnly}
}

// IsReadOnly returns whether this connection is read-only
func (d *DB) IsReadOnly() bool {
	return d.readOnly
}

// InitDB initializes the database connection.
// For the Intelligence Plane, this connects using the `omnitrade_readonly` role.
func InitDB() (*DB, error) {
	dbUser := os.Getenv("DB_USER")
	if dbUser == "" {
		dbUser = "omnitrade_readonly" // Default to safe role
	}
	dbPassword := os.Getenv("DB_PASSWORD")
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "localhost"
	}
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "omnitrade"
	}

	// Determine if this is a read-only connection
	readOnly := dbUser == "omnitrade_readonly"

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbUser, dbPassword, dbName)

	db, err := sqlx.Connect("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to PostgreSQL: %w", err)
	}

	// Verify connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping PostgreSQL: %w", err)
	}

	log.Printf("Successfully connected to the PostgreSQL database as %s (read-only: %v)", dbUser, readOnly)

	return NewDB(db, readOnly), nil
}

// Asset represents a stock asset in the database
type Asset struct {
	Symbol      string `db:"symbol" json:"symbol"`
	CompanyName string `db:"company_name" json:"company_name"`
	Sector      string `db:"sector" json:"sector"`
}

// MarketData represents market OHLCV data
type MarketData struct {
	ID        int     `db:"id" json:"id"`
	Symbol    string  `db:"symbol" json:"symbol"`
	Price     float64 `db:"price" json:"price"`
	Volume    int64   `db:"volume" json:"volume"`
	Timestamp string   `db:"timestamp" json:"timestamp"`
}

// TradeProposal represents a trade proposal in the database
type TradeProposal struct {
	ID              string  `db:"id" json:"id"`
	Symbol          string  `db:"symbol" json:"symbol"`
	Action          string  `db:"action" json:"action"`
	ConfidenceScore float64 `db:"confidence_score" json:"confidence_score"`
	Reasoning       string  `db:"reasoning" json:"reasoning"`
	ProposedByModel string  `db:"proposed_by_model" json:"proposed_by_model"`
	Status          string  `db:"status" json:"status"`
	CreatedAt       string  `db:"created_at" json:"created_at"`
	UpdatedAt       string  `db:"updated_at" json:"updated_at"`
}

// FetchAssets retrieves all stock assets from the database
func (d *DB) FetchAssets(ctx context.Context) ([]Asset, error) {
	var assets []Asset
	query := `SELECT symbol, company_name, sector FROM stock_assets ORDER BY symbol`
	err := d.SelectContext(ctx, &assets, query)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch assets: %w", err)
	}
	return assets, nil
}

// FetchAssetBySymbol retrieves a single asset by symbol
func (d *DB) FetchAssetBySymbol(ctx context.Context, symbol string) (*Asset, error) {
	var asset Asset
	query := `SELECT symbol, company_name, sector FROM stock_assets WHERE symbol = $1`
	err := d.GetContext(ctx, &asset, query, symbol)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch asset %s: %w", symbol, err)
	}
	return &asset, nil
}

// FetchLatestMarketData retrieves the latest market data for a symbol
func (d *DB) FetchLatestMarketData(ctx context.Context, symbol string) (*MarketData, error) {
	var data MarketData
	query := `
		SELECT id, symbol, price, volume, timestamp 
		FROM market_data 
		WHERE symbol = $1 
		ORDER BY timestamp DESC 
		LIMIT 1`
	err := d.GetContext(ctx, &data, query, symbol)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch market data for %s: %w", symbol, err)
	}
	return &data, nil
}

// FetchMarketDataRange retrieves market data for a symbol within a time range
func (d *DB) FetchMarketDataRange(ctx context.Context, symbol, from, to string) ([]MarketData, error) {
	var data []MarketData
	query := `
		SELECT id, symbol, price, volume, timestamp 
		FROM market_data 
		WHERE symbol = $1 AND timestamp >= $2 AND timestamp <= $3
		ORDER BY timestamp ASC`
	err := d.SelectContext(ctx, &data, query, symbol, from, to)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch market data range: %w", err)
	}
	return data, nil
}

// FetchProposals retrieves trade proposals, optionally filtered by status
func (d *DB) FetchProposals(ctx context.Context, status string) ([]TradeProposal, error) {
	var proposals []TradeProposal
	var query string
	var args []interface{}

	if status != "" {
		query = `
			SELECT id, symbol, action, confidence_score, reasoning, proposed_by_model, status, created_at, updated_at 
			FROM trade_proposals 
			WHERE status = $1 
			ORDER BY created_at DESC`
		args = []interface{}{status}
	} else {
		query = `
			SELECT id, symbol, action, confidence_score, reasoning, proposed_by_model, status, created_at, updated_at 
			FROM trade_proposals 
			ORDER BY created_at DESC`
	}

	err := d.SelectContext(ctx, &proposals, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch proposals: %w", err)
	}
	return proposals, nil
}

// FetchProposalByID retrieves a single proposal by ID
func (d *DB) FetchProposalByID(ctx context.Context, id string) (*TradeProposal, error) {
	var proposal TradeProposal
	query := `
		SELECT id, symbol, action, confidence_score, reasoning, proposed_by_model, status, created_at, updated_at 
		FROM trade_proposals 
		WHERE id = $1`
	err := d.GetContext(ctx, &proposal, query, id)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch proposal %s: %w", id, err)
	}
	return &proposal, nil
}

// Ping checks the database connection
func (d *DB) Ping(ctx context.Context) error {
	return d.DB.PingContext(ctx)
}

// Close closes the database connection
func (d *DB) Close() error {
	return d.DB.Close()
}
