---
name: omnitrade-go-backend
description: Use when building or modifying OmniTrade's Go backend — chi router, sqlx queries, dependency injection, handler patterns, or repository layer.
---

# OmniTrade Go Backend Patterns

## Overview

OmniTrade's backend uses go-chi for routing, sqlx for DB access, and strict dependency injection. All components receive their dependencies via constructors — no globals except the Genkit orchestrator's `dbConn`.

## Structure

```
backend/
├── main.go                   # Wire all dependencies here
├── internal/
│   ├── api/
│   │   ├── router.go         # Route definitions + middleware
│   │   └── handlers.go       # Request handlers (thin layer)
│   ├── database/
│   │   ├── db.go             # Connection + pool management
│   │   └── schema.sql        # DDL only — never inline DDL in Go
│   ├── agent/
│   │   └── orchestrator.go   # Genkit flows
│   └── ingestion/
│       └── ticker.go         # Real-time data pipeline
```

## Dependency Injection Pattern

```go
// main.go — wire everything here
db := database.New(cfg)
api := api.NewHandler(db)
router := api.NewRouter(api)
```

```go
// handlers.go — receive via constructor
type Handler struct {
    db *database.DB
}

func NewHandler(db *database.DB) *Handler {
    return &Handler{db: db}
}
```

**Never** use `init()` or package-level vars for dependencies (except Genkit orchestrator).

## Handler Pattern

```go
func (h *Handler) GetProposals(w http.ResponseWriter, r *http.Request) {
    proposals, err := h.db.ListProposals(r.Context())
    if err != nil {
        http.Error(w, "internal error", http.StatusInternalServerError)
        return
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(proposals)
}
```

Rules:
- Handlers are thin — delegate to DB layer
- Always return on error (no panic)
- Use typed request/response structs (never `map[string]interface{}`)
- Use `r.Context()` for all DB calls

## sqlx Query Pattern

```go
// Named queries with struct scanning
type TradeProposal struct {
    ID              uuid.UUID       `db:"id"`
    Symbol          string          `db:"symbol"`
    Action          string          `db:"action"`
    ConfidenceScore decimal.Decimal `db:"confidence_score"` // NEVER float64
    Reasoning       string          `db:"reasoning"`
    Status          string          `db:"status"`
    CreatedAt       time.Time       `db:"created_at"`
}

func (db *DB) ListProposals(ctx context.Context) ([]TradeProposal, error) {
    var proposals []TradeProposal
    err := db.sqlx.SelectContext(ctx, &proposals,
        `SELECT id, symbol, action, confidence_score, reasoning, status, created_at
         FROM trade_proposals
         ORDER BY created_at DESC`)
    return proposals, err
}
```

## Router Setup (go-chi)

```go
func NewRouter(h *Handler) chi.Router {
    r := chi.NewRouter()
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)

    r.Get("/health", h.Health)
    r.Route("/api/v1", func(r chi.Router) {
        r.Get("/assets", h.ListAssets)
        r.Get("/proposals", h.ListProposals)
        r.Get("/proposals/{id}", h.GetProposal)
        r.Post("/proposals/{id}/approve", h.ApproveProposal)
    })
    return r
}
```

## Database Roles (CRITICAL)

| Role | Access | Used By |
|------|--------|---------|
| `omnitrade_readonly` | SELECT on market_data, fundamental_data | AI agents (Genkit flows) |
| Write role | INSERT on trade_proposals, audit_logs | Action Plane handlers |

**AI agents must NEVER use a write-capable DB connection.**

## Error Handling

```go
// Good — explicit return
if err != nil {
    log.Printf("failed to list proposals: %v", err)
    return nil, fmt.Errorf("list proposals: %w", err)
}

// Bad — panic
if err != nil {
    panic(err) // NEVER in production
}
```

## Testing Pattern (Table-Driven)

```go
func TestListProposals(t *testing.T) {
    tests := []struct {
        name    string
        setup   func(db *DB)
        want    int
        wantErr bool
    }{
        {
            name: "returns all pending proposals",
            setup: func(db *DB) {
                // insert test data
            },
            want: 2,
        },
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // ...
        })
    }
}
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `float64` for price/confidence | Use `decimal.Decimal` (shopspring/decimal) |
| `interface{}` in struct fields | Use concrete types |
| DB queries inside chi handler | Move to DB layer method |
| Hardcoded connection string | Use `os.Getenv()` |
| Missing `Context` in DB calls | Always pass `ctx` |
