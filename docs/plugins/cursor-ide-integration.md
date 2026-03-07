
Use OmniTrade MCP tools directly from Cursor IDE with LiteLLM Gateway integration.

## Setup Instructions

### 1. Open Cursor Settings
Use the keyboard shortcut `⇧+⌘+J` (Mac) or `Ctrl+Shift+J` (Windows/Linux)

### 2. Navigate to MCP Tools
Go to the **MCP Tools** tab and click **New MCP Server**

### 3. Add Configuration
Copy the JSON configuration below and paste it into Cursor, then save with `Cmd+S` or `Ctrl+S`

## Configuration

### Option A: LiteLLM Gateway (Recommended)

Connect to OmniTrade's MCP servers through the LiteLLM Gateway:

```json
{
  "mcpServers": {
    "OmniTrade_LiteLLM": {
      "url": "http://localhost:4000/mcp",
      "headers": {
        "x-litellm-api-key": "Bearer YOUR_LITELLM_API_KEY"
      }
    }
  }
}
```

### Option B: Direct MCP Servers

Connect directly to individual OmniTrade MCP servers:

```json
{
  "mcpServers": {
    "polygon-market-data": {
      "command": "node",
      "args": ["C:\\Users\\admin\\Desktop\\OmniTrade\\mcp\\polygon-market-data\\dist\\index.js"],
      "env": {
        "POLYGON_API_KEY": "YOUR_POLYGON_API_KEY"
      }
    },
    "sec-filings": {
      "command": "node",
      "args": ["C:\\Users\\admin\\Desktop\\OmniTrade\\mcp\\sec-filings\\dist\\index.js"],
      "env": {
        "SEC_API_KEY": "YOUR_SEC_API_KEY"
      }
    },
    "pgvector-server": {
      "command": "node",
      "args": ["C:\\Users\\admin\\Desktop\\OmniTrade\\mcp\\pgvector-server\\dist\\index.js"],
      "env": {
        "DATABASE_URL": "postgresql://postgres:postgres@127.0.0.1:5432/omnitrade"
      }
    },
    "alpaca-broker": {
      "command": "node",
      "args": ["C:\\Users\\admin\\Desktop\\OmniTrade\\mcp\\alpaca-broker\\dist\\index.js"],
      "env": {
        "ALPACA_API_KEY": "YOUR_ALPACA_API_KEY",
        "ALPACA_SECRET_KEY": "YOUR_ALPACA_SECRET_KEY"
      }
    },
    "fmp": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sse", "https://financialmodelingprep.com/mcp?apikey=YOUR_FMP_API_KEY"]
    }
  }
}
```

## Available Tools

Once connected, you'll have access to these OmniTrade tools in Cursor:

| Tool | Server | Description |
|------|--------|-------------|
| `get_quote` | polygon-market-data | Real-time stock quotes |
| `get_aggregates` | polygon-market-data | Historical OHLCV data |
| `list_filings` | sec-filings | SEC filing searches |
| `fetch_filing` | sec-filings | Full filing content |
| `search_sec_filings` | pgvector-server | Semantic search on filings |
| `search_news` | pgvector-server | News with sentiment |
| `get_account` | alpaca-broker | Trading account info |
| `place_order` | alpaca-broker | Execute trades |

## Limiting Tools

Limit tools to specific MCP servers by passing the `x-mcp-servers` header:

```json
{
  "headers": {
    "x-litellm-api-key": "Bearer YOUR_KEY",
    "x-mcp-servers": "polygon-market-data,sec-filings"
  }
}
```

## Environment Variables

Make sure these are set in your environment or `.env` file:

```bash
POLYGON_API_KEY=your_key
SEC_API_KEY=your_key
ALPACA_API_KEY=your_key
ALPACA_SECRET_KEY=your_key
FMP_API_KEY=your_key
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/omnitrade
```