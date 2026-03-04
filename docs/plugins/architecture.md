# OmniTrade Claude Code Plugin Architecture

## Overview

This document outlines the complete Claude Code plugin architecture for OmniTrade. The plugin extends Claude Code with specialized skills, commands, agents, and integrations specifically designed for building and maintaining an AI-powered quantitative trading platform.

## Plugin Directory Structure

```
omnitrade-plugin/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest
├── commands/                     # Slash commands for workflows
│   ├── trade.md                 # Trade management commands
│   ├── agents.md                # Agent orchestration commands
│   ├── data.md                  # Data plane operations
│   └── dev.md                   # Development workflows
├── skills/                       # 10 skills already created
│   ├── financial-trading-rules/
│   ├── genkit-multi-agent-flows/
│   ├── multi-agent-debate-topology/
│   ├── omnitrade-go-backend/
│   ├── liquid-glass-ui/
│   ├── pgvector-rag-integration/
│   ├── omnitrade-hitl-workflow/
│   ├── omnitrade-websocket-ingestion/
│   ├── omnitrade-go-testing/
│   └── omnitrade-redis-caching/
├── agents/                       # Custom agent specializations
│   ├── trading-reviewer.md      # Post-trade analysis
│   ├── risk-analyst.md          # Risk assessment agent
│   ├── genkit-flow-debugger.md  # Flow debugging specialist
│   └── frontend-architect.md    # React/UI specialist
├── hooks/
│   └── hooks.json               # Event handlers
├── .mcp.json                    # MCP server configurations
├── .lsp.json                    # LSP server configurations
├── settings.json                # Default settings
└── README.md                    # Plugin documentation
```

## Component Overview

| Component | Purpose | OmniTrade Use Case |
|-----------|---------|-------------------|
| **Commands** | Slash commands for workflows | `/trade:approve`, `/agents:status`, `/data:ingest` |
| **Skills** | Model-invoked capabilities | Financial rules, Genkit flows, debate topology |
| **Agents** | Specialized AI behaviors | Trading reviewer, risk analyst, flow debugger |
| **Hooks** | Event-based automation | Code formatting, trade validation, testing |
| **MCP Servers** | External tool integration | Polygon, SEC filings, pgvector, Alpaca, news |
| **LSP Servers** | Code intelligence | Go (gopls), TypeScript/React (tsserver) |
| **Settings** | Default configuration | Agent activation, tool restrictions |

## Design Principles

1. **Trading Safety First**: All financial operations enforce DECIMAL types, 0.70 confidence minimum, HITL requirements
2. **Multi-Agent Orchestration**: Genkit flows with parallel analysis, Risk Manager veto, Portfolio Manager synthesis
3. **Real-Time Data**: WebSocket ingestion for market data, Redis pub/sub for live updates
4. **Audit Everything**: All operations logged with timestamp, actor, reasoning
5. **Type Safety**: Go backend with sqlx, React 19 frontend with TypeScript

## Installation

```bash
# From project root
claude plugin install ./omnitrade-plugin

# Or for development
claude --plugin-dir ./omnitrade-plugin
```

## Related Documentation

- [Commands Reference](./commands.md)
- [Hooks Configuration](./hooks.md)
- [Agent Definitions](./agents.md)
- [MCP Integration](./mcp-integration.md)
