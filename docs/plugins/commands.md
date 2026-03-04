# OmniTrade Plugin Commands Reference

## Overview

OmniTrade plugin provides four primary command categories for managing the AI trading platform: Trade Management, Agent Orchestration, Data Operations, and Development Workflows.

## Command Categories

### Trade Commands (`trade.md`)

**Purpose**: Human-in-the-Loop (HITL) trade workflow management

| Command | Description | Example |
|---------|-------------|---------|
| `/trade:status` | Display pending proposals and queue status | `/trade:status` |
| `/trade:approve <id>` | Approve a trade proposal | `/trade:approve 123e4567-...` |
| `/trade:reject <id> <reason>` | Reject with documented reasoning | `/trade:reject 123e4567-... "Too risky"` |
| `/trade:analyze <symbol>` | Generate new proposal via multi-agent | `/trade:analyze AAPL` |
| `/trade:history <symbol>` | View past proposals and outcomes | `/trade:history AAPL --days 30` |

**Key Features**:
- All approvals logged to immutable audit log
- Confidence score validation (≥ 0.70 required)
- Risk Manager veto cannot be overridden
- Automatic chain-of-thought recording

### Agent Commands (`agents.md`)

**Purpose**: Genkit multi-agent system management

| Command | Description | Example |
|---------|-------------|---------|
| `/agents:list` | Display all agents with status | `/agents:list` |
| `/agents:status <name>` | Detailed status of specific agent | `/agents:status fundamental-analyst` |
| `/agents:debug <flow>` | Debug Genkit flow with traces | `/agents:debug GenerateTradeProposal` |
| `/agents:test <name> <mock>` | Test agent with mock data | `/agents:test technical-analyst mock.json` |

**Agent Registry**:
- **Data Fetcher**: Go functions, 5s timeout [REQUIRED]
- **Fundamental Analyst**: gpt-4o, 30s timeout [REQUIRED]
- **Technical Analyst**: gemini-1.5-flash, 10s timeout [REQUIRED]
- **Sentiment Analyst**: llama3.2:3b, 15s timeout [OPTIONAL]
- **Risk Manager**: claude-3-5-haiku, 20s timeout [REQUIRED - VETO]
- **Portfolio Manager**: claude-3-5-sonnet, 60s timeout [REQUIRED]

### Data Commands (`data.md`)

**Purpose**: Data plane operations and WebSocket management

| Command | Description | Example |
|---------|-------------|---------|
| `/data:status` | Display ingestion status and health | `/data:status` |
| `/data:connect <provider>` | Connect to WebSocket provider | `/data:connect polygon` |
| `/data:disconnect <provider>` | Disconnect WebSocket gracefully | `/data:disconnect polygon` |
| `/data:ingest <symbol> <provider>` | Manual data ingestion trigger | `/data:ingest AAPL polygon` |
| `/data:query <symbol> <start> <end>` | Query historical data | `/data:query AAPL 2026-01-01 2026-03-01` |
| `/data:cache-stats` | Redis caching statistics | `/data:cache-stats` |

**Supported Providers**:
- Polygon: US Equities, ETFs, Options
- Alpaca: US Equities, Crypto
- Binance: Crypto (300+ pairs)

### Development Commands (`dev.md`)

**Purpose**: Build, test, and manage project components

| Command | Description | Example |
|---------|-------------|---------|
| `/dev:build [component]` | Build backend/frontend/MCP | `/dev:build backend` |
| `/dev:test [component]` | Run tests with coverage | `/dev:test --coverage` |
| `/dev:lint [component]` | Run linters and formatters | `/dev:lint --fix` |
| `/dev:run [component]` | Start dev servers with hot reload | `/dev:run backend` |
| `/dev:db <action>` | Database operations | `/dev:db migrate` |
| `/dev:genkit <action>` | Genkit operations | `/dev:genkit ui` |

**Quality Gates**:
- Test coverage: ≥ 90%
- Lint errors: 0
- Quality score: ≥ 90/100

## Command Patterns

### Argument Syntax

**Optional arguments**: `--days 30`
**Required arguments**: `<symbol>`
**Argument with default**: `[--interval 15m]`

### Output Formats

**Tables**: Used for agent lists, status displays
**JSON**: Used for data queries, API responses
**Markdown**: Used for detailed reports, analysis

### Error Handling

All commands follow this error pattern:
```
❌ Error: [Clear, actionable message]
💡 Suggestion: [How to fix]
📚 Reference: [Relevant documentation link]
```

## Aliases and Shortcuts

| Full Command | Short Alias |
|--------------|-------------|
| `/trade:analyze` | `/ta` |
| `/agents:status` | `/as` |
| `/data:status` | `/ds` |
| `/dev:test` | `/dt` |
| `/dev:build` | `/db` |

## Integration Points

### With Skills

Commands automatically invoke relevant skills:
- `/trade:analyze` → `genkit-multi-agent-flows`
- `/dev:test` → `omnitrade-go-testing`
- `/data:ingest` → `omnitrade-websocket-ingestion`

### With Agents

Commands dispatch specialized agents:
- `/dev:lint` → Formatting agents
- `/agents:debug` → `genkit-flow-debugger`
- `/trade:*` → `trading-reviewer` for analysis

### With MCP Servers

Commands utilize configured MCP servers:
- `/data:ingest` → `polygon-market-data` MCP
- `/trade:analyze` → `pgvector-server` for RAG
- `/trade:history` → Database queries via MCP

## Permission Model

**Read Operations**: All users
**Write Operations** (approve/reject): Requires explicit confirmation
**Admin Operations** (dev:db reset): Requires elevated permissions

## Troubleshooting

### Command Not Found
```
Error: Unknown command "/foo"
→ Run /commands to see available commands
→ Check plugin is installed: /plugin status
```

### Hook Failed
```
Error: PreToolUse hook failed
→ Check .claude/hooks/debug.log
→ Verify tools are installed (gofmt, prettier)
```

### MCP Server Unavailable
```
Error: polygon-market-data MCP not responding
→ Check .mcp.json configuration
→ Verify API keys in environment
→ Check server is built: cd mcp/polygon-market-data && npm run build
```

## Related Documentation

- [Hooks Configuration](./hooks.md)
- [Agent Definitions](./agents.md)
- [MCP Integration](./mcp-integration.md)
