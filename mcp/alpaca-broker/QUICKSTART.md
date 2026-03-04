# Alpaca MCP Server - Quick Start Guide

## Setup in 5 Minutes

### 1. Install Dependencies
```bash
cd C:\Users\admin\Desktop\OmniTrade\mcp\alpaca-broker
npm install
```

### 2. Get Alpaca API Keys
1. Go to https://alpaca.markets/
2. Sign up for a free account
3. Navigate to Dashboard > API Keys
4. Generate new keys (select "Paper Trading")
5. Copy Key ID and Secret Key

### 3. Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```
ALPACA_API_KEY=YOUR_KEY_ID_HERE
ALPACA_SECRET_KEY=YOUR_SECRET_KEY_HERE
ALPACA_BASE_URL=https://paper-api.alpaca.markets
```

### 4. Build and Run
```bash
npm run build
npm start
```

## Testing with Claude Desktop

Add to your Claude Desktop config (`%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "alpaca-paper-trading": {
      "command": "node",
      "args": [
        "C:\\Users\\admin\\Desktop\\OmniTrade\\mcp\\alpaca-broker\\dist\\index.js"
      ],
      "env": {
        "ALPACA_API_KEY": "YOUR_KEY_ID_HERE",
        "ALPACA_SECRET_KEY": "YOUR_SECRET_KEY_HERE",
        "ALPACA_BASE_URL": "https://paper-api.alpaca.markets"
      }
    }
  }
}
```

Restart Claude Desktop.

## Example Conversations

### Check Account Status
```
User: What's my current account status?
Claude: I'll check your Alpaca paper trading account.
[Uses get_account tool]
Your account shows:
- Portfolio Value: $100,000.00
- Buying Power: $200,000.00
- Cash: $100,000.00
- Status: ACTIVE
```

### View Positions
```
User: Show me my current positions.
Claude: Let me check your open positions.
[Uses get_positions tool]
You have 2 open positions:
1. AAPL - 10 shares, Long
   - Cost basis: $175.00
   - Current price: $180.50
   - Unrealized P&L: +$55.00 (+3.14%)

2. TSLA - 5 shares, Long
   - Cost basis: $240.00
   - Current price: $235.00
   - Unrealized P&L: -$25.00 (-2.08%)
```

### Place a Trade
```
User: Buy 10 shares of MSFT at market.
Claude: I'll place a market buy order for 10 shares of MSFT.
[Uses place_order tool]
Order placed successfully!
- Order ID: fb29e4c2-1234-4567-89ab-cdef12345678
- Status: pending
- Symbol: MSFT
- Side: buy
- Quantity: 10
- Type: market
```

### Place a Limit Order
```
User: Sell my 10 AAPL shares at $185 limit.
Claude: I'll place a limit sell order for 10 AAPL at $185.
[Uses place_order tool with limit_price]
Order placed successfully!
- Order ID: abc123...
- Type: limit
- Limit price: $185.00
- Time in force: gtc (good until cancelled)
```

### Check Order Status
```
User: What's the status of order fb29e4c2-1234-4567-89ab-cdef12345678?
Claude: Let me check that order for you.
[Uses get_order tool]
Order status: filled
- Filled at: 10:35 AM
- Average price: $180.25
- Filled quantity: 10 shares
- Total value: $1,802.50
```

### Cancel an Order
```
User: Cancel order abc123...
Claude: I'll cancel that order for you.
[Uses cancel_order tool]
Order cancelled successfully.
```

### View Portfolio Performance
```
User: How has my portfolio performed this month?
Claude: Let me get your portfolio history for the past month.
[Uses get_portfolio_history with period=1M]
Your performance this month:
- Starting equity: $100,000.00
- Ending equity: $102,500.00
- Total return: +$2,500.00 (+2.50%)
- Data points: 20 (daily)
```

## Common Operations

### Buy Stock (Market Order)
- "Buy 5 shares of AAPL"
- "Purchase 10 TSLA at market"

### Sell Stock (Market Order)
- "Sell all my AAPL"
- "Sell 5 shares of MSFT"

### Limit Order
- "Buy AAPL at $170 limit"
- "Sell MSFT at $300 limit good till cancelled"

### Stop Loss
- "Sell my AAPL if it drops to $160"
- "Place a stop loss at 5% below current price"

### Trailing Stop
- "Sell AAPL with a 2% trailing stop"
- "Protect my MSFT position with a $5 trailing stop"

### Portfolio Queries
- "Show my account balance"
- "What's my total portfolio value?"
- "How much buying power do I have?"
- "What positions am I holding?"
- "Show my unrealized gains/losses"

## Safety Reminders

- This is **PAPER TRADING** - no real money at risk
- All trades are simulated
- Use this for testing strategies and learning
- Never share your API keys
- The server warns if you try to use live trading URLs

## Troubleshooting

### Server won't start
- Check that Node.js 18+ is installed: `node --version`
- Verify dependencies are installed: `npm install`
- Check that the build succeeded: `npm run build`

### Authentication errors
- Verify API keys are correct (copy from Alpaca dashboard)
- Make sure you're using paper trading keys
- Check that `.env` file exists and has correct format

### "Order rejected" errors
- Market may be closed (check market hours)
- Insufficient buying power
- Invalid symbol
- Order type not supported for that asset

## Next Steps

1. Experiment with different order types
2. Test your trading strategies risk-free
3. Build confidence before considering real trading
4. Explore the OmniTrade platform for advanced features

For full documentation, see [README.md](./README.md)
