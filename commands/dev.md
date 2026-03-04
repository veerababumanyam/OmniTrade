---
name: dev
description: Development workflow commands for OmniTrade - build, test, lint, and manage the Go backend and React frontend
---

# Development Workflows

## Commands Reference

### `/dev:build`
Build all project components (backend, frontend, MCP servers).

**Usage:**
```
/dev:build
/dev:build backend
/dev:build frontend
/dev:build mcp
```

**What it does:**
- Backend: `go build -o bin/omnitrade main.go`
- Frontend: `npm run build` (Vite production bundle)
- MCP: Compiles all TypeScript MCP servers

### `/dev:test`
Run tests for specified component.

**Usage:**
```
/dev:test                      # All tests
/dev:test backend              # Go tests with coverage
/dev:test frontend             # Vitest tests
/dev:test --coverage           # With coverage report
/dev:test --watch              # Watch mode
```

**Backend test targets:**
```bash
go test ./...                              # All packages
go test ./internal/agent/...               # Agent tests
go test ./internal/database/... -v         # Verbose DB tests
go test -cover ./...                       # With coverage (target: 90%)
```

**Frontend test targets:**
```bash
npm run test                   # Vitest
npm run test:ui                # Vitest UI
npm run test:coverage          # Coverage report
```

### `/dev:lint`
Run linters and formatters for code quality.

**Usage:**
```
/dev:lint                      # All formatters
/dev:lint backend              # gofmt + golangci-lint
/dev:lint frontend             # ESLint + Prettier
/dev:lint --fix                # Auto-fix issues
```

**Backend linters:**
```bash
gofmt -w ./backend             # Format Go code
golangci-lint run              # Comprehensive lint
go vet ./...                   # Go vet analysis
staticcheck ./...              # Static analysis
```

**Frontend linters:**
```bash
npm run lint                   # ESLint
npm run format                 # Prettier
npm run typecheck              # TypeScript check
```

### `/dev:run`
Start development servers with hot reload.

**Usage:**
```
/dev:run                       # Start all services
/dev:run backend               # Go dev server (air)
/dev:run frontend              # Vite dev server
/dev:run mcp                   # All MCP servers
```

**Development tools:**
- Backend: `air` (hot reload for Go)
- Frontend: `vite` (HMR for React)
- MCP: `tsx watch` (TypeScript watch mode)

### `/dev:db <action>`
Database management operations.

**Usage:**
```
/dev:db migrate                # Run schema migrations
/dev:db rollback               # Rollback last migration
/dev:db seed                   # Seed test data
/dev:db reset                  # Drop and recreate
/dev:db connect                # Open psql shell
```

### `/dev:genkit <action>`
Genkit-specific operations.

**Usage:**
```
/dev:genkit ui                 # Start Genkit UI
/dev:genkit trace <flow-id>    # View flow trace
/dev:genkit test               # Run flow test
```

## Quality Gates

All code must pass these gates before commit:

| Gate | Tool | Threshold |
|------|------|-----------|
| Test coverage | go test | ≥ 90% |
| Linting | golangci-lint | 0 errors |
| Type safety | TypeScript | 0 errors |
| Quality score | Custom script | ≥ 90/100 |

## Pre-Commit Hook

Automatically runs on `git commit`:
```bash
gofmt -w ./backend
go test ./...
npm run lint
```

## Environment Setup

```bash
# Backend
cd backend && go mod download
export DB_HOST=localhost
export DB_USER=omnitrade_readonly
export DB_NAME=omnitrade

# Frontend
cd frontend && npm install
export VITE_API_URL=http://localhost:8080

# MCP Servers
cd mcp/polygon-market-data && npm install
# Repeat for each MCP server
```

## IDE Setup

**VS Code extensions:**
- Go (gopls)
- ESLint
- Prettier
- TypeScript Vue Plugin (Volar)
- GitLens

**Recommended settings:**
```json
{
  "editor.formatOnSave": true,
  "go.useLanguageServer": true,
  "typescript.tsdk": "frontend/node_modules/typescript/lib"
}
```
