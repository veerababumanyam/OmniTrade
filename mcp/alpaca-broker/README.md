# @omnitrade/mcp-alpaca-broker

MCP (Model Context Protocol) server for Alpaca paper trading integration. This server enables AI agents to interact with Alpaca's paper trading platform safely, with full human-in-the-loop control.

## ⚠️ IMPORTANT SAFETY NOTICE

**THIS MCP SERVER IS DESIGNED FOR PAPER TRADING ONLY.**

- Default configuration uses Alpaca's paper trading API (`https://paper-api.alpaca.markets`)
- Paper trading uses simulated money - **NO REAL MONEY IS AT RISK**
- The server includes safety checks to warn if non-paper URLs are used
- Never use live trading credentials without proper risk management systems
- All OmniTrade AI agents require human approval before executing trades

## Features

- **Account Management**: View account details, buying power, portfolio value
- **Position Tracking**: List all open positions with P&L calculations
- **Order Management**: Place, cancel, and monitor orders
- **Portfolio Analytics**: Historical performance data with P&L metrics
- **Safety First**: Paper trading only, with comprehensive error handling

## Prerequisites

1. **Alpaca Account**: Sign up at [alpaca.markets](https://alpaca.markets/) (free)
2. **API Keys**: Generate API keys in your Alpaca dashboard
3. **Node.js**: Version 18 or higher
4. **npm**: For package management

## Installation

```bash
# Install dependencies
npm install

# Build the TypeScript code
npm run build
```

## Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` with your Alpaca paper trading credentials:
```bash
# Alpaca API Key (Key ID) - from Alpaca dashboard
ALPACA_API_KEY=your_api_key_here

# Alpaca Secret Key - from Alpaca dashboard
ALPACA_SECRET_KEY=your_secret_key_here

# Alpaca Base URL (Paper Trading)
ALPACA_BASE_URL=https://paper-api.alpaca.markets
```

3. **Get your API keys**:
   - Log into [Alpaca Dashboard](https://alpaca.markets/brokerage/dashboard)
   - Go to "API Keys" section
   - Generate new keys (select "Paper Trading")
   - Copy Key ID and Secret Key to your `.env` file

## Usage

### Running the MCP Server

```bash
# Development mode (build and run)
npm run dev

# Production mode
npm start

# Watch mode for development
npm run watch
```

### Available Tools

The MCP server provides the following tools:

#### 1. `get_account`
Get detailed account information including buying power, portfolio value, and margin status.

**Parameters**: None

**Example**:
```json
{
  "name": "get_account",
  "arguments": {}
}
```

**Returns**:
- Account status and balance
- Buying power (cash, margin, day-trading)
- Portfolio value and equity
- Profit/loss metrics
- Account flags (blocked status, etc.)

#### 2. `get_positions`
List all currently open positions in the paper trading account.

**Parameters**: None

**Example**:
```json
{
  "name": "get_positions",
  "arguments": {}
}
```

**Returns**:
- List of all open positions
- Symbol, quantity, side (long/short)
- Average entry price and current price
- Unrealized P&L (dollar and percentage)
- Today's change

#### 3. `place_order`
Submit a new order to the paper trading account.

**Parameters**:
- `symbol` (string, required): Stock or crypto symbol (e.g., "AAPL", "BTCUSD")
- `qty` (number, required): Number of shares or crypto amount
- `side` (string, required): "buy" or "sell"
- `order_type` (string, required): "market", "limit", "stop", "stop_limit", "trailing_stop"
- `time_in_force` (string, required): "day", "gtc", "opg", "ioc", "cls"
- `limit_price` (number, optional): Required for limit/stop_limit orders
- `stop_price` (number, optional): Required for stop/stop_limit orders
- `trail_percent` (number, optional): For trailing stop orders (e.g., 1.5 for 1.5%)
- `trail_price` (number, optional): Alternative to trail_percent

**Example - Market Buy**:
```json
{
  "name": "place_order",
  "arguments": {
    "symbol": "AAPL",
    "qty": 10,
    "side": "buy",
    "order_type": "market",
    "time_in_force": "day"
  }
}
```

**Example - Limit Sell**:
```json
{
  "name": "place_order",
  "arguments": {
    "symbol": "AAPL",
    "qty": 10,
    "side": "sell",
    "order_type": "limit",
    "time_in_force": "gtc",
    "limit_price": 175.50
  }
}
```

**Example - Trailing Stop**:
```json
{
  "name": "place_order",
  "arguments": {
    "symbol": "AAPL",
    "qty": 10,
    "side": "sell",
    "order_type": "trailing_stop",
    "time_in_force": "day",
    "trail_percent": 2.5
  }
}
```

#### 4. `cancel_order`
Cancel a pending order in the paper trading account.

**Parameters**:
- `order_id` (string, required): The Alpaca order ID to cancel

**Example**:
```json
{
  "name": "cancel_order",
  "arguments": {
    "order_id": "fb29e4c2-1234-5678-90ab-cdef12345678"
  }
}
```

#### 5. `get_order`
Get detailed information about a specific order.

**Parameters**:
- `order_id` (string, required): The Alpaca order ID to look up

**Example**:
```json
{
  "name": "get_order",
  "arguments": {
    "order_id": "fb29e4c2-1234-5678-90ab-cdef12345678"
  }
}
```

**Returns**:
- Order status (pending, filled, canceled, etc.)
- Fill details (quantity, average price)
- Timestamps (created, filled, canceled)
- Price information

#### 6. `get_portfolio_history`
Get historical portfolio performance data including equity curves and P&L metrics.

**Parameters** (all optional):
- `period` (string): "1M", "3M", "6M", "12M", "1A", "all" - Time period for history
- `timeframe` (string): "1Min", "5Min", "15Min", "1H", "1D" - Resolution of data points
- `date_end` (string): End date in YYYY-MM-DD format

**Example**:
```json
{
  "name": "get_portfolio_history",
  "arguments": {
    "period": "1M",
    "timeframe": "1D"
  }
}
```

**Returns**:
- Summary statistics (start/end equity, total return)
- Historical time series data (equity, P&L, percentages)
- Data point count and timeframe info

## Integration with Claude Desktop

Add this MCP server to your Claude Desktop configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "alpaca-paper-trading": {
      "command": "node",
      "args": [
        "C:\\Users\\admin\\Desktop\\OmniTrade\\mcp\\alpaca-broker\\dist\\index.js"
      ],
      "env": {
        "ALPACA_API_KEY": "your_api_key_here",
        "ALPACA_SECRET_KEY": "your_secret_key_here",
        "ALPACA_BASE_URL": "https://paper-api.alpaca.markets"
      }
    }
  }
}
```

## Error Handling

The MCP server provides detailed error messages for common issues:

- **Authentication errors**: Invalid API keys
- **Insufficient funds**: Not enough buying power
- **Invalid parameters**: Missing required fields or invalid values
- **Market conditions**: Market closed, order rejected
- **Order not found**: Invalid order ID for get/cancel operations

All errors include:
- Success flag (false)
- Error message
- Status code (for API errors)
- Additional details from Alpaca API

## Development

### Project Structure
```
mcp/alpaca-broker/
├── src/
│   └── index.ts          # MCP server implementation
├── dist/                 # Compiled JavaScript (generated)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── .env.example          # Environment variables template
└── README.md             # This file
```

### Building
```bash
# Compile TypeScript
npm run build

