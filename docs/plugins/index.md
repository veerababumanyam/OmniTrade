# OmniTrade Plugin Documentation Index

Complete documentation for the OmniTrade Claude Code Plugin.

## Getting Started

| Document | Description |
|----------|-------------|
| [Quick Start](./QUICKSTART.md) | 5-minute setup guide |
| [Plugin README](../.claude-plugin/README.md) | Installation and overview |

## Core Documentation

| Document | Description |
|----------|-------------|
| [Architecture](./architecture.md) | System design and component overview |
| [Commands Reference](./commands.md) | All slash commands and usage |
| [Hooks Configuration](./hooks.md) | Event automation and configuration |
| [Agent Definitions](./agents.md) | Custom agents and their capabilities |
| [MCP Integration](./mcp-integration.md) | MCP server setup and usage |

## Reference Guides

### Skills (10 total)
Located in `.claude/skills/` - Each skill has its own SKILL.md

| Skill | Purpose |
|-------|---------|
| [financial-trading-rules](../.claude/skills/financial-trading-rules/SKILL.md) | DECIMAL types, confidence thresholds, HITL |
| [genkit-multi-agent-flows](../.claude/skills/genkit-multi-agent-flows/SKILL.md) | Genkit Go SDK, parallel execution |
| [multi-agent-debate-topology](../.claude/skills/multi-agent-debate-topology/SKILL.md) | Agent hierarchy, veto power, conflict resolution |
| [omnitrade-go-backend](../.claude/skills/omnitrade-go-backend/SKILL.md) | Go patterns, chi router, sqlx |
| [liquid-glass-ui](../.claude/skills/liquid-glass-ui/SKILL.md) | React 19, glassmorphism design |
| [pgvector-rag-integration](../.claude/skills/pgvector-rag-integration/SKILL.md) | Vector embeddings, semantic search |
| [omnitrade-hitl-workflow](../.claude/skills/omnitrade-hitl-workflow/SKILL.md) | Human-in-the-loop trade lifecycle |
| [omnitrade-websocket-ingestion](../.claude/skills/omnitrade-websocket-ingestion/SKILL.md) | Polygon/Alpaca WebSocket patterns |
| [omnitrade-go-testing](../.claude/skills/omnitrade-go-testing/SKILL.md) | Table-driven tests, 90% coverage |
| [omnitrade-redis-caching](../.claude/skills/omnitrade-redis-caching/SKILL.md) | Pub/sub, indicator cache, sessions |

### MCP Servers (5 total)
Located in `mcp/` directory

| Server | Tools | Documentation |
|--------|-------|---------------|
| [polygon-market-data](../../mcp/polygon-market-data/README.md) | get_quote, get_aggregates, list_symbols | README, EXAMPLES |
| [sec-filings](../../mcp/sec-filings/README.md) | fetch_filing, list_filings, chunk_filing | README, QUICKSTART |
| [pgvector-server](../../mcp/pgvector-server/README.md) | search_sec_filings, search_news | README, EXAMPLES |
| [alpaca-broker](../../mcp/alpaca-broker/README.md) | get_account, place_order, cancel_order | README, QUICKSTART |
| [financial-news](../../mcp/financial-news/README.md) | get_news_headlines, get_sentiment | README |

## Project Documentation

| Document | Description |
|----------|-------------|
| [Technical Specification](../Technical_Specification.md) | Full system technical spec |
| [Implementation Plan](../implementation_plan.md) | Four-phase implementation roadmap |
| [Agent Intelligence System](../02_Agent_Intelligence_System.md) | Multi-agent architecture details |
| [API Specification](../04_API_Specification.md) | REST API endpoints |
| [Security & HITL Protocol](../05_Security_HITL_Protocol.md) | Security architecture |

## Architecture Diagrams

```
┌─────────────────────────────────────────────────────────────┐
│                     OmniTrade Plugin                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Commands   │  │    Agents    │  │    Skills    │     │
│  │   (4 total)  │  │  (4 custom)  │  │   (10 total) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Hooks     │  │  MCP Servers │  │   LSP Svr    │     │
│  │   (6 hooks)  │  │   (5 total)  │  │   (3 langs)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   OmniTrade Platform                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Data Plane  │  │ Intelligence │  │ Action Plane │     │
│  │   (Go)       │  │  (Genkit)    │  │   (HITL)     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ PostgreSQL   │  │    Redis     │  │  Frontend    │     │
│  │  + pgvector  │  │   Pub/Sub   │  │  (React 19)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Component Relationships

```
User Command
      ↓
┌─────────────┐     ┌─────────────┐
│   Command   │────→│    Skill    │
└─────────────┘     └─────────────┘
      ↓                   ↓
┌─────────────┐     ┌─────────────┐
│    Agent    │────→│  MCP Tool   │
└─────────────┘     └─────────────┘
      ↓
┌─────────────┐     ┌─────────────┐
│    Hook     │────→│   Format    │
└─────────────┘     └─────────────┘
```

## Key Workflows

### Trade Proposal Workflow
```
/trade:analyze → genkit-multi-agent-flows skill
                   ↓
              Multi-agent debate topology skill
                   ↓
              Financial trading rules skill
                   ↓
              Trade proposal with HITL status
                   ↓
              /trade:approve or /trade:reject
```

### Development Workflow
```
/dev:build → Omnitrade Go backend skill
             ↓
          Omnitrade Go testing skill
             ↓
          All tests pass with 90% coverage
             ↓
          Git commit (hooks auto-format)
```

### Debugging Workflow
```
/agents:debug → Genkit flow debugger agent
                 ↓
              Identify root cause
                 ↓
              Omnitrade Go backend skill (fix)
                 ↓
              /dev:test (verify)
```

## Common Tasks

| Task | Command/Agent/Skill | Reference |
|------|---------------------|-----------|
| Generate trade proposal | `/trade:analyze` | [Commands](./commands.md) |
| Review trade compliance | `trading-reviewer` agent | [Agents](./agents.md) |
| Check portfolio risk | `risk-analyst` agent | [Agents](./agents.md) |
| Debug Genkit flow | `genkit-flow-debugger` agent | [Agents](./agents.md) |
| Build UI component | `frontend-architect` agent | [Agents](./agents.md) |
| Write Go handler | `omnitrade-go-backend` skill | [Skills](../.claude/skills/omnitrade-go-backend/SKILL.md) |
| Format code | `PostToolUse` hook | [Hooks](./hooks.md) |
| Fetch market data | `polygon-market-data` MCP | [MCP Integration](./mcp-integration.md) |

## Troubleshooting Index

| Issue | Document | Section |
|-------|----------|---------|
| Plugin not loading | [Quick Start](./QUICKSTART.md) | Troubleshooting |
| MCP server errors | [MCP Integration](./mcp-integration.md) | Troubleshooting |
| Agent not invoking | [Agent Definitions](./agents.md) | Agent Troubleshooting |
| Hook failures | [Hooks Configuration](./hooks.md) | Debugging Hooks |
| Genkit flow timeout | [Commands Reference](./commands.md) | `/agents:debug` |
| Low confidence scores | [multi-agent-debate-topology](../.claude/skills/multi-agent-debate-topology/SKILL.md) | Conflict Resolution |

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-04 | Initial release |

## Contributing

Contributions welcome! See:
- [Plugin Development](../.claude-plugin/README.md#development)
- [Skill Creation](../.claude/skills/superpowers/writing-skills/SKILL.md)
- [MCP Server Development](./mcp-integration.md#mcp-server-development)

## Support

- **Issues**: GitHub Issues
- **Documentation**: This index
- **Quick Help**: [Quick Start](./QUICKSTART.md)
