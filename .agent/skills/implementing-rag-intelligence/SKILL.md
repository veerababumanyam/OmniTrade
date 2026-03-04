---
name: implementing-rag-intelligence
description: Manages pgvector-based RAG pipelines, including embedding storage, semantic search, and document chunking for market intelligence. Use when implementing similarity search or vector-based data retrieval for LLM agents.
---

# Implementing RAG Intelligence

This skill provides the patterns for Retrieval-Augmented Generation (RAG) within OmniTrade, specifically optimized for financial documents like 10-K and 10-Q filings.

## When to use this skill
- When implementing search over fundamental data (earnings calls, SEC filings).
- When configuring `pgvector` index parameters (HNSW vs IVFFlat).
- When defining chunking strategies for long financial reports.
- When optimizing semantic retrieval performance for LLM agents.

## Workflow

- [ ] **Chunking Strategy**: Use overlapping chunks (e.g., 512 tokens with 50-token overlap) for context retention.
- [ ] **Metadata Tagging**: Tag every vector with `symbol`, `fiscal_year`, and `report_type` for pre-filtering.
- [ ] **Similarity Threshold**: Implement a confidence score filter to discard irrelevant semantic matches.
- [ ] **Context Injection**: Format retrieved snippets into a clean markdown format for the LLM prompt.

## Instructions

### 1. Vector Search (SQL/pgvector)
```sql
-- Search for relevant context within a specific symbol
SELECT content, 1 - (embedding <=> $1) as similarity
FROM fundamental_data
WHERE symbol = $2
ORDER BY similarity DESC
LIMIT 5;
```

### 2. Embedding Generation (Genkit/Local)
Ensure the same model (e.g., `text-embedding-3-small` or local `gemma-2b`) is used for both indexing and querying.

### 3. Financial Context Handling
- **Tables**: Ensure numerical tables are preserved in their original structure during chunking.
- **Sentiment**: Combine vector search with sentiment metadata if available.

## Resources
- [RAG Architecture Design](../../docs/01_RAG_Architecture_Design.md)
- [Integrating Vector Databases](../../.agent/skills/integrating-vector-databases/SKILL.md)
