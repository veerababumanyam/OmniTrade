---
name: implementing-rag-intelligence
description: Manages pgvector-based RAG pipelines, including embedding storage, semantic search, and document chunking for market intelligence. Use when implementing similarity search or vector-based data retrieval for LLM agents.
---

# Implementing RAG Intelligence

This skill provides the patterns for Retrieval-Augmented Generation (RAG) within OmniTrade, specifically optimized for both **Codebase Intelligence** and **Market Fundamental Research**.

## When to use this skill
- When searching for specific logic or documentation across the codebase (**kilo-indexer**).
- When implementing search over fundamental data (earnings calls, SEC filings) via **pgvector-server**.
- When configuring `pgvector` index parameters (HNSW vs IVFFlat).
- When defining chunking strategies for long financial reports.
- When optimizing semantic retrieval performance for LLM agents.

## Core RAG Domains

### 1. Codebase RAG (`kilo-indexer`)
Use when you need to understand the "How" and "Where" of the project's logic without reading every file.
- **Tool**: `codebase_search` - Returns semantic matches from the entire repository.
- **Usage**: "Find the logic that handles trade proposal consensus."

### 2. Market RAG (`pgvector-server`)
Use when you need to research companies, news, and sentiment for trading signals.
- **Tool**: `search_sec_filings` - Semantic search across 10-K, 10-Q, 8-K filings.
- **Tool**: `search_news` - Search global news feeds for sentiment triggers.
- **Tool**: `get_fundamental_analysis` - Aggregate historical data for a symbol.

## Workflow

- [ ] **Context Selection**: Decide if you're searching the **Codebase** or **Market Data**.
- [ ] **Chunking Strategy**: Use overlapping chunks (e.g., 512 tokens with 50-token overlap) for context retention.
- [ ] **Metadata Tagging**: Tag every market vector with `symbol`, `fiscal_year`, and `report_type` for pre-filtering.
- [ ] **Similarity Threshold**: Implement a confidence score filter to discard irrelevant semantic matches.
- [ ] **Context Injection**: Format retrieved snippets into a clean markdown format for the LLM prompt.

## Instructions

### 1. Vector Search (MCP Tools)
Instead of raw SQL, use the specialized MCP tools:
```bash
# Codebase Search
tools/call kilo-indexer codebase_search { "query": "database connection pool", "category": "codebase" }

# Fundamental Search
tools/call pgvector-server search_sec_filings { "symbol": "AAPL", "query": "iPhone revenue growth" }
```

### 2. Embedding Generation (Genkit/Local)
Ensure the same model (e.g., `text-embedding-3-small` or local `gemma-2b`) is used for both indexing and querying.

### 3. Financial Context Handling
- **Tables**: Ensure numerical tables are preserved in their original structure during chunking.
- **Sentiment**: Combine vector search with sentiment metadata if available.

## Resources
- [Leveraging MCP Ecosystem](../leveraging-omnitrade-mcp-ecosystem/SKILL.md)
- [RAG Architecture Design](../../docs/architecture/01_RAG_Architecture_Design.md)
- [Integrating Vector Databases](../../.agent/skills/integrating-vector-databases/SKILL.md)
