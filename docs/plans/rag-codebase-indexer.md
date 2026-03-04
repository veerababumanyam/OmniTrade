# RAG Codebase Indexer Architecture

This document describes the design and components of the local, privacy-first codebase semantic search indexing system and Model Context Protocol (MCP) server.

## 1. System Overview
The RAG (Retrieval-Augmented Generation) Indexer analyzes the local codebase, chunks it semantically, embeds it into a vector space, and stores it in PostgreSQL using `pgvector` for fast similarity search. It exposes a `codebase_search` tool to external agents (Claude Code, Cursor, Google Antigravity, Kilo Code) via an MCP server.

### Key Benefits
- **Semantic Search**: Find code by meaning, not just exact keyword matches.
- **Enhanced AI Understanding**: Helps LLMs better comprehend context.
- **Cross-Project Discovery**: Search across all files, outside of the active editor view.
- **Pattern Recognition**: Locate similar implementations.

## 2. Components

### 2.1 The Models
- **Embeddings**: `embeddinggemma:latest` via Docker Model Runner (LiteLLM Gateway).
- **Generation**: `ministral3:latest` via Docker Model Runner (LiteLLM Gateway).

### 2.2 Vector Database
- **PostgreSQL & pgvector**: We use the existing OmniTrade database infrastructure running locally to store the generated higher-dimensional vectors and their metadata payloads (`file_path`, `content_hash`, `branch_name`). This avoids introducing a new database service.

### 2.3 Indexing Engine
The engine handles the realtime discovery and extraction of codebase representations.

#### Smart Code Parsing
- **Tree-sitter Integration**: Uses AST parsing to identify true semantic code blocks (functions, classes, methods).
- **Language Support**: All major languages.
- **Markdown Support**: Native chunking for documentation.
- **Fallback**: Line-based sliding window for unsupported files.
- **Block Sizing Rules**:
  - Minimum: 100 characters.
  - Maximum: 1000 characters.
  - Large functions are split intelligently.

#### Automatic File Filtering
The index is strict about excluding noise:
- **Exclusions**: Binary files, images, files >1MB.
- **Ignored Directories**: `.git` folders, `node_modules`, `vendor`, etc.
- **Pattern Matching**: Considers both standard `.gitignore` and custom `.codebaseignore` or `.ragignore` files.

#### Incremental Updates
- **File Watching**: Uses a filesystem watcher to monitor active developments.
- **Smart Updates**: Reprocesses only newly changed files.
- **Hash-based Caching**: SHA-256 caching avoids redundant embedding API calls.
- **Branch Switching**: Detects Git state transitions to swap visible context vectors without re-indexing.

### 2.4 Index Status
Real-time status is tracked and reported locally:
- **Standby (Gray)**: Not running, awaiting configuration.
- **Indexing (Yellow)**: Currently processing files.
- **Indexed (Green)**: Up-to-date and ready for searches.
- **Error (Red)**: Failed state requiring attention.

## 3. Data Flow
1. **File Added/Modified** -> File Watcher Triggers -> Filters Applied.
2. Filter passes -> Tree-sitter parses and creates semantic chunks.
3. Chunks Hash Checked -> If new, sent to `http://localhost:4000/v1/embeddings` (`embeddinggemma:latest`).
4. Embeddings generated -> Upserted into local DB (pgvector) payload mapped to relative path. (768 dimensions)
5. End-user prompts AI agent -> Agent triggers `codebase_search` tool -> MCP server queries Qdrant -> Relevant precise 100-1000 length chunks returned to LLM context.
