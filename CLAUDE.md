# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OmniTrade is a multi-agent AI quantitative trading platform with a **Three-Plane Architecture**:
1. **Data Plane** (Read-Only): Real-time market data ingestion via WebSockets/APIs
2. **Intelligence Plane**: Multi-agent orchestration via **Google ADK for Go** + **LiteLLM Gateway**
3. **Action Plane** (HITL): Human-in-the-loop trade approval system

### Google ADK + LiteLLM Integration

The Intelligence Plane uses **Google ADK for Go** for structured multi-agent orchestration, with a custom `LiteLLMModel` that implements the `model.LLM` interface to route requests through LiteLLM Gateway.

**Key ADK Components** (`backend/internal/agent/adk/`):
| File | Purpose |
|------|---------|
| `doc.go` | Package documentation |
| `litellm_model.go` | Custom model implementing `model.LLM`, routes to LiteLLM |
| `tool_adapter.go` | Wraps OmniTrade tools as ADK-compatible tools |
| `agents.go` | Trading agent definitions (DataFetcher, RAGAnalysis, RiskAssessment, PortfolioManager) |
| `workflow.go` | TradingWorkflow orchestrates multi-phase execution |

**Workflow Phases**:
1. DataFetcher → Fetches market data (price, volume, orderbook)
2. RAGAnalysis → Queries vector DB for historical context
3. RiskAssessment → Calculates VaR, Sharpe ratio, position sizing
4. PortfolioManager → Synthesizes analysis into trade proposals

## Build & Run Commands

### Backend (Go)
```bash
cd backend

# Download dependencies
go mod download

# Run the server
go run main.go

# Run tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run specific package tests
go test ./internal/agent/...

# Build binary
go build -o bin/omnitrade main.go
```

### Environment Variables (Backend)
```bash
# Required
export DB_HOST=localhost
export DB_USER=omnitrade_readonly  # AI agents use read-only role
export DB_PASSWORD=your_password
export DB_NAME=omnitrade
export PORT=8080
```

### Database Setup
```bash
# PostgreSQL with pgvector extension required
# Run schema migration
psql -d omnitrade -f backend/internal/database/schema.sql
```

## Architecture

### Backend Structure
```
backend/
├── main.go                    # Entry point, wires dependencies
├── internal/
│   ├── api/                   # HTTP handlers (go-chi router)
│   │   ├── router.go          # Route definitions
│   │   └── handlers.go        # Request handlers
│   ├── database/              # Database layer
│   │   ├── db.go              # Connection management
│   │   └── schema.sql         # DDL definitions
│   ├── agent/                 # Multi-agent orchestration
│   │   ├── orchestrator.go    # Trade proposal generation
│   │   ├── adk/               # Google ADK-Go Integration
│   │   │   ├── doc.go         # Package documentation
│   │   │   ├── litellm_model.go # LiteLLM adapter (implements model.LLM)
│   │   │   ├── tool_adapter.go  # Tool wrapper for ADK
│   │   │   ├── agents.go        # Trading agent definitions
│   │   │   └── workflow.go      # TradingWorkflow orchestration
│   │   └── tools/              # Tool definitions
│   └── ingestion/             # Market data ingestion
│       └── ticker.go          # Real-time data pipeline
```

### Key Patterns

**Dependency Injection**: All components receive dependencies via constructors, not globals.

**Database Roles**:
- `omnitrade_readonly`: AI Intelligence Plane (SELECT only on market_data, fundamental_data)
- Separate write role: Action Plane (INSERT on trade_proposals, audit_logs)

**Agent Orchestrator**: The `Orchestrator.GenerateTradeProposal()` method handles multi-agent trade analysis with semantic caching and memory services.

### Agentic RAG System

OmniTrade implements a **stateful, decision-making RAG architecture** with full agent autonomy:

**Hybrid Search (Dense + Sparse + RRF)**:
- **Dense**: pgvector cosine similarity for semantic understanding
- **Sparse**: PostgreSQL full-text search (tsvector) for exact terms
- **Fusion**: Reciprocal Rank Fusion (RRF) combines both with formula: `1/(60 + rank)`

**Agent Loop (Observe → Think → Act → Evaluate)**:
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   OBSERVE   │────▶│    THINK    │────▶│     ACT     │
│ Analyze query │     │ Select tools  │     │ Execute tools│
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                    ┌───────▼───────┐
                                    │   EVALUATE   │
                                    │ Complete?    │
                                    └───────┬───────┘
```

**Available RAG Tools**:
| Tool | Purpose | Category |
|------|---------|----------|
| `rag_search` | Semantic search on SEC filings, earnings | Fundamental |
| `rag_hybrid_search` | Dense + sparse with RRF | Fundamental |
| `rag_news_search` | News with sentiment analysis | Sentiment |

**Agent Autonomy**: Full - agent dynamically selects tools, decides iterations, and self-evaluates completion.

### API Endpoints

```
# Core
GET  /health                     # Health check
GET  /api/v1/assets              # List tracked assets
GET  /api/v1/proposals           # List trade proposals
GET  /api/v1/proposals/{id}      # Get proposal by ID

# RAG (Go Backend - Port 8080)
GET  /api/v1/rag/search          # Semantic search (?q=query)
POST /api/v1/rag/hybrid          # Hybrid search (RRF)
POST /api/v1/rag/news            # News with sentiment
POST /api/v1/rag/ingest          # Ingest content

# Agent (Python Service via Proxy)
POST /api/v1/agent/query        # Agent query with full autonomy
GET  /api/v1/agent/tools        # List available tools
WS   /api/v1/agent/stream       # Streaming responses
```

## Coding Conventions

### Go
- **Error handling**: Explicit returns, no panics in production code
- **Testing**: Table-driven tests preferred (see `.specswarm/quality-standards.md`)
- **Types**: Use typed structs for API request/response, not maps
- **Database**: Use `sqlx` with named queries and struct scanning

### Financial Data Rules
- Use `DECIMAL` types for monetary values (never float)
- All trades require human approval (HITL)
- AI confidence threshold: minimum 0.7 for trade suggestions
- All operations must have audit context (timestamp, actor, reasoning)

### Security
- Never commit API keys or credentials
- AI agents never write directly to database
- All external input must be validated

## Quality Gates

- **Test Coverage**: 90% minimum (CI enforced)
- **Quality Score**: 90/100 minimum
- Run `go test -cover ./...` before commits

## Documentation

Key documentation files:
- `docs/Technical_Specification.md` - Full technical spec with LLM providers
- `docs/PRD_OmniTrade.md` - Product requirements
- `docs/AI_Trading_System_Architecture.md` - Architecture overview
- `.specswarm/tech-stack.md` - Technology decisions
- `.specswarm/quality-standards.md` - Quality requirements
