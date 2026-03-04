package indexer

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"github.com/pgvector/pgvector-go"
	_ "github.com/lib/pq" // PostgreSQL driver
)

// VectorStore handles database interactions for codebase embeddings
type VectorStore struct {
	db *sql.DB
}

// NewVectorStore initializes the connection to the pgvector database
func NewVectorStore(dbURL string) (*VectorStore, error) {
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &VectorStore{db: db}, nil
}

// Close closes the database connection
func (s *VectorStore) Close() error {
	return s.db.Close()
}

// UpsertChunk inserts or updates a code chunk and its embedding
func (s *VectorStore) UpsertChunk(ctx context.Context, chunk CodeChunk, contentHash string, embedding []float32) error {
	if chunk.Metadata == nil {
		chunk.Metadata = make(map[string]interface{})
	}
	// Pack domain-specific fields into generic metadata
	chunk.Metadata["file_path"] = chunk.FilePath
	if chunk.Type != "" {
		chunk.Metadata["chunk_type"] = chunk.Type
	}
	if chunk.StartLine > 0 {
		chunk.Metadata["start_line"] = chunk.StartLine
		chunk.Metadata["end_line"] = chunk.EndLine
	}

	metadataJSON, err := json.Marshal(chunk.Metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}

	query := `
		INSERT INTO embeddings (content, content_hash, category, metadata, embedding)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (category, content_hash) 
		DO UPDATE SET 
			created_at = NOW(),
			content = EXCLUDED.content,
			metadata = EXCLUDED.metadata,
			embedding = EXCLUDED.embedding
	`

	_, err = s.db.ExecContext(ctx, query,
		chunk.Content,
		contentHash,
		chunk.Category,
		metadataJSON,
		pgvector.NewVector(embedding),
	)

	return err
}

// SearchResult represents a matched chunk from a similarity search
type SearchResult struct {
	FilePath   string
	ChunkType  string
	Content    string
	Category   string
	StartLine  int
	EndLine    int
	Similarity float32
}

// SearchSimilar returns the most semantically similar chunks across all categories
func (s *VectorStore) SearchSimilar(ctx context.Context, queryEmbedding []float32, limit int) ([]SearchResult, error) {
	return s.SearchByCategory(ctx, queryEmbedding, "", limit)
}

// SearchByCategory returns similar chunks filtered by category
func (s *VectorStore) SearchByCategory(ctx context.Context, queryEmbedding []float32, category string, limit int) ([]SearchResult, error) {
	query := `
		SELECT COALESCE(metadata->>'file_path', ''), COALESCE(metadata->>'chunk_type', ''), content, category, 
		       COALESCE(CAST(metadata->>'start_line' AS INTEGER), 0), 
		       COALESCE(CAST(metadata->>'end_line' AS INTEGER), 0), 
		       1 - (embedding <=> $1) AS similarity
		FROM embeddings
		WHERE ($3 = '' OR category = $3)
		ORDER BY embedding <=> $1
		LIMIT $2
	`

	rows, err := s.db.QueryContext(ctx, query, pgvector.NewVector(queryEmbedding), limit, category)
	if err != nil {
		return nil, fmt.Errorf("failed to execute search query: %w", err)
	}
	defer rows.Close()

	var results []SearchResult
	for rows.Next() {
		var res SearchResult
		if err := rows.Scan(
			&res.FilePath,
			&res.ChunkType,
			&res.Content,
			&res.Category,
			&res.StartLine,
			&res.EndLine,
			&res.Similarity,
		); err != nil {
			return nil, fmt.Errorf("failed to scan search result row: %w", err)
		}
		results = append(results, res)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating search results: %w", err)
	}

	return results, nil
}

// DeleteByCategory removes all chunks for a specific category
func (s *VectorStore) DeleteByCategory(ctx context.Context, category string) error {
	query := `DELETE FROM embeddings WHERE category = $1`
	_, err := s.db.ExecContext(ctx, query, category)
	return err
}

// DeleteByFilePath removes all chunks associated with a specific file path
func (s *VectorStore) DeleteByFilePath(ctx context.Context, filePath string) error {
	// Use JSONB containment operator to find and delete chunks associated with this file
	// Properly marshal the JSON to escape special characters like backslashes in Windows paths
	jsonData, err := json.Marshal(map[string]string{"file_path": filePath})
	if err != nil {
		return fmt.Errorf("failed to marshal file path for deletion: %w", err)
	}
	query := `DELETE FROM embeddings WHERE metadata @> $1::jsonb`
	_, err = s.db.ExecContext(ctx, query, string(jsonData))
	return err
}
