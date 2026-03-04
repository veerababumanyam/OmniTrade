---
name: pgvector-rag-integration
description: Use when implementing vector similarity search, storing embeddings, or building RAG pipelines with pgvector in OmniTrade's PostgreSQL database.
---

# pgvector RAG Integration

## Overview

OmniTrade uses pgvector for storing and querying document embeddings (SEC filings, earnings transcripts, news articles). The RAG pipeline embeds incoming text, stores it, then retrieves semantically relevant chunks to feed into LLM agents.

## Schema Setup

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Fundamental data with embeddings (read-only to AI agents)
CREATE TABLE fundamental_data (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol      VARCHAR(10) REFERENCES stock_assets(symbol),
    report_type VARCHAR(20),        -- '10-K', '10-Q', 'EARNINGS', 'NEWS'
    content     TEXT,               -- Original chunk text
    embedding   vector(1536),       -- OpenAI text-embedding-3-small dim
    source_url  TEXT,
    chunk_index INT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW index for fast approximate nearest-neighbor search
CREATE INDEX ON fundamental_data
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
```

## Embedding Storage (Go)

```go
// Embed text and store in DB
func (db *DB) StoreEmbedding(ctx context.Context, chunk DocumentChunk) error {
    _, err := db.sqlx.NamedExecContext(ctx, `
        INSERT INTO fundamental_data
            (symbol, report_type, content, embedding, source_url, chunk_index)
        VALUES
            (:symbol, :report_type, :content, :embedding, :source_url, :chunk_index)
    `, chunk)
    return err
}

type DocumentChunk struct {
    Symbol      string    `db:"symbol"`
    ReportType  string    `db:"report_type"`
    Content     string    `db:"content"`
    Embedding   []float32 `db:"embedding"` // pgvector accepts []float32
    SourceURL   string    `db:"source_url"`
    ChunkIndex  int       `db:"chunk_index"`
}
```

## Semantic Search (Go)

```go
// Cosine similarity search — returns top-K most relevant chunks
func (db *DB) SemanticSearch(ctx context.Context, symbol, query string, limit int) ([]FundamentalChunk, error) {
    queryEmbedding, err := embedText(query) // call embedding API
    if err != nil {
        return nil, fmt.Errorf("embed query: %w", err)
    }

    var chunks []FundamentalChunk
    err = db.sqlx.SelectContext(ctx, &chunks, `
        SELECT id, symbol, content, report_type, source_url,
               1 - (embedding <=> $1) AS similarity
        FROM fundamental_data
        WHERE symbol = $2
        ORDER BY embedding <=> $1
        LIMIT $3
    `, pgvector.NewVector(queryEmbedding), symbol, limit)
    return chunks, err
}

type FundamentalChunk struct {
    ID         uuid.UUID `db:"id"`
    Symbol     string    `db:"symbol"`
    Content    string    `db:"content"`
    ReportType string    `db:"report_type"`
    SourceURL  string    `db:"source_url"`
    Similarity float64   `db:"similarity"` // 0–1, higher = more similar
}
```

## Embedding API Call

```go
import "github.com/sashabaranov/go-openai"

func embedText(text string) ([]float32, error) {
    client := openai.NewClient(os.Getenv("OPENAI_API_KEY"))
    resp, err := client.CreateEmbeddings(context.Background(),
        openai.EmbeddingRequestStrings{
            Input: []string{text},
            Model: openai.SmallEmbedding3, // text-embedding-3-small → 1536 dims
        },
    )
    if err != nil {
        return nil, err
    }
    return resp.Data[0].Embedding, nil
}
```

## Text Chunking Strategy

```go
// Chunk documents before embedding
func chunkDocument(text string, chunkSize, overlap int) []string {
    // Use sentence-boundary chunking, ~512 tokens per chunk
    // with ~50-token overlap for context continuity
}
```

Rules:
- Target 512 tokens per chunk (~2000 chars)
- 50-token overlap between chunks
- Never split mid-sentence
- Store original chunk text alongside embedding

## Distance Operators

| Operator | Metric | Use When |
|----------|--------|----------|
| `<=>` | Cosine | Normalized text embeddings (default) |
| `<->` | L2 | Raw vector distance |
| `<#>` | Negative inner product | When vectors are unit-normalized |

For text RAG, always use `<=>` (cosine).

## Similarity Threshold

Filter low-relevance results before feeding to agents:

```go
// Only use chunks with similarity > 0.75
const minSimilarity = 0.75

chunks = filterChunks(chunks, func(c FundamentalChunk) bool {
    return c.Similarity >= minSimilarity
})
```

## pgvector Go Driver

```go
// go.mod dependency
import "github.com/pgvector/pgvector-go"

// Register pgvector types with sqlx
pgvector.RegisterTypes(db.sqlx.DB)
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Storing floats as `float64` slice | Use `[]float32` — pgvector native type |
| Full table scan (no index) | Create HNSW index on embedding column |
| Returning all results | Always use LIMIT + similarity threshold |
| Embedding at query time in flow | Pre-embed on ingestion; query time only |
| Wrong dimension | Match embedding model dim (3-small = 1536) |
