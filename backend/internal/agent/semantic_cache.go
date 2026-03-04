package agent

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"log"
	"time"

	"github.com/v13478/omnitrade/backend/internal/database"
)

// SemanticCache handles LLM response caching via Redis
type SemanticCache struct {
	redisDB *database.RedisDB
}

// NewSemanticCache creates a new SemanticCache
func NewSemanticCache(redisDB *database.RedisDB) *SemanticCache {
	return &SemanticCache{
		redisDB: redisDB,
	}
}

// CheckCache checks if a highly similar query exists in the cache
func (c *SemanticCache) CheckCache(ctx context.Context, query string) (*TradeProposalOutput, bool) {
	if c.redisDB == nil || c.redisDB.Client == nil {
		return nil, false
	}

	// In a full production implementation, this would:
	// 1. Generate an embedding of the 'query' string using an LLM.
	// 2. Perform a RediSearch FT.SEARCH vector similarity query.
	// 3. Return a hit if cosine similarity > 0.95.
	// For this layer, we use an exact key hash as a proxy for the cache logic.
	cacheKey := c.generateCacheKey(query)
	
	val, err := c.redisDB.Client.Get(ctx, cacheKey).Result()
	if err != nil {
		// Cache miss or error
		return nil, false
	}
	
	log.Printf("Semantic Cache HIT for query: %s", query)
	var output TradeProposalOutput
	if err := json.Unmarshal([]byte(val), &output); err != nil {
		log.Printf("Failed to unmarshal cached proposal: %v", err)
		return nil, false
	}
	
	return &output, true
}

// SetCache stores the query and its LLM response in Redis
func (c *SemanticCache) SetCache(ctx context.Context, query string, output *TradeProposalOutput) error {
	if c.redisDB == nil || c.redisDB.Client == nil {
		return nil
	}

	cacheKey := c.generateCacheKey(query)
	
	data, err := json.Marshal(output)
	if err != nil {
		return err
	}
	
	// Cache TTL: 15 minutes for high-volatility market trading hours
	return c.redisDB.Client.Set(ctx, cacheKey, data, 15*time.Minute).Err()
}

func (c *SemanticCache) generateCacheKey(query string) string {
	hash := sha256.Sum256([]byte(query))
	return "semantic_cache:" + hex.EncodeToString(hash[:])
}
