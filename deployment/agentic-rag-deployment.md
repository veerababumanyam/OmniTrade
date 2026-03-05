# Agentic RAG Deployment Guide

> **Last Updated:** 2026-03-05
> **Status:** Ready for Deployment

---

## Overview

This guide covers deploying OmniTrade's Agentic RAG system on a separate computer. The system uses a **hybrid architecture**:
- **Go Backend** (Port 8080): Data plane, RAG tools, API routing
- **Python Agent Service** (Port 8001): LangGraph orchestration, full autonomy
- **PostgreSQL + pgvector** (Port 5432): Vector + full-text storage

---

## Prerequisites

### System Requirements
- **OS**: Linux (Ubuntu 22.04+) or macOS 12+
- **CPU**: 4+ cores recommended
- **RAM**: 16GB minimum (32GB recommended for embeddings)
- **Storage**: 100GB SSD minimum

### Software Requirements
- **Docker**: 24.0+
- **Docker Compose**: 2.29+
- **Go**: 1.26+
- **Python**: 3.11+
- **PostgreSQL**: 16+ (with pgvector extension)
- **Redis**: 8.x

---

## Architecture Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│                   HITL Approval Dashboard                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   Go Backend API (Port 8080)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Market API │  │   RAG API   │  │    Agent Proxy API      │  │
│  │  Handlers   │  │  Handlers   │  │      Handlers           │  │
│  └─────────────┘  └─────────────┘  └───────────┬─────────────┘  │
└─────────────────────────────────────────────────┼───────────────┘
                             │                    │
              ┌──────────────┘                    │
              │                                   │
┌─────────────▼─────────────┐    ┌───────────────▼───────────────┐
│   PostgreSQL + pgvector   │    │  Python Agent Service (8001)  │
│  ┌─────────────────────┐  │    │  ┌─────────────────────────┐  │
│  │ embeddings table    │  │    │  │   LangGraph Agent Loop  │  │
│  │ HNSW + GIN indexes   │  │    │  │   Observe → Think → Act   │  │
│  │ Hybrid search (RRF)   │  │    │  │   Evaluate → Loop/Complete │  │
│  └─────────────────────┘  │    │  └─────────────────────────┘  │
└───────────────────────────┘    └───────────────┬───────────────┘
                                                 │
                                 ┌───────────────▼───────────────┐
                                 │      LiteLLM Gateway          │
                                 │  (Multi-provider abstraction) │
                                 └───────────────────────────────┘
```

---

## Environment Variables

### Go Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://omnitrade:password@postgres:5432/omnitrade?sslmode=disable
DB_HOST=postgres
DB_PORT=5432
DB_USER=omnitrade_readonly
DB_PASSWORD=your_secure_password
DB_NAME=omnitrade

# Redis
REDIS_URL=redis://redis:6379/0

# LiteLLM Gateway
LITELLM_GATEWAY_URL=http://litellm:4000

# Agent Service
AGENT_SERVICE_URL=http://agent-service:8001

# Server
PORT=8080
ENVIRONMENT=production
LOG_LEVEL=info
```

### Python Agent Service (.env)

```bash
# Go Backend
AGENT_GO_BACKEND_URL=http://backend:8080

# Redis
AGENT_REDIS_URL=redis://redis:6379/0

# LLM Configuration
AGENT_LLM_PROVIDER=openai
AGENT_LLM_MODEL=gpt-4o
AGENT_LLM_API_KEY=your_openai_api_key

# Agent Settings
AGENT_MAX_ITERATIONS=5
```

### LiteLLM Gateway (.env)

```bash
# OpenAI
OPENAI_API_KEY=sk-your_openai_api_key_here

# Anthropic
ANTHROPIC_API_KEY=sk-your_anthropic_api_key_here

# Google
GEMINI_API_KEY=sk-your_gemini_api_key_here

# DeepSeek
DEEPSEEK_API_KEY=sk-your_deepseek_api_key_here

# Master Key (for UI)
LITELLM_MASTER_KEY=your_litellm_master_key

# Database for tracking
DATABASE_URL=postgresql://user:pass@postgres:5432/litellm
```

---

## Database Setup

### 1. Enable Extensions

```bash
# Connect to PostgreSQL
psql -U omnitrade -d omnitrade

# Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

# Enable pg_trgm forCREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### 2. Create Schema

```bash
# Apply the RAG schema
psql -U omnitrade -d omnitrade -f backend/internal/database/rag_schema.sql
psql -U omnitrade -d omnitrade -f backend/internal/database/schema.sql
```

### 3. Verify Indexes

```sql
-- Check HNSW index
\d omnitrade=# SELECT indexname, indexdef FROM pg_indexes
WHERE tablename = 'embeddings' AND indexname LIKE '%vector%';

