# MCP pgvector Server

Model Context Protocol (MCP) server for semantic search over SEC filings, news articles, and fundamental data using PostgreSQL with the pgvector extension.

## Overview

This MCP server provides AI agents with read-only access to the OmniTrade fundamental database, enabling:

- Semantic search over SEC filings (10-K, 10-Q, 8-K)
- News article search and retrieval
- Vector similarity search across all stored content
- RAG context aggregation for fundamental analysis

## Installation

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start the server
npm start
```

## Configuration

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=omnitrade_readonly
DB_PASSWORD=your_password
DB_NAME=omnitrade
```

Or use a connection string:

```env
DATABASE_URL=postgresql://omnitrade_readonly:password@localhost:5432/omnitrade
```

## Database Setup

Ensure your PostgreSQL database has the pgvector extension:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

The server expects the following schema:

```sql
CREATE TABLE fundamental_data (
    id UUID PRIMARY KEY,
    symbol VARCHAR(10),
    report_type VARCHAR(20),
    content TEXT,
    embedding vector(1536),
    created_at TIMESTAMPTZ
);

CREATE INDEX ON fundamental_data USING hnsw (embedding vector_cosine_ops);
```

## MCP Tools

### search_sec_filings

Search SEC filings for a specific symbol using semantic similarity.

```json
{
  "symbol": "AAPL",
  "query": "revenue growth fiscal 2024",
  "limit": 10
}
```

### search_news

Search news articles, optionally filtered by symbol.

```json
{
  "symbol": "MSFT",
  "query": "AI partnership announcement",
  "limit": 10
}
```

### store_embedding

Store a new embedding with content (requires write permissions).

```json
{
  "symbol": "GOOGL",
  "content": "Google reported quarterly earnings...",
  "report_type": "10-Q",
  "embedding": [0.1, 0.2, ...]
}
```

### get_similar_chunks

Find semantically similar content across all stored data.

```json
{
  "embedding": [0.1, 0.2, ...],
  "limit": 10
}
```

### get_fundamental_analysis

Retrieve all fundamental data for a symbol, grouped by report type.

```json
{
  "symbol": "AMZN"
}
```

## Integration with Claude Desktop

Add to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "pgvector": {
      "command": "node",
      "args": ["C:\\Users\\admin\\Desktop\\OmniTrade\\mcp\\pgvector-server\\dist\\index.js"],
      "env": {
        "DB_HOST": "localhost",
        "DB_USER": "omnitrade_readonly",
        "DB_PASSWORD": "your_password",
        "DB_NAME": "omnitrade"
      }
    }
  }
}
```

## Development

```bash
# Watch mode for development
npm run watch

# Run tests
npm test
```

## Security Notes

- AI agents should use the `omnitrade_readonly` role (SELECT only)
- Write operations require a separate write-enabled role
- Never commit `.env` files with real credentials
- All queries are parameterized to prevent SQL injection

## Architecture

This server follows the OmniTrade Three-Plane Architecture:

- **Data Plane**: Read-only access to fundamental_data table
- **Intelligence Plane**: Semantic search for AI agent analysis
- **Action Plane**: Write operations (via separate role with HITL approval)

## License

MIT
