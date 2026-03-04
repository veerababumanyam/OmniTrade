# OmniTrade MCP Integration

## Overview

OmniTrade plugin integrates five Model Context Protocol (MCP) servers for external data and broker connectivity. MCP servers expose tools to AI agents via stdio, enabling real-time market data, SEC filings, vector search, trade execution, and financial news.

## MCP Servers

### 1. Polygon Market Data MCP

**Directory**: `mcp/polygon-market-data/`

**Purpose**: Real-time and historical US equities market data

**Tools**:
| Tool | Description | Parameters |
|------|-------------|------------|
| `get_quote` | Get current quote for symbol | `symbol` (string) |
| `get_aggregates` | Get OHLCV bars | `symbol`, `timespan`, `multiplier`, `from`, `to` |
| `list_symbols` | Search for symbols | `search` (string) |
| `get_trades` | Get recent trades | `symbol`, `timestamp` |

**Environment Variables**:
```bash
export POLYGON_API_KEY="your_polygon_api_key"
```

**Use Cases**:
- Real-time price updates via WebSocket
- Historical OHLCV data for technical analysis
- Symbol lookup and reference data
- Trade tick data for backtesting

**Example Usage**:
```typescript
// In Genkit flow
const quote = await mcp.callTool("polygon-market-data", "get_quote", {
  symbol: "AAPL"
});
// Returns: { price: 178.52, volume: 45678900, timestamp: "2026-03-04T14:30:00Z" }
```

### 2. SEC Filings MCP

**Directory**: `mcp/sec-filings/`

**Purpose**: SEC filings (10-K, 10-Q, 8-K) for fundamental analysis

**Tools**:
| Tool | Description | Parameters |
|------|-------------|------------|
| `fetch_filing` | Get full filing text | `ticker`, `form_type`, `year`, `quarter` |
| `list_filings` | List available filings | `ticker` |
| `chunk_filing` | Split filing into chunks | `filing_id`, `chunk_size`, `overlap` |
| `search_filings` | Search within filings | `query`, `ticker` |

**Environment Variables**:
```bash
export SEC_API_KEY="your_sec_api_key"
```

**Use Cases**:
- RAG (Retrieval Augmented Generation) for Fundamental Analyst agent
- Earnings transcript analysis
- Risk factor extraction
- Management discussion analysis

**Example Usage**:
```typescript
// Fetch latest 10-K
const filing = await mcp.callTool("sec-filings", "fetch_filing", {
  ticker: "AAPL",
  form_type: "10-K",
  year: 2025
});

// Chunk for RAG
const chunks = await mcp.callTool("sec-filings", "chunk_filing", {
  filing_id: filing.id,
  chunk_size: 1000,
  overlap: 200
});
```

### 3. pgvector Server MCP

**Directory**: `mcp/pgvector-server/`

**Purpose**: Vector similarity search for RAG on SEC filings and news

**Tools**:
| Tool | Description | Parameters |
|------|-------------|------------|
| `search_sec_filings` | Semantic search SEC filings | `query`, `symbol`, `limit` |
| `search_news` | Semantic search news articles | `query`, `symbol`, `limit` |
| `store_embedding` | Store document embedding | `text`, `metadata`, `vector` |
| `get_fundamental_analysis` | Get cached fundamental summary | `symbol` |

**Environment Variables**:
```bash
export DATABASE_URL="postgresql://user:pass@localhost:5432/omnitrade"
export PGVECTOR_HOST="localhost"
export PGVECTOR_PORT="5432"
export PGVECTOR_DB="omnitrade"
export PGVECTOR_USER="omnitrade_readonly"
export PGVECTOR_PASSWORD="your_password"
```

**Use Cases**:
- Semantic search for Fundamental Analyst agent
- News retrieval for Sentiment Analyst agent
- RAG chunk retrieval with cosine similarity
- Cached fundamental analysis summaries

