# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OmniTrade is a multi-agent AI quantitative trading platform with a **Three-Plane Architecture**:
1. **Data Plane** (Read-Only): Real-time market data ingestion via WebSockets/APIs
2. **Intelligence Plane**: Google Genkit-powered multi-agent orchestration
3. **Action Plane** (HITL): Human-in-the-loop trade approval system

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
│   ├── agent/                 # Genkit agent orchestration
│   │   └── orchestrator.go    # Multi-agent flows
│   └── ingestion/             # Market data ingestion
│       └── ticker.go          # Real-time data pipeline
```

### Key Patterns

**Dependency Injection**: All components receive dependencies via constructors, not globals (except `dbConn` in orchestrator for Genkit flow access).

**Database Roles**:
- `omnitrade_readonly`: AI Intelligence Plane (SELECT only on market_data, fundamental_data)
- Separate write role: Action Plane (INSERT on trade_proposals, audit_logs)

**Genkit Flows**: Agent orchestration uses Google Genkit. Each flow is defined with `genkit.DefineFlow()` and has typed input/output structs.

### API Endpoints
```
GET  /health                     # Health check
GET  /api/v1/assets              # List tracked assets
GET  /api/v1/proposals           # List trade proposals
GET  /api/v1/proposals/{id}      # Get proposal by ID
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
