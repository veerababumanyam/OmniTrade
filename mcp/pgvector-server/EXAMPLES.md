# MCP pgvector Server Usage Examples

This document provides practical examples of using the MCP pgvector server with Claude Desktop or other MCP clients.

## Example 1: Analyzing a Company's Fundamentals

**User Query:**
```
Can you analyze Apple's (AAPL) recent fundamental data and provide insights?
```

**MCP Tool Call:**
```json
{
  "tool": "get_fundamental_analysis",
  "arguments": {
    "symbol": "AAPL"
  }
}
```

**Expected Response:**
The AI agent retrieves all fundamental data for AAPL grouped by report type (10-K, 10-Q, 8-K, earnings calls, news) and provides a comprehensive analysis.

---

## Example 2: Finding Specific Information in SEC Filings

**User Query:**
```
What does Microsoft's (MSFT) latest 10-Q say about their cloud revenue growth?
```

**MCP Tool Call:**
```json
{
  "tool": "search_sec_filings",
  "arguments": {
    "symbol": "MSFT",
    "query": "cloud revenue growth Azure",
    "limit": 5
  }
}
```

**Expected Response:**
Relevant excerpts from MSFT's SEC filings mentioning cloud revenue, with similarity scores.

---

## Example 3: Searching News Across Multiple Symbols

**User Query:**
```
Find recent news about AI partnerships from major tech companies
```

**MCP Tool Call:**
```json
{
  "tool": "search_news",
  "arguments": {
    "query": "AI partnership artificial intelligence collaboration",
    "limit": 10
  }
}
```

**Expected Response:**
News articles related to AI partnerships across all symbols in the database.

---

## Example 4: Cross-Reference Analysis

**User Query:**
```
Show me similar discussions about supply chain challenges from different companies
```

**Workflow:**
1. First, search for supply chain mentions to get an embedding:
```json
{
  "tool": "search_sec_filings",
  "arguments": {
    "symbol": "AAPL",
    "query": "supply chain disruptions manufacturing challenges",
    "limit": 1
  }
}
```

2. Then use the embedding to find similar content:
```json
{
  "tool": "get_similar_chunks",
  "arguments": {
    "embedding": [0.1, 0.2, 0.3, ...], // From step 1
    "limit": 10
  }
}
```

**Expected Response:**
Similar content chunks from various companies discussing supply chain issues.

---

## Example 5: Storing New Analysis (Write Operation)

**Note:** This requires a write-enabled database user (not omnitrade_readonly)

**User Query:**
```
Store this analyst report about NVDA in the database
```

**MCP Tool Call:**
```json
{
  "tool": "store_embedding",
  "arguments": {
    "symbol": "NVDA",
    "content": "NVIDIA Corporation reported record Q4 revenue of $22.1 billion, driven by data center growth...",
    "report_type": "analyst_report",
    "embedding": [0.123, 0.456, ...] // Pre-computed embedding
  }
}
```

**Expected Response:**
Confirmation of successful storage with the new record ID.

---

## Example 6: Comparative Analysis

**User Query:**
```
Compare the AI strategies mentioned in recent 10-K filings of Google, Microsoft, and Amazon
```

**Workflow:**
1. Search Google (GOOGL):
```json
{
  "tool": "search_sec_filings",
  "arguments": {
    "symbol": "GOOGL",
    "query": "artificial intelligence AI strategy machine learning",
    "limit": 5
  }
}
```

2. Search Microsoft (MSFT):
```json
{
  "tool": "search_sec_filings",
  "arguments": {
    "symbol": "MSFT",
    "query": "artificial intelligence AI strategy machine learning",
    "limit": 5
  }
}
```

3. Search Amazon (AMZN):
```json
{
  "tool": "search_sec_filings",
  "arguments": {
    "symbol": "AMZN",
    "query": "artificial intelligence AI strategy machine learning",
    "limit": 5
  }
}
```

**Expected Response:**
A comparative analysis highlighting similarities and differences in AI strategies across the three companies.

---

## Integration Example: Claude Desktop Configuration

Add to your Claude Desktop MCP configuration file:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "pgvector": {
      "command": "node",
      "args": [
        "C:\\Users\\admin\\Desktop\\OmniTrade\\mcp\\pgvector-server\\dist\\index.js"
      ],
      "env": {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_USER": "omnitrade_readonly",
        "DB_PASSWORD": "your_secure_password",
        "DB_NAME": "omnitrade"
      }
    }
  }
}
```

After adding this configuration and restarting Claude Desktop, you can ask Claude questions like:

- "What are the key risks mentioned in Apple's latest 10-K?"
- "Find news about Tesla's energy storage business"
- "Compare revenue recognition policies between Microsoft and Google"

---

## Testing the Server

Run the test script to verify your database setup:

```bash
# Set environment variables
export DB_HOST=localhost
export DB_USER=omnitrade_readonly
export DB_PASSWORD=your_password
export DB_NAME=omnitrade

# Run tests
npm test
```

Expected output:
```
Testing database connection...
✓ Connected to database
✓ pgvector extension is installed
✓ fundamental_data table exists
  Columns: id:uuid, symbol:varchar(10), report_type:varchar(20), content:text, embedding:user-defined, created_at:timestamptz
  Rows: 1523
✓ HNSW vector index exists

✓ All checks completed
```

---

## Error Handling

If you encounter errors:

### "pgvector extension not found"
```sql
-- Connect to your database
psql -d omnitrade

-- Install the extension
CREATE EXTENSION IF NOT EXISTS vector;
```

### "fundamental_data table not found"
```bash
# Run the schema migration
psql -d omnitrade -f backend/internal/database/schema.sql
```

### "Write operations not permitted"
The `omnitrade_readonly` role cannot write. For `store_embedding`, use a write-enabled user:

```json
{
  "env": {
    "DB_USER": "omnitrade_writer",  // Not omnitrade_readonly
    "DB_PASSWORD": "writer_password"
  }
}
```

---

## Performance Tips

1. **Use specific queries**: More specific queries return faster results
2. **Limit results**: Use `limit` parameter to avoid retrieving too much data
3. **Filter by symbol**: When possible, include the symbol for faster queries
4. **Index exists**: Ensure the HNSW index is created on the embedding column

---

## Security Best Practices

1. **Never commit `.env` files** with real credentials
2. **Use read-only role** for AI agents (Intelligence Plane)
3. **Separate write role** for ingestion pipelines (Action Plane)
4. **Validate embeddings** before storing (correct dimensions, valid values)
5. **Monitor query patterns** for unusual activity
