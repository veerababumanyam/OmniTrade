package database

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/redis/go-redis/v9"
)

// RedisDB holds the Redis client connection
type RedisDB struct {
	Client *redis.Client
}

// InitRedis initializes and returns a Redis client connection.
func InitRedis() (*RedisDB, error) {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://localhost:6379" // Fallback to localhost if not set
	}

	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("invalid redis url: %v", err)
	}

	client := redis.NewClient(opts)

	// Ping to verify connection
	ctx := context.Background()
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to ping redis: %v", err)
	}

	log.Println("Successfully connected to Redis at", opts.Addr)

	return &RedisDB{
		Client: client,
	}, nil
}

// Close closes the Redis connection
func (r *RedisDB) Close() error {
	if r.Client != nil {
		log.Println("Closing Redis connection...")
		return r.Client.Close()
	}
	return nil
}