**Example Usage**:
```typescript
// Semantic search for AAPL revenue
const results = await mcp.callTool("pgvector-server", "search_sec_filings", {
  query: "AAPL revenue growth services segment",
  symbol: "AAPL",
  limit: 5
});
// Returns: [{ chunk_text, similarity_score, source_doc }]
```

### 4. Alpaca Broker MCP

**Directory**: `mcp/alpaca-broker/`

**Purpose**: Trade execution, portfolio management, order management

**Tools**:
| Tool | Description | Parameters |
|------|-------------|------------|
| `get_account` | Get account details | None |
| `get_positions` | List open positions | None |
| `place_order` | Place new order | `symbol`, `qty`, `side`, `type`, `time_in_force` |
| `cancel_order` | Cancel existing order | `order_id` |
| `get_order` | Get order status | `order_id` |
| `get_portfolio_history` | Get historical P&L | `start`, `end` |

**Environment Variables**:
```bash
export ALPACA_API_KEY="your_alpaca_api_key"
export ALPACA_SECRET_KEY="your_alpaca_secret_key"
export ALPACA_BASE_URL="https://paper-api.alpaca.markets"  # Paper trading
```

**Use Cases**:
- **HITL Trade Execution**: After human approval
- Portfolio status queries
- Order management (cancel, modify)
- Paper trading for testing

**Critical Security**:
- API keys stored in HashiCorp Vault (not code)
- Paper trading URL for development/testing
- Production trades require multi-signature approval
- All orders logged to immutable audit log

**Example Usage**:
```typescript
// After HITL approval
const order = await mcp.callTool("alpaca-broker", "place_order", {
  symbol: "AAPL",
  qty: 100,
  side: "buy",
  type: "market",
  time_in_force: "day"
});
```

### 5. Financial News MCP

**Directory**: `mcp/financial-news/`

**Purpose**: News headlines, sentiment analysis, analyst ratings

**Tools**:
| Tool | Description | Parameters |
|------|-------------|------------|
| `get_news_headlines` | Get recent news | `symbol`, `limit` |
| `get_news_sentiment` | Analyze sentiment | `symbol`, `days` |
| `search_news` | Search news by keyword | `query`, `from`, `to` |
| `get_analyst_ratings` | Get analyst recommendations | `symbol` |
| `get_earnings_calendar` | Get upcoming earnings | `symbol`, `horizon` |

**Environment Variables**:
```bash
export ALPHA_VANTAGE_API_KEY="your_alpha_vantage_key"
export NEWS_API_KEY="your_news_api_key"
```

**Use Cases**:
- Sentiment analysis for Sentiment Analyst agent
- Breaking news detection for trading signals
- Analyst ratings aggregation
- Earnings calendar for event-driven trades

**Example Usage**:
```typescript
// Get sentiment for AAPL
const sentiment = await mcp.callTool("financial-news", "get_news_sentiment", {
  symbol: "AAPL",
  days: 7
});
// Returns: { score: 0.35, label: "positive", article_count: 42 }
```

## MCP Configuration

All MCP servers configured in `.mcp.json`:

```json
{
  "mcpServers": {
    "polygon-market-data": {
      "command": "node",
      "args": ["mcp/polygon-market-data/dist/index.js"],
      "env": {
        "POLYGON_API_KEY": "${POLYGON_API_KEY}"
      }
    }
    // ... other servers
  }
}
```

## MCP Tool Invocation from Agents

### In Genkit Flows

```go
// Define tool that calls MCP
genkit.DefineTool(g, "GetMarketData",
    "Fetch OHLCV data via Polygon MCP",
    func(ctx context.Context, input struct {
        Symbol string `json:"symbol"`
        Days   int    `json:"days"`
    }) ([]MarketBar, error) {
        // Call MCP server via stdio
        return mcp.Call("polygon-market-data", "get_aggregates", map[string]interface{}{
            "symbol": input.Symbol,
            "timespan": "day",
            "multiplier": 1,
            "from": time.Now().AddDate(0, 0, -input.Days).Format("2006-01-02"),
            "to": time.Now().Format("2006-01-02"),
        })
    },
)
```

