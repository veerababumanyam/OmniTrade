# Quick Start Guide - SEC Filings MCP Server

Get up and running with the SEC Filings MCP server in 5 minutes.

## Step 1: Install Dependencies

```bash
cd C:\Users\admin\Desktop\OmniTrade\mcp\sec-filings
npm install
```

## Step 2: Configure Environment

```bash
# Copy the example environment file
copy .env.example .env

# Edit .env and set your USER_AGENT
# Format: YourAppName YourEmail
```

Example `.env` file:
```env
USER_AGENT=OmniTrade your-email@example.com
```

**Important**: SEC EDGAR requires a valid User-Agent header. Use your app name and email.

## Step 3: Build the Server

```bash
npm run build
```

## Step 4: Test the Server

```bash
npm test
```

You should see:
```
✅ Server started successfully
✅ Server logs: SEC Filings MCP server running on stdio
```

## Step 5: Integrate with Claude Desktop

### Windows

Edit `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sec-filings": {
      "command": "node",
      "args": ["C:\\Users\\admin\\Desktop\\OmniTrade\\mcp\\sec-filings\\dist\\index.js"],
      "env": {
        "USER_AGENT": "OmniTrade your-email@example.com"
      }
    }
  }
}
```

### macOS

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sec-filings": {
      "command": "node",
      "args": ["/Users/admin/Desktop/OmniTrade/mcp/sec-filings/dist/index.js"],
      "env": {
        "USER_AGENT": "OmniTrade your-email@example.com"
      }
    }
  }
}
```

## Step 6: Restart Claude Desktop

After updating the config, restart Claude Desktop to load the MCP server.

## Step 7: Use the Tools

In Claude, you can now:

### List Filings
```
List the recent 10-K filings for Apple (AAPL)
```

### Fetch Filing
```
Fetch the 2023 10-K filing for Microsoft (MSFT)
```

### Search Filings
```
Search Google's 2023 10-K for mentions of "artificial intelligence"
```

### Chunk Filing
```
Chunk the latest Apple 10-K into 512-token pieces for embedding
```

## Common Commands

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start server (for testing)
npm start

# Rebuild and start
npm run dev

# Watch for changes
npm run watch

# Test server startup
npm test
```

## Troubleshooting

### Server Won't Start

1. Check that dependencies are installed: `npm install`
2. Verify TypeScript build succeeded: `npm run build`
3. Check `.env` file exists with valid USER_AGENT

### "Could not find CIK" Error

- Verify the stock symbol is correct (AAPL, MSFT, GOOGL)
- Check SEC EDGAR has data for the company
- Try a known symbol like "AAPL" to test

### Network Errors

- Check your internet connection
- Verify SEC EDGAR is accessible: https://www.sec.gov
- Check firewall settings

### TypeScript Build Errors

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

## Next Steps

- Read [README.md](./README.md) for detailed documentation
- Check [EXAMPLES.md](./EXAMPLES.md) for usage examples
- Review [SEC EDGAR API docs](https://www.sec.gov/edgar/sec-api-documentation)

## Support

For issues:
1. Check the troubleshooting section above
2. Verify your `.env` configuration
3. Test with known symbols (AAPL, MSFT, GOOGL)
4. Review server logs in stderr

## Quick Reference

| Tool | Description | Example |
|------|-------------|---------|
| `list_filings` | List recent filings | AAPL 10-K last 5 |
| `fetch_filing` | Get full filing text | MSFT 2023 10-K |
| `chunk_filing` | Split into chunks | 512 token chunks |
| `search_filings` | Search filing text | Find "AI" in GOOGL |

## Rate Limits

- SEC allows ~10 requests per second
- This server uses a 30-second timeout
- Cache frequently accessed filings
- Implement backoff for retries
