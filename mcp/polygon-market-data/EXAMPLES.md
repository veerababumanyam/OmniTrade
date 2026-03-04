# Polygon.io MCP Server - Usage Examples

This document provides practical examples for using each tool in the Polygon.io MCP server.

## Setup

First, ensure the server is running and configured in your Claude Code config:

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

## Tool Examples

### 1. Get Latest Quote

Get the current price and daily data for Apple Inc.:

```json
{
  "tool": "get_quote",
  "arguments": {
    "symbol": "AAPL"
  }
}
```

**Sample Response:**
```json
{
  "symbol": "AAPL",
  "last_price": 178.72,
  "last_size": 100,
  "last_timestamp": "2024-01-15T14:30:00.000Z",
  "day": {
    "open": 175.50,
    "high": 179.00,
    "low": 174.80,
    "close": 178.72,
    "volume": 52340000,
    "vwap": 177.25
  },
  "previous_day": {
    "open": 176.20,
    "high": 177.80,
    "low": 175.30,
    "close": 177.50,
    "volume": 48200000,
    "vwap": 176.75
  }
}
```

### 2. Get Historical Aggregates

Get daily OHLCV data for Apple for January 2024:

```json
{
  "tool": "get_aggregates",
  "arguments": {
    "symbol": "AAPL",
    "timespan": "day",
    "from": "2024-01-01",
    "to": "2024-01-31",
    "adjusted": true
  }
}
```

**Sample Response:**
```json
{
  "symbol": "AAPL",
  "timespan": "day",
  "from": "2024-01-01",
  "to": "2024-01-31",
  "multiplier": 1,
  "adjusted": true,
  "bars": [
    {
      "timestamp": "2024-01-02T00:00:00.000Z",
      "open": 175.50,
      "high": 178.25,
      "low": 174.80,
      "close": 177.50,
      "volume": 52340000,
      "vwap": 177.25,
      "trades": 456234
    },
    {
      "timestamp": "2024-01-03T00:00:00.000Z",
      "open": 178.00,
      "high": 179.50,
      "low": 177.20,
      "close": 179.25,
      "volume": 48200000,
      "vwap": 178.75,
      "trades": 423456
    }
  ]
}
```

Get 5-minute bars for intraday analysis:

```json
{
  "tool": "get_aggregates",
  "arguments": {
    "symbol": "AAPL",
    "timespan": "minute",
    "multiplier": 5,
    "from": "2024-01-15",
    "to": "2024-01-15"
  }
}
```

Get weekly bars for a longer-term view:

```json
{
  "tool": "get_aggregates",
  "arguments": {
    "symbol": "AAPL",
    "timespan": "week",
    "from": "2023-01-01",
    "to": "2024-01-01"
  }
}
```

### 3. List/Search Symbols

Search for Apple-related stocks:

```json
{
  "tool": "list_symbols",
  "arguments": {
    "search": "Apple",
    "market": "stocks",
    "limit": 10
  }
}
```

**Sample Response:**
```json
{
  "count": 3,
  "symbols": [
    {
      "ticker": "AAPL",
      "name": "Apple Inc.",
      "market": "stocks",
      "type": "CS",
      "currency": "USD",
      "last_updated": "2024-01-15T20:00:00.000Z"
    },
    {
      "ticker": "AAPL150117C00120000",
      "name": "AAPL Jan 2017 120.0 Call",
      "market": "stocks",
      "type": "OPTION",
      "currency": "USD",
      "last_updated": "2017-01-13T05:59:58.000Z"
    }
  ]
}
```

Find all ETFs:

```json
{
  "tool": "list_symbols",
  "arguments": {
    "ticker_type": "ETF",
    "market": "stocks",
    "limit": 20
  }
}
```

Search for crypto symbols:

```json
{
  "tool": "list_symbols",
  "arguments": {
    "market": "crypto",
    "search": "BTC",
    "limit": 10
  }
}
```

### 4. Get Trades

Get the most recent trades for Apple:

```json
{
  "tool": "get_trades",
  "arguments": {
    "symbol": "AAPL",
    "limit": 100
  }
}
```