### From Custom Agents

Agents automatically have access to configured MCP tools:

```markdown
# In agent system prompt

You have access to these MCP tools:
- get_quote: Get current price via Polygon
- search_sec_filings: Semantic search via pgvector
- place_order: Execute trade via Alpaca (HITL only)

Use them when:
- get_quote: Fetching real-time prices
- search_sec_filings: Fundamental analysis
- place_order: After human approval (never before)
```

## MCP Server Development

### Building MCP Servers

```bash
cd mcp/polygon-market-data
npm install
npm run build  # Generates dist/index.js
npm test       # Run tests
```

### Testing MCP Servers

```bash
# Test individual server
cd mcp/polygon-market-data
node test-server.js

# Test all servers
cd mcp
for server in */; do
  cd "$server"
  npm test
  cd ..
done
```

### MCP Server Debugging

```bash
# Enable verbose logging
export MCP_DEBUG=true

# Run server in foreground
node dist/index.js

# Check stdio communication
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node dist/index.js
```

## MCP Security

### API Key Management

**Never commit API keys** to repository. Use:

1. **Environment variables** (development)
```bash
export POLYGON_API_KEY="..."  # In .envrc or .env.local
```

2. **HashiCorp Vault** (production)
```go
key, err := vault.Read("secret/polygon_api_key")
```

3. **Secrets Manager** (cloud deployment)
```yaml
# Kubernetes Secret
apiVersion: v1
kind: Secret
metadata:
  name: polygon-keys
stringData:
  POLYGON_API_KEY: "${POLYGON_API_KEY}"
```

### MCP Server Permissions

**Principle of least privilege**:

| MCP Server | Required Permissions | Risk Level |
|------------|---------------------|------------|
| Polygon | Read-only market data | Low |
| SEC Filings | Read-only filings | Low |
| pgvector | SELECT only (readonly role) | Low |
| Alpaca | Paper trading (dev), Production (prod) | High |
| Financial News | Read-only news | Low |

**Alpaca Production Safeguards**:
- Multi-signature required for > $10,000 orders
- Daily loss limit enforced
- Position size limits checked
- All orders logged to audit log

## MCP Troubleshooting

### Server Won't Start

**Symptom**: `Error: Cannot find module 'dist/index.js'`

**Diagnosis**:
```bash
cd mcp/server-name
npm run build  # Generate dist/
```

### Tool Not Available

**Symptom**: `Tool not found: get_quote`

**Diagnosis**:
1. Check `.mcp.json` configuration
2. Verify server is built
3. Restart Claude Code
4. Check server logs for errors

### Permission Denied

**Symptom**: `Error: API key invalid`

**Diagnosis**:
```bash
echo $POLYGON_API_KEY  # Check environment variable
# Or in Claude Code:
/export POLYGON_API_KEY  # Then set value
```

### Stdio Communication Issues

**Symptom**: Server starts but tools timeout

**Diagnosis**:
1. Check for large JSON responses (increase timeout)
2. Verify stdio buffering (use `--stdio` flag)
3. Test server manually: `echo '{"jsonrpc":"2.0",...}' | node dist/index.js`

## MCP Monitoring

### Health Checks

```bash
# Check all MCP servers
for server in polygon-market-data sec-filings pgvector-server alpaca-broker financial-news; do
  echo "Testing $server..."
  curl -X POST http://localhost:3000/health/$server || echo "$server: DOWN"
done
```

### Performance Metrics

Track:
- Tool invocation latency
- Error rate by server
- API quota usage
- Cache hit rates

## Related Documentation

- [Architecture Overview](./architecture.md)
- [Commands Reference](./commands.md)
- [Hooks Configuration](./hooks.md)
