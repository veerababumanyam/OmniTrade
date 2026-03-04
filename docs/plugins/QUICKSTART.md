# OmniTrade Plugin Quick Start Guide

## 5-Minute Setup

### Prerequisites
```bash
# Check Claude Code version
claude --version  # Must be 1.0.33+

# Install Node.js 18+
node --version

# Install Go 1.26+
go version

# Check PostgreSQL with pgvector
psql --version
```

### Installation

```bash
# Navigate to OmniTrade project
cd /path/to/OmniTrade

# Install plugin
claude plugin install ./

# Or test without installation
claude --plugin-dir ./
```

### Environment Setup

```bash
# Create .env.local file
cat > .env.local << 'EOF'
# Polygon.io
POLYGON_API_KEY=your_polygon_api_key

# SEC API
SEC_API_KEY=your_sec_api_key

# Alpaca (paper trading for development)
ALPACA_API_KEY=your_alpaca_api_key
ALPACA_SECRET_KEY=your_alpaca_secret_key
ALPACA_BASE_URL=https://paper-api.alpaca.markets

# Alpha Vantage
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key

# News API
NEWS_API_KEY=your_news_api_key

# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/omnitrade
PGVECTOR_HOST=localhost
PGVECTOR_PORT=5432
PGVECTOR_DB=omnitrade
PGVECTOR_USER=omnitrade_readonly
PGVECTOR_PASSWORD=your_password
EOF

# Load environment
source .env.local
```

### Build MCP Servers

```bash
# Build all MCP servers
cd mcp

for server in polygon-market-data sec-filings pgvector-server alpaca-broker financial-news; do
  echo "Building $server..."
  cd "$server"
  npm install
  npm run build
  cd ..
done

cd ..
```

### Verify Setup

```bash
# Check plugin loaded
claude plugin list

# Test commands
/trade:status
/agents:list
/data:status

# Test MCP server (example)
node mcp/polygon-market-data/dist/index.js
```

## Common Workflows

### Generate a Trade Proposal

```bash
# Analyze symbol (runs multi-agent flow)
/trade:analyze AAPL

# View generated proposal
/trade:status

# Review chain-of-thought
/trade:history AAPL --days 1

# Approve or reject
/trade:approve <proposal-id>
/trade:reject <proposal-id> "Reason for rejection"
```

### Debug a Genkit Flow

```bash
# Check all agents status
/agents:list

# Debug specific flow
/agents:debug GenerateTradeProposal

# Test individual agent
/agents:test technical-analyst mock_data/AAPL_bullish.json

# View agent logs
tail -f backend/logs/agents.log
```

### Market Data Operations

```bash
# Connect to WebSocket
/data:connect polygon

# Query historical data
/data:query AAPL 2026-01-01 2026-03-01 --interval 15m

# Check cache hit rate
/data:cache-stats

# Disconnect
/data:disconnect polygon
```

### Development Tasks

```bash
# Build everything
/dev:build

# Run tests with coverage
/dev:test --coverage

# Auto-fix linting
/dev:lint --fix

# Start dev servers
/dev:run
```

## First Trade Walkthrough

### 1. Start Backend Services

```bash
# Terminal 1: PostgreSQL
# Ensure PostgreSQL is running with pgvector
pg_ctl start

# Terminal 2: Go backend
cd backend
go run main.go
```

### 2. Connect Data Sources

```bash
# In Claude Code
/data:connect polygon
/data:status  # Should show "Connected: polygon"
```

### 3. Generate Trade Proposal

```bash
# Trigger multi-agent analysis
/trade:analyze TSLA

# Wait for flow completion (should be < 120s)
# Flow stages:
# - Data Fetcher (5s)
# - Parallel Agents (35s)
# - Risk Manager (20s)
# - Portfolio Manager (60s)
```

### 4. Review Proposal

```bash
# View pending proposals
/trade:status

# Check proposal details
/trade:history TSLA --days 1

# Look for:
# - Confidence score (must be ≥ 0.70)
# - Risk Manager decision (APPROVE/REJECT/REDUCE_SIZE)
# - Chain-of-thought reasoning
# - Agent consensus/conflicts
```

### 5. Approve Trade

```bash
# If approved by Risk Manager and confidence ≥ 0.70
/trade:approve <proposal-id>

# Trade logged to immutable audit log
# Execution sent to Alpaca broker API
```

## Troubleshooting

### Plugin Not Loading
```bash
# Check Claude Code version
claude --version

# Verify plugin structure
ls .claude-plugin/plugin.json
ls commands/*.md
ls agents/*.md

# Restart Claude Code
```

### MCP Server Errors
```bash
# Check server is built
ls mcp/polygon-market-data/dist/index.js

# Test server manually
cd mcp/polygon-market-data
node dist/index.js

# Check API key
echo $POLYGON_API_KEY
```

### Database Connection Issues
```bash
# Test PostgreSQL connection
psql -h localhost -U omnitrade_readonly -d omnitrade

# Check pgvector extension
psql -d omnitrade -c "SELECT extversion FROM pg_extension WHERE extname = 'vector';"

# Verify role permissions
psql -d omnitrade -c "\du omnitrade_readonly"
```

### Genkit Flow Timeout
```bash
# Check agent timeouts
grep -r "WithTimeout" backend/internal/agent/

# View flow trace in Genkit UI
/dev:genkit ui

# Debug flow
/agents:debug GenerateTradeProposal
```

## Next Steps

1. **Read Documentation**: `docs/plugins/` for comprehensive guides
2. **Explore Commands**: Run `/commands` to see all available
3. **Test Agents**: Use `/agents:test` with mock data
4. **Build MCP Servers**: Customize existing servers or add new ones
5. **Contribute**: Share improvements via pull requests

## Getting Help

- **Documentation**: `docs/plugins/`
- **Issues**: GitHub Issues
- **Discord**: Community support
- **Examples**: `examples/` directory

## Key Concepts

### Three-Plane Architecture
1. **Data Plane**: Real-time market ingestion (WebSocket/API)
2. **Intelligence Plane**: Multi-agent analysis (Genkit)
3. **Action Plane**: Human-in-the-loop approval (HITL)

### Financial Rules (Non-Negotiable)
- All prices use `decimal.Decimal` (never `float64`)
- Confidence score ≥ 0.70 required
- Human approval mandatory (HITL)
- Risk Manager REJECT cannot be overridden
- All operations logged with audit context

### Agent Hierarchy
```
Data Fetcher → Parallel Analysis → Risk Manager (VETO) → Portfolio Manager → Trade Proposal
```

### Quality Gates
- Test coverage: ≥ 90%
- Lint errors: 0
- Quality score: ≥ 90/100
