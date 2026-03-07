---
name: integrating-vector-databases
description: Manages pgvector-based RAG pipelines, including embedding storage, semantic search, and document chunking for market intelligence. Use when implementing similarity search or vector-based data retrieval for LLM agents.
---

# Integrating Vector Databases

This skill provides the structure and patterns for OmniTrade's **Fundamental Analysis** RAG pipeline, using `pgvector` for storing and querying text embeddings (SEC filings, news, transcripts). This infrastructure is exposed to agents via the **`pgvector-server`** MCP server.

## When to use this skill
- When implementing vector similarity search in the Data Plane.
- When configuring the PostgreSQL schema for the **pgvector-server** tools.
- When storing/retiring document embeddings in PostgreSQL.
- When configuring HNSW or IVFFlat indexes for performance.

## Workflow

- [ ] **Enable Extension**: Ensure `CREATE EXTENSION IF NOT EXISTS vector` is run.
- [ ] **Define Embedding Type**: Use `vector(1536)` (or the specific dimension of the embedding model) in the SQL schema.
- [ ] **Select Strategy**: Use **Cosine Similarity** (`<=>`) for text-based RAG.
- [ ] **Chunk Documents**: Apply ~512 token chunk size (~2000 chars) with 50-token overlap.
- [ ] **Limit & Threshold**: Always apply a `LIMIT` (e.g., top 10 chunks) and a similarity threshold (e.g., `Lc >= 0.75`).
- [ ] **Optimize with HNSW**: Create a HNSW index for fast approximate nearest-neighbor search on large datasets.

## Instructions

### 1. Vector Schema (SQL)
```sql
CREATE TABLE fundamental_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(10),
    content TEXT,
    embedding vector(1536), -- Match model dimension
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cosine Distance Operator index
CREATE INDEX ON fundamental_data USING hnsw (embedding vector_cosine_ops);
```

### 2. Semantic Search (Go)
Use `pgvector-go` and `sqlx` to execute similarity queries.
```go
func Search(db *sqlx.DB, queryEmbedding []float32, limit int) ([]Chunk, error) {
    var chunks []Chunk
    err := db.Select(&chunks, `
        SELECT symbol, content, 1 - (embedding <=> $1) AS similarity
        FROM fundamental_data
        ORDER BY embedding <=> $1
        LIMIT $3
    `, pgvector.NewVector(queryEmbedding), limit)
    return chunks, err
}
```

### 3. Distance Operators
- `<=>` (Cosine): Best for text (normalized embeddings).
- `<->` (L2): Euclidean distance.
- `<#>` (Negative inner product).

### 4. Precision (Go)
PostgreSQL's `vector` type maps to `[]float32` in Go. Use `pgvector.NewVector(embedding)` to wrap slices for SQL parameters.

## Resources
- [Leveraging MCP Ecosystem](../leveraging-omnitrade-mcp-ecosystem/SKILL.md)
- [Embedding Model Config](resources/EMBEDDING_CONFIG.md)
- [Example: RAG Pipeline](examples/rag-retriever.go)
