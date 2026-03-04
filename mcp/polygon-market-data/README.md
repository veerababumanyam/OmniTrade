# Polygon.io Market Data MCP Server

A Model Context Protocol (MCP) server that provides access to Polygon.io market data API. This server enables AI agents to retrieve real-time and historical stock market data.

## Features

- **Latest Quotes**: Get current stock prices, bid/ask, and daily OHLCV data
- **Historical Aggregates**: Retrieve OHLCV bars for technical analysis (minute, hour, day, week, month, quarter, year)
- **Symbol Search**: Find ticker symbols with filtering by type and market
- **Trade Data**: Access individual trade-level data with price and size information

## Installation

### Prerequisites

- Node.js >= 18.0.0
- Polygon.io API key ([Get your free API key](https://polygon.io/))
  - Free tier: 5 API calls/minute
  - Paid tiers available for higher limits

### Setup

1. Clone or navigate to this directory:
```bash
cd C:/Users/admin/Desktop/OmniTrade/mcp/polygon-market-data
```

2. Install dependencies:
```bash
npm install
```

3. Build the TypeScript code:
```bash
npm run build
```

4. Set up your environment variables:
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your API key
# POLYGON_API_KEY=your_api_key_here
```

5. Start the server:
```bash
npm start
```

## Available Tools

### `get_quote`

Get the latest quote for a stock ticker.

**Parameters:**
- `symbol` (string, required): Stock ticker symbol (e.g., AAPL, MSFT, GOOGL)

**Returns:**
- Last price and size
- Day OHLCV (open, high, low, close, volume, vwap)
- Previous day OHLCV

**Example:**
```json
{
  "symbol": "AAPL"
}
```

### `get_aggregates`

Get OHLCV aggregate bars for historical price data.

**Parameters:**
- `symbol` (string, required): Stock ticker symbol
- `timespan` (string, required): Size of time window - `minute`, `hour`, `day`, `week`, `month`, `quarter`, `year`
- `from` (string, required): Start date (YYYY-MM-DD or Unix timestamp in ms)
- `to` (string, required): End date (YYYY-MM-DD or Unix timestamp in ms)
- `multiplier` (number, optional): Number of timespans per bar (e.g., 5 for 5-minute bars)
- `adjusted` (boolean, optional): Adjust for stock splits (default: true)

**Returns:**
- Array of OHLCV bars with timestamps, volume, and vwap

**Example:**
```json
{
  "symbol": "AAPL",
  "timespan": "day",
  "from": "2024-01-01",
  "to": "2024-01-31",
  "adjusted": true
}
```

### `list_symbols`

Search for and list ticker symbols.

**Parameters:**
- `ticker_type` (string, optional): Filter by type - `CS` (Common Stock), `ETF`, `CRYPTO`, etc.
- `market` (string, optional): Filter by market - `stocks`, `crypto`, `fx`
- `search` (string, optional): Search term (searches ticker and company name)
- `limit` (number, optional): Max results (default: 10, max: 1000)

**Returns:**
- Array of matching symbols with ticker, name, market, type, and currency

**Example:**
```json
{
  "search": "Apple",
  "market": "stocks",
  "limit": 10
}
```

### `get_trades`

Get recent trades for a ticker.

**Parameters:**
- `symbol` (string, required): Stock ticker symbol
- `timestamp` (string, optional): Query trades for specific timestamp or date (YYYY-MM-DD or Unix ms)
- `limit` (number, optional): Max results (default: 10, max: 50000)

**Returns:**
- Array of individual trades with price, size, timestamp, exchange, and conditions

**Example:**
```json
{
  "symbol": "AAPL",
  "timestamp": "2024-01-15",
  "limit": 100
}
```

## Configuration

Add the MCP server to your Claude Code configuration (`~/.config/claude-code/config.json`):

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

## Development

### Build the project:
```bash
npm run build
```

### Watch mode for development:
```bash
npm run watch
```

### Run in development mode:
```bash
npm run dev
```

## Error Handling

The server returns structured JSON error messages for:

- Missing or invalid parameters
- API rate limits (free tier: 5 calls/minute)
- Invalid ticker symbols
- Network issues
- Authentication failures (invalid API key)

Example error response:
```json
{
  "error": "Polygon.io API error: 404 Not Found",
  "tool": "get_quote",
  "arguments": { "symbol": "INVALID" }
}
```

## API Limits

### Free Tier (5 calls/minute)
- Suitable for testing and light usage
- Real-time quotes with 15-minute delay
- No aggregate data delays

### Paid Tiers
- Starter: $49/month - 5 calls/minute, no delays
- Basic: $149/month - 300 calls/minute
- Advanced: $499/month - 1000 calls/minute

See [Polygon.io pricing](https://polygon.io/pricing) for details.

## Resources

- [Polygon.io API Documentation](https://polygon.io/docs/stocks/get_v3_quotes__stocksticker__latest)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## License

MIT

## Support

For issues with this MCP server, please refer to the OmniTrade project documentation.
For Polygon.io API issues, contact Polygon.io support.
