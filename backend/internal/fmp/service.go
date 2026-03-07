package fmp

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/v13478/omnitrade/backend/internal/database"
	"github.com/firebase/genkit/go/genkit"
)

const RedisPrefix = "fmp"

// Service handles FMP data retrieval from Redis and PostgreSQL
type Service struct {
	db    *database.DB
	redis *database.RedisDB
	gk    *genkit.Genkit
}

// NewService creates a new FMP service instance
func NewService(db *database.DB, redisDB *database.RedisDB, gk *genkit.Genkit) *Service {
	return &Service{
		db:    db,
		redis: redisDB,
		gk:    gk,
	}
}

// DB returns the underlying database connection.
func (s *Service) DB() *database.DB {
	return s.db
}

// Redis returns the underlying Redis connection.
func (s *Service) Redis() *database.RedisDB {
	return s.redis
}

// GetData retrieves data for a symbol and category, checking Redis cache first
func (s *Service) GetData(ctx context.Context, symbol string, category string) (*FMPTickerData, error) {
	upperSymbol := symbol // Should be normalized already

	// 1. Try Redis Cache
	if s.redis != nil && s.redis.Client != nil {
		redisKey := fmt.Sprintf("%s:%s:%s", RedisPrefix, upperSymbol, category)
		cached, err := s.redis.Client.Get(ctx, redisKey).Result()
		if err == nil && cached != "" {
			var data any
			if err := json.Unmarshal([]byte(cached), &data); err == nil {
				return &FMPTickerData{
					Symbol:   upperSymbol,
					Category: category,
					Data:     data,
				}, nil
			}
		}
	}

	// 2. Fallback to PostgreSQL
	var tickerData FMPTickerData
	query := `SELECT id, symbol, category, data, data_hash, fetched_at, updated_at 
			  FROM fmp_ticker_data WHERE symbol = $1 AND category = $2`
	err := s.db.Get(&tickerData, query, upperSymbol, category)
	if err != nil {
		return nil, err
	}

	// 3. Populate Redis Cache asynchronously if available
	if s.redis != nil && s.redis.Client != nil {
		go func() {
			redisKey := fmt.Sprintf("%s:%s:%s", RedisPrefix, upperSymbol, category)
			dataJSON, _ := json.Marshal(tickerData.Data)
			// TODO: Use actual TTL from fmp_sync_metadata, but default to 1h for now
			s.redis.Client.Set(context.Background(), redisKey, dataJSON, 0)
		}()
	}

	return &tickerData, nil
}

// GetAllData retrieves all available categories for a symbol
func (s *Service) GetAllData(ctx context.Context, symbol string) ([]FMPTickerData, error) {
	var results []FMPTickerData
	query := `SELECT id, symbol, category, data, data_hash, fetched_at, updated_at 
			  FROM fmp_ticker_data WHERE symbol = $1 ORDER BY category`
	err := s.db.Select(&results, query, symbol)
	return results, err
}

// GetSyncStatus retrieves the freshness status of all categories for a symbol
func (s *Service) GetSyncStatus(ctx context.Context, symbol string) ([]FMPSyncMetadata, error) {
	var results []FMPSyncMetadata
	query := `SELECT id, symbol, category, last_synced_at, last_data_hash, sync_count, ttl_seconds, last_error 
			  FROM fmp_sync_metadata WHERE symbol = $1 ORDER BY category`
	err := s.db.Select(&results, query, symbol)
	return results, err
}

// GetDerivedMetrics retrieves advanced financial metrics computed by quant analytics workers
func (s *Service) GetDerivedMetrics(ctx context.Context, symbol string) (map[string]interface{}, error) {
	var results []struct {
		MetricType string `db:"metric_type"`
		Data       []byte `db:"data"`
	}
	query := `SELECT metric_type, data FROM fmp_derived_metrics WHERE symbol = $1`
	err := s.db.Select(&results, query, symbol)
	if err != nil {
		return nil, err
	}

	metrics := make(map[string]interface{})
	for _, row := range results {
		var parsedData interface{}
		if err := json.Unmarshal(row.Data, &parsedData); err == nil {
			metrics[row.MetricType] = parsedData
		}
	}
	return metrics, nil
}
