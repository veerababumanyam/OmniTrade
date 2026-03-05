-- RAG Indexer Tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";  -- pgvector extension

-- Generic embeddings table for RAG
CREATE TABLE IF NOT EXISTS embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    category TEXT NOT NULL, -- e.g., 'codebase', 'education', 'project'
    metadata JSONB DEFAULT '{}', -- All domain-specific data goes here
    embedding vector(768), -- embeddinggemma:300m outputs 768 dimensions
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (category, content_hash)
);

-- Drop old table if exists
DROP TABLE IF EXISTS codebase_chunks CASCADE;

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_embeddings_category ON embeddings (category);

-- Index for metadata filtering (using GIN for JSONB)
CREATE INDEX IF NOT EXISTS idx_embeddings_metadata ON embeddings USING gin (metadata);

-- Index for similarity search (HNSW for fast approximate nearest neighbor)
CREATE INDEX IF NOT EXISTS idx_embeddings_vector
ON embeddings USING hnsw (embedding vector_cosine_ops);

-- ============================================================================
-- HYBRID SEARCH EXTENSIONS (Dense + Sparse with RRF)
-- ============================================================================

-- Enable pg_trgm extension for trigram-based text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add generated tsvector column for full-text search
ALTER TABLE embeddings ADD COLUMN IF NOT EXISTS content_tsvector tsvector
    GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

-- GIN index for full-text search (sparse search)
CREATE INDEX IF NOT EXISTS idx_embeddings_content_tsvector ON embeddings USING gin (content_tsvector);

-- GIN index for trigram search (fuzzy matching)
CREATE INDEX IF NOT EXISTS idx_embeddings_content_trgm ON embeddings USING gin (content gin_trgm_ops);

-- ============================================================================
-- HYBRID SEARCH FUNCTION (Dense + Sparse with Reciprocal Rank Fusion)
-- ============================================================================

-- Create or replace the hybrid_search function
CREATE OR REPLACE FUNCTION hybrid_search(
    query_embedding vector,
    filter_symbol TEXT DEFAULT '',
    query_text TEXT DEFAULT '',
    dense_limit INT DEFAULT 20,
    sparse_limit INT DEFAULT 20,
    final_limit INT DEFAULT 5,
    similarity_threshold FLOAT DEFAULT 0.0
) RETURNS TABLE (
    id UUID,
    content TEXT,
    metadata JSONB,
    similarity FLOAT,
    source TEXT,
    rrf_score FLOAT
) AS $$
    WITH dense AS (
        SELECT id, content, metadata,
               1 - (embedding <=> query_embedding) AS score,
               ROW_NUMBER() OVER (ORDER BY embedding <=> query_embedding) AS row_num
        FROM embeddings
        WHERE (filter_symbol = '' OR metadata->>'symbol' = filter_symbol)
        AND 1 - (embedding <=> query_embedding) >= similarity_threshold
        LIMIT dense_limit
    ),
    sparse AS (
        SELECT id, content, metadata,
               ts_rank_cd(content_tsvector, plainto_tsquery('english', query_text)) AS score,
               ROW_NUMBER() OVER (ORDER BY ts_rank_cd(content_tsvector, plainto_tsquery('english', query_text)) DESC) AS row_num
        FROM embeddings
        WHERE (filter_symbol = '' OR metadata->>'symbol' = filter_symbol)
        AND content_tsvector @@ plainto_tsquery('english', query_text)
        LIMIT sparse_limit
    ),
    combined AS (
        SELECT id, content, metadata, score, 'dense' AS source,
               1.0 / (60 + row_num) AS rrf_score
        FROM dense
        UNION ALL
        SELECT id, content, metadata, score, 'sparse' AS source,
               1.0 / (60 + row_num) AS rrf_score
        FROM sparse
    )
    SELECT id, content, metadata,
           MAX(score) AS similarity,
           STRING_AGG(DISTINCT source, ',') AS source,
           SUM(rrf_score) AS rrf_score
    FROM combined
    GROUP BY id, content, metadata
    ORDER BY rrf_score DESC
    LIMIT final_limit;
$$ LANGUAGE SQL;


