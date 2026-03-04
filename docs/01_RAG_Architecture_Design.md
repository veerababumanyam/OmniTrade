# OmniTrade: RAG & Storage Architecture Design

This document outlines the Retrieval-Augmented Generation (RAG) architecture and storage design for the OmniTrade AI Platform. In accordance with the system constraints, this design **strictly utilizes open-source models** and emphasizes a **storage-focused** approach for reliable, auditable, and performant financial data retrieval.

## 1. Storage & Database Architecture

The storage layer is the foundation of the RAG system, designed to handle raw documents, parsed text, and high-dimensional vector embeddings securely.

### 1.1 Object Storage (Raw Documents)
- **Technology**: **MinIO** (Open-source, S3-compatible object storage).
- **Purpose**: Stores the original immutable source documents (PDFs, HTML, JSON) such as SEC 10-K/10-Q filings, earnings call transcripts, and market news.
- **Organization**: `bucket_name/symbol/year/report_type/document_id.ext` (e.g., `filings/AAPL/2026/10-K/uuid.pdf`).
- **Why**: Ensures auditability. The Action Plane can link directly back to the raw source file to verify the AI's "chain-of-thought."

### 1.2 Relational & Vector Database (Processed Data)
- **Technology**: **PostgreSQL 16+** with the **`pgvector`** extension.
- **Purpose**: Serves as the primary transactional database and the vector store for RAG.
- **Role Constraint**: AI Genkit flows access this purely via the `medisync_readonly` role.

**Schema Design for RAG (`fundamental_data` table):**
```sql
CREATE TABLE fundamental_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(10) REFERENCES stock_assets(symbol),
    document_id UUID, -- Reference to MinIO object
    report_type VARCHAR(50), -- e.g., '10-K', 'news', 'earnings_call'
    published_date TIMESTAMPTZ,
    chunk_index INT, -- Order of the chunk in the document
    content TEXT, -- The actual text chunk
    metadata JSONB, -- Extracted entities, headers, sentiment scores
    embedding vector(768) -- pgvector column (dimension depends on open-source embedding model)
);

-- Indexing for fast similarity search using HNSW (Hierarchical Navigable Small World)
CREATE INDEX idx_fundamental_embedding ON fundamental_data USING hnsw (embedding vector_cosine_ops);
-- Indexing for metadata filtering (crucial for exact ticker matching)
CREATE INDEX idx_fundamental_symbol ON fundamental_data(symbol);
CREATE INDEX idx_fundamental_date ON fundamental_data(published_date DESC);
```

## 2. Open-Source Model Selection

To ensure vendor independence, privacy, and cost-control, the intelligence plane relies strictly on local/open-source models hosted via **Ollama** or **vLLM**.

### 2.1 Embedding Model (For Vectorizing Text)
- **Primary Choice**: **`nomic-embed-text-v1.5`** (Dimensions: 768, Context Length: 8192)
- **Alternative**: **`BAAI/bge-m3`** (Dimensions: 1024, Multi-lingual, supports sparse/dense retrieval).
- **Why**: `nomic-embed-text` is highly efficient, has a large context window for financial chunks, and performs exceptionally well on MTEB benchmarks for financial retrieval.

### 2.2 LLM Nodes (For Generation & Analysis)
- **Data Analyst / RAG Summarizer**: **`Llama-3-8B-Instruct`** OR **`Mistral-Nemo-12B`** (Optimized for fast, local inference to summarize chunks).
- **Portfolio Manager / Synthesizer**: **`DeepSeek-Coder-V3`** OR **`Llama-3.3-70B-Instruct`** (Larger models for complex strategy debate, reasoning, and JSON formatting).

## 3. RAG Types & Retrieval Strategies

A basic "Naive RAG" is insufficient for financial trading. We will implement advanced RAG techniques:

### 3.1 Metadata-Filtered RAG (Pre-filtering)
Before performing a vector similarity search, the query MUST filter by `symbol` and `date`.
*Example*: If analyzing AAPL, the vector search only runs against rows where `symbol = 'AAPL'` and `published_date > NOW() - INTERVAL '30 days'`. This prevents hallucinations where the LLM mixes up Apple's earnings with Microsoft's.

### 3.2 Hybrid Search (Dense + Sparse)
Financial documents contain highly specific jargon, acronyms (e.g., "EBITDA", "MACD"), and exact numerical values that pure vector search (Dense) might miss.
- **Dense Search**: `pgvector` Cosine Similarity for semantic meaning ("How is the company's supply chain doing?").
- **Sparse Search**: `pg_trgm` (Trigram) or Full-Text Search (`tsvector`) in PostgreSQL for exact keyword matching.
- **Ensemble**: Combine scores using Reciprocal Rank Fusion (RRF).

### 3.3 Parent-Document Retrieval (Small to Big RAG)
- **Ingestion**: Split documents into *small chunks* (e.g., 256 tokens) for highly accurate embedding and retrieval.
- **Storage**: Store the parent (larger section of 1024 tokens) alongside the small chunk.
- **Retrieval**: Vector search finds the best small chunks, but the system passes the *parent chunk* to the LLM to provide broader context (e.g., providing the whole paragraph surrounding a specific debt ratio).

## 4. The Ingestion & Retrieval Pipeline

### Step 1: Ingestion Pipeline (Running as a cron/background worker)
1. **Fetch**: Download 10-K from SEC EDGAR. Save raw PDF/XML to MinIO.
2. **Parse**: Extract text, tables, and nested structures using an open-source parser (e.g., Unstructured.io).
3. **Chunk**: Semantically split the text (header-aware splitting).
4. **Embed**: Send chunks to local Ollama instance (`nomic-embed-text`).
5. **Store**: Write to PostgreSQL `fundamental_data` table.

### Step 2: Retrieval Pipeline (Genkit Flow)
1. **Query Intent**: The Genkit flow receives a signal (e.g., "Analyze TSLA Q3 capabilities").
2. **Query Transformation**: An LLM rewrites the query for better retrieval (e.g., -> "Tesla Q3 production bottlenecks battery manufacturing").
3. **Retrieve**: Genkit queries PostgreSQL using Hybrid Search + Metadata Filtering.
4. **Rerank**: Pass the top 20 results through a lightweight Cross-Encoder (e.g., `BAAI/bge-reranker-v2-m3`) to get the top 5 most relevant chunks.
5. **Generate**: The `Llama-3 / DeepSeek` model analyzes the top 5 chunks and outputs a structured sentiment/fact summary.

## 5. Security & Action Plane Handoff
All K-nearest neighbor (KNN) queries in `pgvector` are executed using the `medisync_readonly` database user. The final output from the RAG summarizer contains the `document_id` of the sources used. These IDs are persisted in the `trade_proposals` table, allowing the human reviewer to click and read the exact MinIO document paragraph the AI based its decision on.
