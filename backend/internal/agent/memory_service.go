package agent

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/v13478/omnitrade/backend/internal/database"
)

// MemoryService handles tiered agent memory systems
type MemoryService struct {
	redisDB *database.RedisDB
}

// MemoryEntry represents a single memory record
type MemoryEntry struct {
	Role      string    `json:"role"`
	Content   string    `json:"content"`
	Timestamp time.Time `json:"timestamp"`
}

// NewMemoryService creates a new Memory service layer
func NewMemoryService(redisDB *database.RedisDB) *MemoryService {
	return &MemoryService{
		redisDB: redisDB,
	}
}

// 1. WORKING MEMORY: Short-term task context
// Managed as a Redis List (LIFO/FIFO) for a specific session

func (m *MemoryService) SaveWorkingMemory(ctx context.Context, sessionID string, entry MemoryEntry) error {
	if m.redisDB == nil || m.redisDB.Client == nil {
		return nil
	}
	
	key := fmt.Sprintf("memory:working:%s", sessionID)
	data, _ := json.Marshal(entry)
	
	// Add to list and keep only last 50 entries
	pipe := m.redisDB.Client.Pipeline()
	pipe.LPush(ctx, key, data)
	pipe.LTrim(ctx, key, 0, 49)
	pipe.Expire(ctx, key, 2*time.Hour) // Tasks usually last < 2 hours
	
	_, err := pipe.Exec(ctx)
	return err
}

func (m *MemoryService) GetWorkingMemory(ctx context.Context, sessionID string) ([]MemoryEntry, error) {
	if m.redisDB == nil || m.redisDB.Client == nil {
		return nil, nil
	}
	
	key := fmt.Sprintf("memory:working:%s", sessionID)
	vals, err := m.redisDB.Client.LRange(ctx, key, 0, -1).Result()
	if err != nil {
		return nil, err
	}
	
	entries := make([]MemoryEntry, len(vals))
	for i, v := range vals {
		json.Unmarshal([]byte(v), &entries[i])
	}
	return entries, nil
}

// 2. EPISODIC MEMORY: Long-term logs of past actions and outcomes
// Stored as Redis Hashes (indexable for vector search later)

func (m *MemoryService) SaveEpisodicMemory(ctx context.Context, userID string, entry MemoryEntry) error {
	if m.redisDB == nil || m.redisDB.Client == nil {
		return nil
	}
	
	key := fmt.Sprintf("memory:episodic:%s:%d", userID, entry.Timestamp.UnixNano())
	data, _ := json.Marshal(entry)
	
	// In production, we would also trigger an embedding generation here
	// and store it in a vector index for future retrieval.
	err := m.redisDB.Client.Set(ctx, key, data, 30*24*time.Hour).Err() // 30 day retention for episodes
	if err != nil {
		log.Printf("Failed to save episodic memory: %v", err)
	}
	return err
}

// 3. SEMANTIC MEMORY: Global rules and facts
// Usually managed via PostgreSQL (RAG), but can be cached here
func (m *MemoryService) GetSemanticRules(ctx context.Context, userID string) ([]string, error) {
	// For now, this is a placeholder that would pull from the 'user_preferences' table
	return []string{
		"Always output code in TypeScript",
		"Never trade during low-liquidity after-hours",
	}, nil
}
