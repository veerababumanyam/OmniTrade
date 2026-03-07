# OmniTrade RAG Setup Guide

> **Version:** 1.0 · **Date:** 2026-03-07 · **Status:** Active

## Overview

OmniTrade has a comprehensive RAG (Retrieval-Augmented Generation) system that enables AI agents to search through both the codebase and documentation semantically.

## Architecture

### Components

| Component | Purpose | Port |
|-----------|---------|------|
| **kilo-indexer** | Codebase semantic indexing & MCP server | MCP stdio |
| **Docker Model Runner** | Local embedding generation (embeddinggemma) | 12434 |
| **LiteLLM Gateway** | LLM routing and fallback | 4000 |
| **PostgreSQL + pgvector** | Vector storage and similarity search | 5432 |

### Data Flow

```
[File Change] → [kilo-indexer] → [Docker Model Runner] → [pgvector] → [MCP Search]
```

## Documentation Structure for RAG

The documentation is organized by domain for optimal semantic retrieval:

```
docs/
├── architecture/    # System-level technical decisions
├── strategies/      # Quantitative trading and ML models
├── agents/          # AI agent definitions and orchestration
├── data/            # Data pipelines and storage schemas
├── frontend/        # UI components and design standards
├── plugins/         # Extension system documentation
├── guides/          # Procedural and how-to content
├── plans/           # Active design work and ADRs
├── reference/       # Static reference material
└── TradingAgent/    # Trading agent documentation
```

## MCP Tools Available

### kilo-indexer (Codebase RAG)

```bash
# Search the codebase
tools/call kilo-indexer codebase_search {
  "query": "trade proposal consensus logic",
  "category": "codebase",  # or "project" for docs
  "limit": 5
}

# Check indexer status
tools/call kilo-indexer indexer_status {}
```

### pgvector-server (Market Data RAG)

```bash
# Search SEC filings
tools/call pgvector-server search_sec_filings {
  "symbol": "AAPL",
  "query": "iPhone revenue growth"
}

# Search news
tools/call pgvector-server search_news {
  "query": "Apple earnings surprise"
}

# Get fundamental analysis
tools/call pgvector-server get_fundamental_analysis {
  "symbol": "AAPL"
}
```

## Configuration

### Environment Variables

```bash
# Embedding Service
EMBEDDING_BASE_URL=http://localhost:12434/v1
EMBEDDING_MODEL=docker.io/ai/embeddinggemma:latest
EMBEDDING_API_KEY=not-needed

# Database
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/omnitrade
```

### MCP Configuration (.mcp.json)

```json
{
  "mcpServers": {
    "kilo-indexer": {
      "command": "backend/rag-indexer.exe",
      "args": ["--mcp", "--workspace", "."],
      "env": {
        "EMBEDDING_BASE_URL": "http://localhost:12434/v1",
        "EMBEDDING_MODEL": "docker.io/ai/embeddinggemma:latest",
        "DATABASE_URL": "postgresql://postgres:postgres@127.0.0.1:5432/omnitrade"
      }
    }
  }
}
```

## Starting Services

### 1. Start Docker Model Runner

```bash
# Ensure Docker Desktop is running with Model Runner enabled
docker model ls
```

### 2. Start Database

```bash
cd OmniTrade
docker compose up -d database
```

### 3. Run Indexer (standalone)

```bash
cd backend
./rag-indexer.exe --workspace ..
```

### 4. Run Indexer (MCP mode)

```bash
./rag-indexer.exe --mcp --workspace ..
```

## Indexing Categories

| Category | Content | Example |
|----------|---------|---------|
| `codebase` | Source code files | `*.go, *.ts, *.py` |
| `project` | Documentation | `docs/**/*.md` |
| `education` | Learning materials | `lessons/**/*.md` |

## Best Practices for AI Agents

1. **Use the right category**: Search `project` for docs, `codebase` for code
2. **Be specific in queries**: "trade proposal consensus logic" vs "trading"
3. **Check status first**: Use `indexer_status` to ensure indexing is complete
4. **Combine with market RAG**: Use `pgvector-server` for fundamental data

## Troubleshooting

### Embedding Errors

If you see "backend not found" errors:
1. Ensure Docker Model Runner is running: `curl http://localhost:12434/v1/models`
2. Check the embedding model is available: `docker model ls`

### Empty Search Results

1. Run `./rag-indexer.exe --clear` to reset
2. Restart the indexer to re-index all files
3. Wait for indexing to complete (check `indexer_status`)

### Database Connection Errors

1. Ensure PostgreSQL is running: `docker compose up -d database`
2. Check connection: `psql -h localhost -U postgres -d omnitrade`
