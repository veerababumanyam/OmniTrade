# OmniTrade Context Save
**Captured:** 2026-03-04 16:45 GMT+1
**Fingerprint:** `omnitrade-v0.0.2-context-20260304`

---

## 1. Project Metadata

| Field | Value |
|-------|-------|
| **Name** | OmniTrade |
| **Version** | 0.0.2 |
| **Type** | Multi-Agent AI Quantitative Trading Platform |
| **Architecture** | Three-Plane Architecture (Data/Intelligence/Action) |
| **Primary Stack** | Go (Backend), React/TypeScript (Frontend), PostgreSQL+pgvector |

---

## 2. Architectural Decisions

### 2.1 Three-Plane Architecture

| Plane | Role | Technology | Access Level |
|-------|------|------------|--------------|
| **Data Plane** | Real-time market data ingestion | Go + WebSockets/APIs | Read-Only |
| **Intelligence Plane** | Multi-agent AI orchestration | Go + Google Genkit | Read-Only (omnitrade_readonly role) |
| **Action Plane** | Human-in-the-loop trade approval | Go + React Frontend | Write (omnitrade_write role) |

### 2.2 Database Roles (Security Critical)
- `omnitrade_readonly`: AI agents - SELECT only on market_data, fundamental_data
- `omnitrade_write`: Action Plane - INSERT/UPDATE on trade_proposals, audit_logs
- **AI agents NEVER write directly to database**

### 2.3 Financial Data Rules
- All monetary values use `DECIMAL` type (never float)
- All trades require human approval (HITL)
- AI confidence threshold: minimum 0.7 for trade suggestions
- All operations must have audit context

---

## 3. Technology Stack

### Backend (Go 1.26)
```
github.com/firebase/genkit/go v1.4.0
github.com/go-chi/chi/v5 v5.2.5
github.com/jmoiron/sqlx v1.4.0
github.com/lib/pq v1.11.2
github.com/pgvector/pgvector-go v0.3.0
```

### Frontend (React 19 + TypeScript 5.7)
```
react: ^19.0.0
@radix-ui/*: Dialog, Dropdown, Tabs, Select, Popover, etc.
vitest: ^2.0.0
@testing-library/react: ^16.0.0
```

### MCP Servers (Model Context Protocol)
| Server | Purpose | Type |
|--------|---------|------|
| `polygon-market-data` | Market data API | Node.js |
| `sec-filings` | SEC filing retrieval | Node.js |
| `pgvector-server` | Vector storage/retrieval | Node.js |
| `alpaca-broker` | Brokerage integration | Node.js |
| `financial-news` | News aggregation | Node.js |
| `kilo-indexer` | RAG code indexing | Native (rag-indexer.exe) |

---

## 4. Frontend Component System (GenUI)

### 4.1 Atomic Design Hierarchy
```
frontend/packages/ui/src/
├── atoms/          # Basic UI elements (Button, Input, Badge, etc.)
├── molecules/      # Composite components (Card, SearchBar, DatePicker, etc.)
├── organisms/      # Complex sections (Header, Sidebar, DataTable, Modal, etc.)
├── templates/      # Page layouts (DashboardLayout, TradeLayout, etc.)
├── primitives/     # Layout primitives (Box, Flex, Grid, Stack, Container)
├── signal-bus/     # Inter-module communication system
├── registry/       # AI-readable component registry
├── tokens/         # Design tokens (colors, spacing)
├── hooks/          # Custom React hooks
└── utils/          # Utility functions (apca, cn, focus)
```

### 4.2 Signal Bus Architecture
- EventTarget-based high-frequency signal system
- Supports typed topics, AI metadata, confidence scores
- Pattern matching with wildcards
- Key API: `SignalBus.publish()`, `SignalBus.subscribe()`, `SignalBus.publishAI()`

### 4.3 Component Registry
- AI-readable component discovery
- Supports queries by category, signals, tags, variants
- Intent-based component assembly
- Key API: `Registry.registerComponent()`, `Registry.queryComponents()`

### 4.4 UI/UX Design Standards (2026)
- **GenUI**: Intent-driven assembly, polymorphic components
- **Photon-Engine**: Ray-traced UI, sub-surface scattering, refractive indexing
- **APCA Contrast**: Lc 75 minimum for text, Lc 60 for interactive elements
- **Performance**: INP < 40ms target, predictive hydration