**Sample Response:**
```json
{
  "symbol": "AAPL",
  "count": 100,
  "trades": [
    {
      "timestamp": "2024-01-15T14:30:00.000Z",
      "price": 178.72,
      "size": 100,
      "exchange": 4,
      "conditions": [0],
      "trade_id": 123456789
    },
    {
      "timestamp": "2024-01-15T14:30:00.001Z",
      "price": 178.71,
      "size": 200,
      "exchange": 12,
      "conditions": [0],
      "trade_id": 123456790
    }
  ]
}
```

Get trades for a specific historical date:

```json
{
  "tool": "get_trades",
  "arguments": {
    "symbol": "AAPL",
    "timestamp": "2024-01-15",
    "limit": 1000
  }
}
```

Get trades for a specific timestamp (Unix ms):

```json
{
  "tool": "get_trades",
  "arguments": {
    "symbol": "AAPL",
    "timestamp": "1705305600000",
    "limit": 500
  }
}
```

## Common Use Cases

### 1. Building a Simple Moving Average (SMA) Crossover Strategy

```javascript
// 1. Get daily aggregates for the past 100 days
{
  "tool": "get_aggregates",
  "arguments": {
    "symbol": "AAPL",
    "timespan": "day",
    "from": "2023-10-01",
    "to": "2024-01-15"
  }
}

// 2. Calculate 50-day and 200-day SMAs from the response
// 3. Identify crossover points
```

### 2. Finding High-Volume Trading Days

```javascript
// 1. Get daily aggregates
{
  "tool": "get_aggregates",
  "arguments": {
    "symbol": "AAPL",
    "timespan": "day",
    "from": "2024-01-01",
    "to": "2024-01-31"
  }
}

// 2. Sort by volume descending
// 3. Identify top 5 highest volume days
```

### 3. Real-Time Price Monitoring

```javascript
// 1. Get latest quote
{
  "tool": "get_quote",
  "arguments": {
    "symbol": "AAPL"
  }
}

// 2. Compare current price to previous day close
// 3. Calculate daily return
```

### 4. Intraday Trading Analysis

```javascript
// 1. Get 5-minute bars for today
{
  "tool": "get_aggregates",
  "arguments": {
    "symbol": "AAPL",
    "timespan": "minute",
    "multiplier": 5,
    "from": "2024-01-15",
    "to": "2024-01-15"
  }
}

// 2. Identify support/resistance levels
// 3. Look for breakouts or breakdowns
```

## Error Handling

The MCP server returns structured errors for various scenarios:

### Invalid Symbol
```json
{
  "error": "No quote data found for symbol",
  "symbol": "INVALID_TICKER"
}
```

### Missing Required Parameters
```json
{
  "error": "Symbol is required and must be a string"
}
```

### API Rate Limit (Free Tier)
```json
{
  "error": "Polygon.io API error: 429 Too Many Requests"
}
```

## Best Practices

1. **Cache Results**: Store quote and aggregate data to minimize API calls
2. **Use Larger Timespans for Historical Data**: Day or week timespans are more efficient than minute data
3. **Limit Trade Data Requests**: Trade data can be large; use reasonable limits
4. **Handle Errors Gracefully**: Always check for error responses
5. **Respect Rate Limits**: Free tier is 5 calls/minute
6. **Use Adjusted Data**: For long-term analysis, use `adjusted: true` to account for splits

## Popular Ticker Symbols

### Stocks
- **AAPL** - Apple Inc.
- **MSFT** - Microsoft Corporation
- **GOOGL** - Alphabet Inc.
- **AMZN** - Amazon.com Inc.
- **TSLA** - Tesla Inc.
- **META** - Meta Platforms Inc.
- **NVDA** - NVIDIA Corporation

### ETFs
- **SPY** - SPDR S&P 500 ETF
- **QQQ** - Invesco QQQ Trust
- **IWM** - iShares Russell 2000 ETF
- **GLD** - SPDR Gold Shares
- **TLT** - iShares 20+ Year Treasury Bond ETF

### Crypto
- **X:BTCUSD** - Bitcoin/USD
- **X:ETHUSD** - Ethereum/USD
