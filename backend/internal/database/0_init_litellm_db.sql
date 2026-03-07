-- Create a separate database for LiteLLM AI Gateway
-- This prevents Prisma schema conflicts with OmniTrade tables
SELECT 'CREATE DATABASE litellm' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'litellm')\gexec

-- Connect to litellm and enable pgvector
\c litellm
CREATE EXTENSION IF NOT EXISTS vector;