---

## 5. Recent Implementation Work (Mar 4, 2026)

### 5.1 Completed Components
| Component | Category | Status |
|-----------|----------|--------|
| DashboardLayout | Template | Done |
| EmptyState | Template | Done |
| Header | Organism | Done |
| Sidebar | Organism | Done |
| Footer | Organism | Done |
| Modal | Organism | Migrated to SignalBus.publish |
| Toast | Organism | Migrated to SignalBus.publish |
| DataTable | Organism | Migrated to SignalBus.publish |
| DatePicker | Molecule | Migrated to SignalBus.publish |
| Dropdown | Molecule | Cleaned up imports |

### 5.2 Signal Bus Migration
- Components migrated from `signalBus.emit()` to `SignalBus.publish()` API
- Added source tracking to all signal emissions
- Pattern: `SignalBus.publish('topic', data, { source: 'ComponentName' })`

### 5.3 Known Issues
- kilo-indexer MCP server tools not loading in current session
- RAG cache database exists (`.rag_cache.db`, 68KB, modified 16:36)

---

## 6. File Structure

```
OmniTrade/
├── backend/
│   ├── main.go
│   ├── go.mod
│   ├── internal/
│   │   ├── api/           # HTTP handlers (go-chi)
│   │   ├── database/      # PostgreSQL + pgvector
│   │   ├── agent/         # Genkit orchestration
│   │   ├── ingestion/     # Market data pipeline
│   │   ├── indexer/       # RAG indexing
│   │   └── actionPlane/   # HITL workflow
│   ├── cmd/
│   └── rag-indexer.exe    # MCP RAG indexer
├── frontend/
│   └── packages/ui/       # Design system
├── mcp/                   # MCP server implementations
│   ├── polygon-market-data/
│   ├── sec-filings/
│   ├── pgvector-server/
│   ├── alpaca-broker/
│   └── financial-news/
├── docs/
│   ├── Technical_Specification.md
│   ├── PRD_OmniTrade.md
│   ├── 08_UI_UX_Design_Standards_2026.md
│   └── ...
├── .claude/               # Claude Code configuration
│   ├── skills/            # Project-specific skills
│   └── settings.json
└── .mcp.json              # MCP server configuration
```

---

## 7. Skills & Capabilities

### 7.1 Project-Specific Skills
| Skill | Purpose |
|-------|---------|
| `omnitrade-go-backend` | Go backend patterns |
| `omnitrade-go-testing` | Testing standards |
| `omnitrade-hitl-workflow` | Human-in-the-loop workflow |
| `omnitrade-websocket-ingestion` | WebSocket data ingestion |
| `omnitrade-redis-caching` | Redis caching patterns |
| `pgvector-rag-integration` | Vector search/RAG |
| `liquid-glass-ui` | UI component standards |
| `genkit-multi-agent-flows` | Agent orchestration |
| `financial-trading-rules` | Financial data handling |
| `three-plane-architecture` | Architecture patterns |

### 7.2 Quality Standards
- Test Coverage: 90% minimum (CI enforced)
- Quality Score: 90/100 minimum
- Run `go test -cover ./...` before commits

---

## 8. Environment Variables

```bash
# Database
DB_HOST=localhost
DB_USER=omnitrade_readonly
DB_PASSWORD=***
DB_NAME=omnitrade

# MCP Services
POLYGON_API_KEY=***
SEC_API_KEY=***
ALPHA_VANTAGE_API_KEY=***
NEWS_API_KEY=***
ALPACA_API_KEY=***
ALPACA_SECRET_KEY=***

# Vector Database
PGVECTOR_HOST=***
PGVECTOR_DB=***
PGVECTOR_USER=***
PGVECTOR_PASSWORD=***
```

---

## 9. Semantic Tags

`trading` `multi-agent` `genkit` `genui` `signal-bus` `component-registry` `pgvector` `rag` `hitl` `three-plane-architecture` `react19` `go1.26` `mcp` `websocket` `decimal-money`

---

## 10. Next Steps / Pending

1. Resolve kilo-indexer MCP server tool loading issue
2. Complete remaining component migrations to SignalBus.publish
3. Add remaining organisms to barrel exports
4. Implement remaining GenUI features (Intent Bar, AI Orchestrator)
5. Set up Storybook for component documentation

---

*Context saved by Claude Code Context Management System*
