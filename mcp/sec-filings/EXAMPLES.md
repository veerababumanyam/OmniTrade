# SEC Filings MCP Server - Usage Examples

This document provides practical examples for using the SEC Filings MCP server.

## Prerequisites

Ensure you have:
1. Built the server: `npm run build`
2. Created a `.env` file with your USER_AGENT
3. Integrated the server with Claude Desktop or another MCP client

## Example 1: List Recent 10-K Filings

**Tool**: `list_filings`

```json
{
  "symbol": "AAPL",
  "filing_type": "10-K",
  "limit": 5
}
```

**Response**:
```json
{
  "symbol": "AAPL",
  "cik": "320193",
  "count": 5,
  "filings": [
    {
      "accessionNumber": "0000320193-23-000108",
      "filingType": "10-K",
      "filingDate": "2023-11-03",
      "fileNumber": "001-32345",
      "form": "10-K",
      "url": "https://www.sec.gov/edgar/data/320193/000032019323000108/0000320193-23-000108.idx",
      "documentUrl": "https://www.sec.gov/edgar/data/320193/000032019323000108/aapl-20230930.htm"
    }
  ]
}
```

## Example 2: Fetch Full 10-K Text

**Tool**: `fetch_filing`

```json
{
  "symbol": "MSFT",
  "filing_type": "10-K",
  "year": 2023
}
```

**Response**:
```json
{
  "url": "https://www.sec.gov/edgar/data/789019/0001564590-23-000426/msft-20230630.htm",
  "form": "10-K",
  "filingDate": "2023-07-27",
  "company": "MICROSOFT CORP",
  "cik": "789019",
  "text": "UNITED STATES SECURITIES AND EXCHANGE COMMISSION...",
  "metadata": {
    "accessionNumber": "0001564590-23-000426",
    "fileNumber": "001-37845",
    "documentUrl": "https://www.sec.gov/edgar/data/789019/0001564590-23-000426/msft-20230630.htm"
  }
}
```

## Example 3: Chunk Filing for Embeddings

**Tool**: `chunk_filing`

```json
{
  "filing_url": "https://www.sec.gov/edgar/data/320193/000032019323000108/aapl-20230930.htm",
  "max_chunk_size": 512
}
```

**Response**:
```json
{
  "url": "https://www.sec.gov/edgar/data/320193/000032019323000108/aapl-20230930.htm",
  "form": "10-K",
  "company": "APPLE INC",
  "totalChunks": 245,
  "totalCharacters": 498720,
  "estimatedTotalTokens": 124680,
  "chunks": [
    {
      "chunkNumber": 1,
      "text": "UNITED STATES SECURITIES AND EXCHANGE COMMISSION...",
      "startChar": 0,
      "endChar": 2048,
      "estimatedTokens": 512
    }
  ]
}
```

## Example 4: Search Filings

**Tool**: `search_filings`

```json
{
  "symbol": "GOOGL",
  "query": "artificial intelligence",
  "filing_type": "10-K",
  "year": 2023,
  "limit_results": 20
}
```

**Response**:
```json
{
  "symbol": "GOOGL",
  "cik": "1652044",
  "query": "artificial intelligence",
  "totalMatches": 47,
  "filingsSearched": 1,
  "results": [
    {
      "filing": {
        "accessionNumber": "0001652044-23-000016",
        "filingType": "10-K",
        "filingDate": "2023-02-03",
        "form": "10-K",
        "url": "...",
        "documentUrl": "..."
      },
      "matches": 47,
      "results": [
        {
          "matchNumber": 1,
          "context": "...our artificial intelligence (AI) products and services...",
          "position": 12456,
          "snippet": "...our artificial intelligence (AI) products and services are..."
        }
      ]
    }
  ]
}
```

## Example 5: List All Recent Filings (No Type Filter)

**Tool**: `list_filings`

```json
{
  "symbol": "TSLA",
  "limit": 20
}
```

This returns the most recent 20 filings of any type for Tesla, including 10-Q, 8-K, DEF 14A, etc.

## Example 6: Fetch Specific Filing by Accession Number

**Tool**: `fetch_filing`

```json
{
  "symbol": "AMZN",
  "accession_number": "0001013762-23-000001",
  "cik": "1018724"
}
```

## Common Workflows

### Workflow 1: Research Company's AI Strategy

```json
// Step 1: Get recent 10-K
{"tool": "fetch_filing", "symbol": "NVDA", "filing_type": "10-K"}

// Step 2: Search for AI-related content
{"tool": "search_filings", "symbol": "NVDA", "query": "AI", "filing_type": "10-K"}

// Step 3: Chunk for detailed analysis
{"tool": "chunk_filing", "filing_url": "...", "max_chunk_size": 512}
```

### Workflow 2: Compare Risk Factors

```json
// Search for "risk factors" in multiple companies
{"tool": "search_filings", "symbol": "AAPL", "query": "risk factors"}
{"tool": "search_filings", "symbol": "MSFT", "query": "risk factors"}
{"tool": "search_filings", "symbol": "GOOGL", "query": "risk factors"}
```

### Workflow 3: Monitor Recent Events (8-K Filings)

```json
// List recent 8-K filings for material events
{"tool": "list_filings", "symbol": "META", "filing_type": "8-K", "limit": 10}
```

## Tips for Effective Queries

1. **Be Specific**: Use exact company symbols (AAPL, not Apple)
2. **Filter by Type**: Specify `filing_type` for faster results
3. **Use Year**: Filter by year for historical data
4. **Chunk Strategically**: Use 512 tokens for most embeddings
5. **Search Carefully**: Common terms return many results - be specific

## Error Handling

### Invalid Symbol
```json
{
  "error": "Could not find CIK for symbol: INVALID"
}
```

### No Filings Found
```json
{
  "error": "No 10-K filings found for SYMBOL"
}
```

### Network Error
```json
{
  "error": "Failed to fetch filing content..."
}
```

## Integration Example (Claude Desktop)

```json
{
  "mcpServers": {
    "sec-filings": {
      "command": "node",
      "args": ["C:\\Users\\admin\\Desktop\\OmniTrade\\mcp\\sec-filings\\dist\\index.js"],
      "env": {
        "USER_AGENT": "OmniTrade admin@example.com"
      }
    }
  }
}
```

## Rate Limiting Best Practices

1. Cache frequently accessed filings
2. Use specific queries to avoid over-fetching
3. Implement exponential backoff for retries
4. Respect SEC's 10 requests/second guideline

## Advanced Usage

### Using CIK Directly

For faster lookups, use the CIK instead of symbol:

```json
{
  "symbol": "AAPL",
  "cik": "320193",
  "filing_type": "10-K"
}
```

### Combining with Other MCP Servers

```json
// Get stock data from another MCP server
// Then fetch SEC filings for context
// Finally, chunk and search for specific terms
```

## Support

For issues or questions:
- Check the main README.md
- Review SEC EDGAR documentation
- Test with known symbols (AAPL, MSFT, GOOGL)