-- Check GIN index
\d omnitrade=# SELECT indexname, indexdef FROM pg_indexes
WHERE tablename = 'embeddings' AND indexname LIKE '%tsvector%';
```

---

## Docker Deployment

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: omnitrade
      POSTGRES_USER: omnitrade
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready", "-U", "omnitrade", "-d", "omnitrade"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:8-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  litellm:
    image: ghcr.io/berriai/litellm:main-latest
    environment:
      DATABASE_URL: ${LITELLM_DATABASE_URL}
    ports:
      - "4000:4000"
    volumes:
      - litellm_data:/app/data
    command: ["--port", "4000", "--num_workers", "4"]

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
        DATABASE_URL: postgresql://omnitrade:${DB_PASSWORD}@postgres:5432/omnitrade?sslmode=disable
        REDIS_URL: redis://redis:6379/0
        LITELLM_GATEWAY_URL: http://litellm:4000
        AGENT_SERVICE_URL: http://agent-service:8001
        PORT: 8080
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      litellm:
        condition: service_healthy

  agent-service:
    build:
      context: ./services/agent-service
      dockerfile: Dockerfile
    environment:
      AGENT_GO_BACKEND_URL: http://backend:8080
      AGENT_REDIS_URL: redis://redis:6379/0
      AGENT_LLM_PROVIDER: ${LLM_PROVIDER}
      AGENT_LLM_MODEL: ${LLM_MODEL}
      AGENT_LLM_API_KEY: ${LLM_API_KEY}
      AGENT_MAX_ITERATIONS: 5
    ports:
      - "8001:8001"
    depends_on:
      backend:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    depends_on:
      backend:
        condition: service_healthy

volumes:
  postgres_data:
  redis_data:
  litellm_data:
```

---

## Startup Commands

### Start All Services

```bash
docker-compose up -d
```

### Start Specific Services

```bash
# Start only database layer
docker-compose up -d postgres redis

# Start backend without agent
docker-compose up -d backend

# Start full stack
docker-compose up -d
```

### View Logs

```bash
docker-compose logs -f backend
docker-compose logs -f agent-service
```

---

## API Endpoints

### RAG Endpoints (Go Backend)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/rag/search` | Semantic search with query param `q` |
| POST | `/api/v1/rag/hybrid` | Hybrid search (dense + sparse) |
| POST | `/api/v1/rag/news` | News search with sentiment |
| POST | `/api/v1/rag/ingest` | Ingest content with embedding |

### Agent Endpoints (Python Service via Proxy)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/agent/query` | Execute agent query with full autonomy |
| GET | `/api/v1/agent/tools` | List available tools |
| WS | `/api/v1/agent/stream` | Streaming agent responses |

### Example Requests

```bash
# Semantic search
curl "http://localhost:8080/api/v1/rag/search?q=AAPL+earnings&symbol=AAPL&limit=5"

# Hybrid search
curl -X POST http://localhost:8080/api/v1/rag/hybrid \
  -H "Content-Type: application/json" \
  -d '{"query": "Apple Q3 revenue growth", "symbol": "AAPL", "limit": 5}'

# Agent query
curl -X POST http://localhost:8080/api/v1/agent/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Should I buy AAPL based on recent earnings?", "symbol": "AAPL"}'
```

---

## Data Ingestion

### Ingest SEC Filing

```bash
curl -X POST http://localhost:8080/api/v1/rag/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "category": "sec_filing",
    "content": "Apple Inc. reported Q3 2026 revenue of $94.8 billion...",
    "metadata": {
      "filing_type": "10-Q",
      "filed_date": "2026-02-01"
    }
  }'
```

### Ingest News Article

```bash
curl -X POST http://localhost:8080/api/v1/rag/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "category": "news",
    "content": "Apple announces new AI features for iPhone...",
    "metadata": {
      "source": "Reuters",
      "published_date": "2026-03-05",
      "sentiment": 0.75
    }
  }'
```

---

## Monitoring

### Health Checks

```bash
# Backend health
curl http://localhost:8080/health

# Agent service health
curl http://localhost:8001/health
```

### Logs

```bash
# View backend logs
docker-compose logs -f backend | grep -i "rag\|agent"

# View agent service logs
docker-compose logs -f agent-service | grep -i "observe\|think\|act"
```

---

## Troubleshooting

### Common Issues

1. **pgvector extension not found**
   ```bash
   # Solution: Use pgvector Docker image
   docker run -d --name postgres pgvector/pgvector:pg16
   ```

2. **Embedding dimension mismatch**
   - Ensure embedding model outputs 768 dimensions (nomic-embed-text)
   - Check: `SELECT embedding FROM embeddings LIMIT 1;`

3. **Agent service not responding**
   ```bash
   # Check if service is running
   docker-compose ps agent-service

   # Check logs
   docker-compose logs agent-service
   ```

4. **Redis connection refused**
   ```bash
   # Check Redis is running
   docker-compose ps redis

   # Test connection
   docker-compose exec backend redis-cli -h redis ping
   ```

---

## Security Checklist

- [ ] All API keys stored in environment variables
- [ ] Database uses SSL in production
- [ ] Redis requires authentication
- [ ] LiteLLM master key set
- [ ] CORS configured for production domain only
- [ ] Rate limiting enabled
- [ ] Read-only database role for AI agents

---

## Rollback Plan

If issues arise after deployment:

```bash
# Stop new services
docker-compose stop agent-service

# Revert to previous version
docker-compose down
git checkout previous-stable-tag
docker-compose up -d
```
