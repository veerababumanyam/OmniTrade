# SEC Filings MCP Server

A Model Context Protocol (MCP) server for accessing and parsing SEC EDGAR filings. This server enables AI assistants to fetch, search, and chunk SEC filings including 10-K, 10-Q, 8-K, and other forms.

## Features

- **List Filings**: Get recent SEC filings for any publicly traded company
- **Fetch Full Text**: Retrieve complete filing documents with metadata
- **Smart Chunking**: Split filings into ~512 token chunks for embeddings
- **Text Search**: Search filing content for specific terms and phrases
- **HTML Parsing**: Extract clean text from SEC HTML documents

## Installation

### Prerequisites

- Node.js 18+ and npm
- TypeScript (included in dev dependencies)

### Setup

1. **Navigate to the directory**:
   ```bash
   cd C:\Users\admin\Desktop\OmniTrade\mcp\sec-filings
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` and set your User-Agent**:
   ```env
   # Required: SEC EDGAR requires a User-Agent header
   # Format: YourAppName YourEmail
   USER_AGENT=OmniTrade admin@example.com
   ```

   **Important**: SEC EDGAR requires a valid User-Agent header. Use your app name and email address.

## Build & Run

### Development Mode

```bash
npm run dev
```

This compiles TypeScript and starts the server.

### Production Mode

```bash
npm run build
npm start
```

### Watch Mode

```bash
npm run watch
```

Automatically recompiles on file changes.

## MCP Tools

### 1. `list_filings`

List recent SEC filings for a stock symbol.

**Parameters**:
- `symbol` (required): Stock ticker symbol (e.g., "AAPL", "MSFT", "GOOGL")
- `filing_type` (optional): Filter by filing type
  - Options: "10-K", "10-Q", "8-K", "DEF 14A", "S-1", "13F"
- `limit` (optional): Maximum filings to return (default: 10)

**Example**:
```json
{
  "symbol": "AAPL",
  "filing_type": "10-K",
  "limit": 5
}
```

**Returns**: Array of filings with metadata including accession numbers, filing dates, and document URLs.

### 2. `fetch_filing`

Fetch the full text content of a specific SEC filing.

**Parameters**:
- `symbol` (required): Stock ticker symbol
- `filing_type` (optional): Filing type to fetch (default: "10-K")
- `year` (optional): Year to filter (e.g., 2023 for 10-K)
- `accession_number` (optional): Specific accession number
- `cik` (optional): SEC CIK number (bypasses symbol lookup)

**Example**:
```json
{
  "symbol": "AAPL",
  "filing_type": "10-K",
  "year": 2023
}
```

**Returns**: Complete filing text with metadata (form type, filing date, company info, etc.).

### 3. `chunk_filing`

Split a SEC filing into chunks for embedding or processing.

**Parameters**:
- `filing_url` (required): Full URL to the SEC filing document
- `max_chunk_size` (optional): Target chunk size in tokens (default: 512)
- `cik` (optional): Required for non-SEC URLs
- `accession_number` (optional): Required for non-SEC URLs
- `form` (optional): Required for non-SEC URLs

**Example**:
```json
{
  "filing_url": "https://www.sec.gov/edgar/data/320193/000032019323000108/aapl-20230930.htm",
  "max_chunk_size": 512
}
```

**Returns**: Array of text chunks with metadata (chunk number, position, estimated token count).

### 4. `search_filings`

Search filing text for specific terms or phrases.

**Parameters**:
- `symbol` (required): Stock ticker symbol
- `query` (required): Search query text
- `filing_type` (optional): Filter by filing type
- `year` (optional): Year to search within
- `limit_results` (optional): Max results per filing (default: 50)

**Example**:
```json
{
  "symbol": "MSFT",
  "query": "artificial intelligence",
  "filing_type": "10-K",
  "year": 2023
}
```

**Returns**: Search results with context snippets and position information.

## Integration with Claude Desktop

Add this server to your Claude Desktop configuration file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

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

## SEC EDGAR API Notes

### Rate Limiting

- SEC requests 10 requests per second maximum
- This server uses a 30-second timeout
- Implement caching in your application for frequently accessed filings

### User-Agent Requirement

SEC EDGAR **requires** a User-Agent header with:
- Application name
- Contact email (preferred)
- Failure to include may result in IP blocking

Example: `OmniTrade admin@example.com`

### Data Coverage

- **10-K**: Annual reports (comprehensive financial information)
- **10-Q**: Quarterly reports (less detailed than 10-K)
- **8-K**: Current reports (material events)
- **DEF 14A**: Proxy statements (director info, executive compensation)
- **S-1**: Registration statements (new securities offerings)
- **13F**: Institutional investment manager holdings

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MCP Client (Claude)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │ stdio
┌──────────────────────────▼──────────────────────────────────┐
│                   MCP Server (index.ts)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   Tool Handlers                         │ │
│  │  • list_filings    • fetch_filing                      │ │
│  │  • chunk_filing    • search_filings                    │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   SEC Client                            │ │
│  │  • CIK Lookup    • Submission Index                    │ │
│  │  • Document Fetch  • HTML Parsing                      │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│              SEC EDGAR (sec.gov)                            │
│  • CIK Lookup API    • Company Submissions                  │
│  • Filing Documents   • Full-Text Search                    │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling

The server returns structured error messages:

```json
{
  "error": "Could not find CIK for symbol: INVALID",
  "tool": "list_filings",
  "arguments": {"symbol": "INVALID"}
}
```

Common errors:
- **Invalid Symbol**: Ticker not found in SEC database
- **No Filings**: No filings match the criteria
- **Network Error**: SEC API timeout or connection issue
- **Parse Error**: Malformed HTML or document structure

## Performance Tips

1. **Use CIK directly**: If you know the CIK, pass it to skip symbol lookup
2. **Limit results**: Use `limit` parameter to reduce processing time
3. **Cache filings**: Store frequently accessed filings locally
4. **Chunk strategically**: Use 512 tokens for most embedding models

## Development

### Project Structure

```
sec-filings/
├── src/
│   └── index.ts          # Main MCP server
├── dist/                 # Compiled JavaScript (generated)
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── .env.example          # Environment template
├── .gitignore
└── README.md
```

### Adding New Tools

1. Define the tool in `TOOLS` array
2. Add a case in `CallToolRequestSchema` handler
3. Implement the tool logic
4. Update this README with usage examples

## License

MIT

## Support

For issues with:
- **This MCP server**: Check the troubleshooting section
- **SEC EDGAR API**: Visit [SEC EDGAR Search Help](https://www.sec.gov/edgar/search-faq)
- **Data content**: Refer to SEC official documentation

## References

- [SEC EDGAR API Documentation](https://www.sec.gov/edgar/sec-api-documentation)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [SEC Filing Types](https://www.sec.gov/forms)