# Watch for changes
npm run watch
```

### Testing
To test the server:

1. Start the server:
```bash
npm start
```

2. In another terminal, send JSON-RPC requests via stdin:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

## Alpaca API Version

This server uses **Alpaca Trading API v2**.

## Paper Trading vs. Live Trading

### Paper Trading (Default)
- **URL**: `https://paper-api.alpaca.markets`
- **Money**: Simulated (no real money)
- **Risk**: Zero
- **Purpose**: Testing, strategy development, learning
- **Recommendation**: Always use paper trading for development

### Live Trading
- **URL**: `https://api.alpaca.markets`
- **Money**: Real money
- **Risk**: Actual financial loss
- **Purpose**: Production trading with real capital
- **Recommendation**: Only use after extensive paper trading testing

This MCP server includes warnings if you attempt to use non-paper URLs.

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use paper trading** for development and testing
3. **Keep .env files** private and out of git
4. **Rotate API keys** regularly
5. **Use read-only keys** when possible (not applicable for trading)
6. **Monitor account** for unusual activity
7. **Use strong passwords** on your Alpaca account

## Rate Limits

Alpaca enforces rate limits:
- **200 requests per minute** per account for paper trading
- **200 requests per minute** per account for live trading

This MCP server does not implement rate limiting - it's your responsibility to stay within limits.

## Market Hours

Alpaca paper trading supports:
- **Regular market hours**: 9:30 AM - 4:00 PM ET, Monday-Friday
- **Extended hours**: Pre-market (4:00 AM - 9:30 AM ET) and after-hours (4:00 PM - 8:00 PM ET)

Market orders can only be placed during market hours unless extended hours are enabled in your Alpaca account settings.

## Troubleshooting

### "Failed to initialize Alpaca client"
- Check that ALPACA_API_KEY and ALPACA_SECRET_KEY are set
- Verify keys are correct (copy from Alpaca dashboard)

### "Authentication failed"
- Verify API keys are for paper trading (not live trading)
- Check that keys haven't been revoked
- Regenerate keys if necessary

### "No open positions"
- Normal if you haven't placed any orders yet
- Use `place_order` to open a position

### "Order rejected"
- Check market hours (market orders only work during market hours)
- Verify you have sufficient buying power
- Check that the symbol is valid and tradeable

### "Cannot cancel order"
- Order may already be filled
- Order may have been canceled already
- Order may have expired

## Support

- **Alpaca Docs**: https://alpaca.markets/docs/
- **Alpaca Trading API**: https://alpaca.markets/docs/api-references/trading-api/
- **MCP Protocol**: https://modelcontextprotocol.io/

## License

MIT

## OmniTrade Integration

This MCP server is part of the OmniTrade platform and follows the OmniTrade architecture:

- **Action Plane**: This server provides the broker integration for the Human-in-the-Loop (HITL) trading system
- **Safety**: Paper trading only for development and testing
- **Audit Trail**: All trade actions are logged in the OmniTrade database

See `docs/Technical_Specification.md` for more details on the OmniTrade architecture.
