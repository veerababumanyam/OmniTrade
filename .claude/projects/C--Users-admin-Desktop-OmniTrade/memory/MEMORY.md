# OmniTrade Memory

Project memory for cross-session context persistence.

## Quick Reference

| Item | Value |
|------|-------|
| **Project** | OmniTrade - Multi-Agent AI Trading Platform |
| **Architecture** | Three-Plane (Data/Intelligence/Action) |
| **Backend** | Go 1.26 + Genkit |
| **Frontend** | React 19 + TypeScript |
| **Database** | PostgreSQL + pgvector |

## Key Patterns

### Signal Bus API (Use This Pattern)
```typescript
// CORRECT: Use SignalBus.publish with source tracking
SignalBus.publish('ui:toast:show', data, { source: 'ComponentName' });

// WRONG: Legacy emit API (deprecated)
signalBus.emit('ui:toast:show', data);
```

### Database Roles
- `omnitrade_readonly`: AI agents (SELECT only)
- `omnitrade_write`: Action Plane (INSERT/UPDATE trade_proposals, audit_logs)
- **AI agents NEVER write directly to database**

### Financial Data
- Always use `DECIMAL` for monetary values
- Never use float for prices
- All trades require HITL approval

## Context Saves

| Date | File | Description |
|------|------|-------------|
| 2026-03-04 | [CONTEXT_SAVE_2026-03-04.md](./CONTEXT_SAVE_2026-03-04.md) | Full project context capture |

## Recent Work Summary

### Mar 4, 2026
- Built UI component system with GenUI architecture
- Created Signal Bus for inter-module communication
- Implemented Component Registry for AI-driven assembly
- Migrated components to SignalBus.publish API
- Created organisms: Header, Sidebar, Footer, Modal, Toast
- Created templates: DashboardLayout, EmptyState

## Known Issues

- **kilo-indexer MCP tools not loading**: rag-indexer.exe exists but MCP server not exposing tools in current session. May require session restart.

## Skills to Use

- `liquid-glass-ui` - UI component development
- `omnitrade-go-backend` - Backend patterns
- `three-plane-architecture` - Architecture decisions
- `financial-trading-rules` - Financial data handling
- `pgvector-rag-integration` - Vector search/RAG
