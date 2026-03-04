# OmniTrade Claude Code Plugin

**Version**: 1.0.0
**Author**: OmniTrade
**License**: MIT

## Overview

OmniTrade plugin extends Claude Code with specialized capabilities for building and maintaining an AI-powered quantitative trading platform. This plugin provides custom commands, agents, skills, hooks, and MCP server integrations specifically designed for OmniTrade's three-plane architecture (Data, Intelligence, Action).

## Features

### 🎯 Custom Commands (4)
- `/trade:*` - Trade management (approve, reject, analyze, history)
- `/agents:*` - Multi-agent orchestration (list, status, debug, test)
- `/data:*` - Data plane operations (ingest, query, cache stats)
- `/dev:*` - Development workflows (build, test, lint, run)

### 🤖 Specialized Agents (4)
- **Trading Reviewer**: Post-trade analysis, compliance validation, performance reporting
- **Risk Analyst**: Market risk assessment, portfolio exposure, circuit breaker monitoring
- **Genkit Flow Debugger**: Multi-agent flow debugging, trace analysis, performance diagnosis
- **Frontend Architect**: React 19 + Liquid Glass design, component architecture

### 📚 Agent Skills (10)
1. `financial-trading-rules` - DECIMAL types, confidence thresholds, HITL enforcement
2. `genkit-multi-agent-flows` - Genkit Go SDK patterns, parallel execution, per-agent timeouts
3. `multi-agent-debate-topology` - Agent hierarchy, Risk Manager veto, conflict resolution
4. `omnitrade-go-backend` - Go patterns (chi, sqlx, dependency injection)
5. `liquid-glass-ui` - React 19 + Vanilla CSS glassmorphism design system
6. `pgvector-rag-integration` - Vector embeddings, semantic search, RAG patterns
7. `omnitrade-hitl-workflow` - Human-in-the-loop trade approval lifecycle
8. `omnitrade-websocket-ingestion` - Polygon/Alpaca WebSocket ingestion patterns
9. `omnitrade-go-testing` - Table-driven tests, 90% coverage requirements
10. `omnitrade-redis-caching` - Pub/sub, indicator caching, session management

### 🔗 MCP Servers (5)
1. **polygon-market-data** - Real-time US equities data
2. **sec-filings** - SEC 10-K/10-Q filings for fundamental analysis
3. **pgvector-server** - Vector similarity search for RAG
4. **alpaca-broker** - Trade execution and portfolio management
5. **financial-news** - News headlines, sentiment, analyst ratings

### ⚙️ Automation Hooks (6)
- `PreToolUse` - Tool invocation logging
- `PostToolUse` - Auto-format Go/TypeScript, run linters
- `UserPromptSubmit` - Conversation audit logging
- `SessionStart` - Session initialization and health checks
- `AgentTaskStart` - Multi-agent workflow tracking
- `AgentTaskComplete` - Agent performance benchmarking

## Installation

### From Local Directory

```bash
# Clone or navigate to OmniTrade project
cd /path/to/OmniTrade

# Install plugin
claude plugin install ./omnitrade-plugin

# Or test without installation
claude --plugin-dir ./omnitrade-plugin
```

### Verify Installation

```bash
# Check plugin status
claude plugin status

# List available commands
/commands

# Test a command
/trade:status
```

## Requirements

### Claude Code
- Version: 1.0.33 or later
- Check: `claude --version`

### External Tools (for hooks)

**Go Backend**:
- `gofmt` (comes with Go)
- `golangci-lint` (optional, for linting)

**Frontend**:
- Node.js 18+
- `prettier` (npm install -g prettier)
- `eslint` (via project devDependencies)

**Database**:
- PostgreSQL 14+ with pgvector extension
- `psql` command-line tool

### MCP Server Dependencies

Each MCP server requires API keys in environment:

```bash
# Required
export POLYGON_API_KEY="your_polygon_key"
export SEC_API_KEY="your_sec_key"
export ALPACA_API_KEY="your_alpaca_key"
export ALPACA_SECRET_KEY="your_alpaca_secret"
export ALPHA_VANTAGE_API_KEY="your_alpha_vantage_key"
export NEWS_API_KEY="your_news_api_key"

# Database
export DATABASE_URL="postgresql://user:pass@localhost:5432/omnitrade"
export PGVECTOR_HOST="localhost"
export PGVECTOR_PORT="5432"
export PGVECTOR_DB="omnitrade"
export PGVECTOR_USER="omnitrade_readonly"
export PGVECTOR_PASSWORD="your_password"
```

## Quick Start

### 1. Trade Management

```bash
# View pending trade proposals
/trade:status

# Generate new proposal via multi-agent analysis
/trade:analyze AAPL

# Approve after reviewing
/trade:approve 123e4567-e89b-12d3-a456-426614174000

# View trade history
/trade:history AAPL --days 30
```

