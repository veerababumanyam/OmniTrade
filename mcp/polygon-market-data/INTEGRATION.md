# Integration Guide: Polygon.io MCP Server with OmniTrade

This guide explains how to integrate the Polygon.io MCP server into the OmniTrade platform.

## Overview

The Polygon.io MCP server provides market data to the OmniTrade **Data Plane**, enabling the multi-agent AI system to access real-time and historical market data for analysis and trading decisions.

## Architecture Integration

```
┌─────────────────────────────────────────────────────────────┐
│                     OmniTrade Platform                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────┐      ┌──────────────────────────────┐   │
│  │  Data Plane   │──────│  MCP Server Layer            │   │
│  │               │      │  ┌────────────────────────┐  │   │
│  │  Market Data  │◄─────┤  │ Polygon.io MCP Server  │  │   │
│  │  Ingestion    │      │  └────────────────────────┘  │   │
│  └───────────────┘      └──────────────────────────────┘   │
│         │                                                     │
│         ▼                                                     │
│  ┌───────────────┐      ┌──────────────────────────────┐   │
│  │ Intelligence  │◄─────│  Google Genkit Agents        │   │
│  │ Plane         │      │  (Read-only DB access)       │   │
│  └───────────────┘      └──────────────────────────────┘   │
│         │                                                     │
│         ▼                                                     │
│  ┌───────────────┐      ┌──────────────────────────────┐   │
│  │  Action Plane │──────│  HITL Trade Approval         │   │
│  │               │      │  (Human-in-the-loop)         │   │
│  └───────────────┘      └──────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Configuration

### Step 1: Add MCP Server to Claude Code Config

Add to `~/.config/claude-code/config.json`:

```json
{
  "mcpServers": {
    "polygon-market-data": {
      "command": "node",
      "args": ["C:/Users/admin/Desktop/OmniTrade/mcp/polygon-market-data/dist/index.js"],
      "env": {
        "POLYGON_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Step 2: Set Environment Variable

```bash
export POLYGON_API_KEY=your_api_key_here
```

Or create a `.env` file in the MCP server directory:

```bash
cd C:/Users/admin/Desktop/OmniTrade/mcp/polygon-market-data
cp .env.example .env
# Edit .env and add your API key
```

### Step 3: Restart Claude Code

Restart Claude Code to load the new MCP server.

## Usage in OmniTrade Agents

### Example 1: Real-time Market Monitoring

```typescript
// In your Go backend, the AI agent can request market data via MCP

// Agent query: "What's the current price of Apple?"
// MCP tool call:
{
  "tool": "get_quote",
  "arguments": {
    "symbol": "AAPL"
  }
}
```

### Example 2: Technical Analysis

```typescript
// Agent query: "Analyze the 50-day moving average for NVDA"
// MCP tool call:
{
  "tool": "get_aggregates",
  "arguments": {
    "symbol": "NVDA",
    "timespan": "day",
    "from": "2023-12-01",
    "to": "2024-01-15"
  }
}
```

### Example 3: Finding Trading Opportunities

```typescript
// Agent query: "Find high-volume tech stocks from today"
// MCP workflow:
// 1. List symbols
{
  "tool": "list_symbols",
  "arguments": {
    "search": "technology",
    "ticker_type": "CS",
    "limit": 50
  }
}

// 2. Get quotes for each symbol
// 3. Filter by volume and price action
```

## Data Flow

### 1. Market Data Ingestion
```
Polygon.io REST API → MCP Server → OmniTrade Data Plane
```

### 2. Agent Analysis
```
Genkit Agent → MCP Tool Call → Polygon.io API → Structured JSON → Agent Processing
```

### 3. Trade Proposal Generation
```
Agent Analysis + Market Data → Trade Proposal → HITL Approval → Action Plane
```

## API Rate Limits

### Free Tier (5 calls/minute)
- Suitable for development and testing
- Enough for periodic market monitoring
- NOT sufficient for real-time trading

### Recommended for Production
- **Basic Tier** ($149/month): 300 calls/minute
- **Advanced Tier** ($499/month): 1000 calls/minute

See [Polygon.io pricing](https://polygon.io/pricing) for details.

## Security Considerations

1. **API Key Protection**:
   - Never commit `.env` file
   - Use environment variables in production
   - Rotate API keys regularly

2. **Read-Only Access**:
   - MCP server only reads data
   - No write operations to Polygon.io
   - Aligns with OmniTrade's read-only Intelligence Plane

3. **Rate Limiting**:
   - Implement client-side rate limiting
   - Cache responses to minimize API calls
   - Monitor usage to avoid unexpected costs

## Monitoring and Logging

The MCP server logs errors to stderr:

```json
{
  "error": "Polygon.io API error: 429 Too Many Requests",
  "tool": "get_quote",
  "arguments": { "symbol": "AAPL" }
}
```

Monitor for:
- Rate limit errors (429)
- Invalid symbols (404)
- Authentication failures (401)

## Troubleshooting

### Server Not Starting
```bash
# Check if the MCP server is built
cd C:/Users/admin/Desktop/OmniTrade/mcp/polygon-market-data
npm run build

# Verify the build output exists
ls dist/index.js
```

### API Key Issues
```bash
# Verify API key is set
echo $POLYGON_API_KEY

# Test API key manually
curl "https://api.polygon.io/v3/reference/tickers?apiKey=YOUR_API_KEY&limit=1"
```

### MCP Server Not Connecting
```bash
# Check Claude Code config
cat ~/.config/claude-code/config.json

# Verify the path to dist/index.js is correct
ls -la C:/Users/admin/Desktop/OmniTrade/mcp/polygon-market-data/dist/index.js
```

## Next Steps

1. **Add More Data Sources**: Create additional MCP servers for:
   - Crypto data (CoinGecko, Binance)
   - Forex data (OANDA, Fixer.io)
   - News and sentiment (News API, Twitter)

2. **Implement Caching**: Add Redis layer to cache API responses
3. **Add WebSocket Support**: Implement real-time streaming for live data
4. **Create Data Pipeline**: Integrate with OmniTrade's existing ingestion system

## References

- [OmniTrade Technical Specification](../../docs/Technical_Specification.md)
- [MCP Documentation](https://modelcontextprotocol.io/)
- [Polygon.io API Documentation](https://polygon.io/docs/stocks)

## Support

For issues or questions:
- Check the main OmniTrade documentation
- Review MCP server logs
- Consult Polygon.io API docs
- Open an issue in the OmniTrade repository
