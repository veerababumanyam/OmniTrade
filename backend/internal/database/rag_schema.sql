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

-- Index for similarity search
-- Create a generic index. Partial indexes can be added later by DBAs if one category becomes massive.
CREATE INDEX IF NOT EXISTS idx_embeddings_vector 
ON embeddings USING hnsw (embedding vector_cosine_ops);