### 2. Agent Orchestration

```bash
# List all agents
/agents:list

# Check specific agent status
/agents:status risk-manager

# Debug a Genkit flow
/agents:debug GenerateTradeProposal

# Test agent with mock data
/agents:test technical-analyst mock_data/AAPL.json
```

### 3. Data Operations

```bash
# Check ingestion status
/data:status

# Connect to WebSocket provider
/data:connect polygon

# Query historical data
/data:query AAPL 2026-01-01 2026-03-01 --interval 15m

# View cache statistics
/data:cache-stats
```

### 4. Development

```bash
# Build all components
/dev:build

# Run tests with coverage
/dev:test --coverage

# Auto-fix linting issues
/dev:lint --fix

# Start dev servers with hot reload
/dev:run
```

## Directory Structure

```
omnitrade-plugin/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest
├── commands/                     # Slash commands
│   ├── trade.md
│   ├── agents.md
│   ├── data.md
│   └── dev.md
├── skills/                       # 10 Agent Skills
│   ├── financial-trading-rules/
│   ├── genkit-multi-agent-flows/
│   └── ... (7 more)
├── agents/                       # 4 Custom Agents
│   ├── trading-reviewer.md
│   ├── risk-analyst.md
│   ├── genkit-flow-debugger.md
│   └── frontend-architect.md
├── hooks/
│   └── hooks.json               # Event handlers
├── .mcp.json                    # MCP server configs
├── .lsp.json                    # LSP server configs
├── settings.json                # Default settings
└── README.md                    # This file
```

## Configuration

### Disable Specific Hooks

Edit `hooks/hooks.json`:
```json
{
  "PostToolUse": []  // Disable auto-format/lint
}
```

### Change Agent Model

Edit `settings.json`:
```json
{
  "modelPreferences": {
    "default": "claude-3-5-sonnet",
    "fast": "claude-3-5-haiku"
  }
}
```

### Add MCP Server

Edit `.mcp.json`:
```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["path/to/server/dist/index.js"],
      "env": {
        "API_KEY": "${MY_API_KEY}"
      }
    }
  }
}
```

## Documentation

Comprehensive documentation in `docs/plugins/`:

- [Architecture Overview](docs/plugins/architecture.md) - System design
- [Commands Reference](docs/plugins/commands.md) - All slash commands
- [Hooks Configuration](docs/plugins/hooks.md) - Event automation
- [Agent Definitions](docs/plugins/agents.md) - Custom agent details
- [MCP Integration](docs/plugins/mcp-integration.md) - MCP server setup

## Troubleshooting

### Plugin Not Loading

```bash
# Check Claude Code version
claude --version  # Must be 1.0.33+

# Verify plugin structure
ls .claude-plugin/plugin.json

# Check for syntax errors
cat .claude-plugin/plugin.json | jq .
```

### MCP Servers Unavailable

```bash
# Build MCP servers
cd mcp/polygon-market-data && npm run build
# Repeat for each server

# Check API keys
echo $POLYGON_API_KEY

# Test MCP server
node mcp/polygon-market-data/dist/index.js
```

### Hooks Failing

```bash
# Check hook logs
cat .claude/hooks/format-errors.log
cat .claude/hooks/lint-errors.log

# Test formatting manually
gofmt -w backend/main.go
npx prettier --write frontend/src/App.tsx
```

### Commands Not Found

```bash
# Verify plugin installed
claude plugin list

# Check command files exist
ls commands/*.md

# Restart Claude Code
```

## Development

### Modifying the Plugin

1. Edit plugin files (commands, agents, skills)
2. Test locally: `claude --plugin-dir ./omnitrade-plugin`
3. Update version in `.claude-plugin/plugin.json`
4. Commit changes

### Adding New Commands

Create `commands/your-command.md`:
```markdown
---
name: your-command
description: What this command does
---

# Your Command

Usage and examples...
```

### Adding New Agents

Create `agents/your-agent.md`:
```markdown
---
name: your-agent
description: Use when [specific conditions]
---

# Your Agent

System prompt and capabilities...
```

### Adding New Skills

Follow TDD process (see `superpowers:writing-skills`):
1. Create pressure scenarios (RED phase)
2. Write skill addressing failures (GREEN phase)
3. Close loopholes (REFACTOR phase)

## Support

- **Issues**: https://github.com/omnitrade/omnitrade-plugin/issues
- **Documentation**: https://docs.omnitrade.ai
- **Discord**: https://discord.gg/omnitrade

## License

MIT License - see LICENSE file for details

## Changelog

### 1.0.0 (2026-03-04)
- Initial release
- 10 Agent Skills
- 4 Custom Agents
- 4 Command Categories
- 5 MCP Servers
- 6 Automation Hooks
