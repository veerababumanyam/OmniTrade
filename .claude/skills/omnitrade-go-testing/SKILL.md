---
name: omnitrade-go-testing
description: Use when writing or running tests for OmniTrade's Go backend — table-driven tests, DB mocking, Genkit flow testing, 90% coverage requirement, or CI quality gates.
---

# OmniTrade Go Testing Patterns

## Overview

OmniTrade requires 90% test coverage minimum (CI enforced). All tests use table-driven style. DB interactions use an in-memory or test-container PostgreSQL. Genkit flows are tested with mock tools.

## Run Commands

```bash
cd backend
go test ./...                    # All tests
go test -cover ./...             # Coverage report
go test -coverprofile=cov.out ./... && go tool cover -func=cov.out  # Per-function coverage
go test ./internal/agent/...     # Single package
go test -run TestListProposals   # Single test
```

**Quality gate:** `go test -cover ./...` must show 90%+ before any commit.

## Table-Driven Test Pattern

```go
func TestValidatePositionSize(t *testing.T) {
    tests := []struct {
        name          string
        size          decimal.Decimal
        portfolioValue decimal.Decimal
        wantErr       bool
        errContains   string
    }{
        {
            name:           "valid 5% position",
            size:           decimal.NewFromFloat(500),
            portfolioValue: decimal.NewFromFloat(10000),
            wantErr:        false,
        },
        {
            name:           "exceeds 10% limit",
            size:           decimal.NewFromFloat(1100),
            portfolioValue: decimal.NewFromFloat(10000),
            wantErr:        true,
            errContains:    "10%% limit",
        },
        {
            name:           "exactly 10% - boundary",
            size:           decimal.NewFromFloat(1000),
            portfolioValue: decimal.NewFromFloat(10000),
            wantErr:        false,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := validatePositionSize(tt.size, tt.portfolioValue)
            if tt.wantErr {
                if err == nil {
                    t.Fatalf("expected error containing %q, got nil", tt.errContains)
                }
                if tt.errContains != "" && !strings.Contains(err.Error(), tt.errContains) {
                    t.Errorf("error %q does not contain %q", err.Error(), tt.errContains)
                }
            } else if err != nil {
                t.Fatalf("unexpected error: %v", err)
            }
        })
    }
}
```

## DB Test Setup (testcontainers)

```go
// testutil/db.go — shared test helper
func NewTestDB(t *testing.T) *database.DB {
    t.Helper()
    ctx := context.Background()

    container, err := postgres.RunContainer(ctx,
        testcontainers.WithImage("pgvector/pgvector:pg16"),
        postgres.WithDatabase("omnitrade_test"),
        postgres.WithUsername("test"),
        postgres.WithPassword("test"),
    )
    require.NoError(t, err)

    t.Cleanup(func() { container.Terminate(ctx) })

    connStr, _ := container.ConnectionString(ctx, "sslmode=disable")
    db, err := database.New(connStr)
    require.NoError(t, err)

    // Run schema migrations
    applySchema(t, db, "../../internal/database/schema.sql")
    return db
}
```

## Testing DB Role Constraints (CRITICAL)

```go
// Verify omnitrade_readonly cannot INSERT — this is a key security test
func TestReadonlyRoleCannotInsert(t *testing.T) {
    db := NewTestDBWithRole(t, "omnitrade_readonly")

    tick := MarketTick{Symbol: "AAPL", Close: decimal.NewFromFloat(150)}
    err := db.InsertTick(context.Background(), tick)

    if err == nil {
        t.Fatal("expected readonly role INSERT to fail, but it succeeded")
    }
    if !strings.Contains(err.Error(), "permission denied") {
        t.Errorf("expected permission denied error, got: %v", err)
    }
}
```

## Testing Genkit Flows (Mock Tools)

```go
func TestGenerateTradeProposal_BelowConfidence(t *testing.T) {
    // Mock the DB to return controlled data
    mockDB := &MockDB{
        MarketData: []MarketBar{{Symbol: "AAPL", Close: decimal.NewFromFloat(100)}},
    }

    // Override LLM with deterministic mock
    mockLLM := &MockLLMClient{
        Response: TradeProposalOutput{
            Symbol:          "AAPL",
            Action:          "BUY",
            ConfidenceScore: 0.55, // below 0.70 threshold
        },
    }

    _, err := runGenerateTradeProposal(context.Background(), TradeProposalInput{
        Symbol:   "AAPL",
        Strategy: "positional",
    }, mockDB, mockLLM)

    if err == nil {
        t.Fatal("expected confidence gate to reject 0.55 score")
    }
    if !strings.Contains(err.Error(), "below minimum") {
        t.Errorf("unexpected error: %v", err)
    }
}
```

## Testing Risk Manager Veto

```go
func TestRiskManagerVetoBlocksExecution(t *testing.T) {
    // Risk manager returns REJECT
    mockRisk := RiskDecision{
        ApprovalStatus: "REJECT",
        Reasoning:      "VIX above 40",
    }

    result, err := applyRiskDecision(TradeProposalOutput{
        Action:          "BUY",
        ConfidenceScore: 0.90,
    }, mockRisk)

    require.NoError(t, err)
    if result.Action != "HOLD" {
        t.Errorf("expected HOLD after Risk Manager REJECT, got %s", result.Action)
    }
}
```

## Testing HTTP Handlers

```go
func TestApproveProposal_RequiresAuth(t *testing.T) {
    db := NewTestDB(t)
    h := api.NewHandler(db)
    r := api.NewRouter(h)

    // Request without auth header
    req := httptest.NewRequest("POST", "/api/v1/proposals/test-id/approve", nil)
    w := httptest.NewRecorder()
    r.ServeHTTP(w, req)

    if w.Code != http.StatusUnauthorized {
        t.Errorf("expected 401, got %d", w.Code)
    }
}
```

## Coverage Targets by Package

| Package | Required Coverage |
|---------|-----------------|
| `internal/database` | 90% |
| `internal/api` | 90% |
| `internal/agent` | 85% (LLM calls hard to test) |
| `internal/ingestion` | 85% |

## Mock Interface Pattern

```go
// Define interface for testability
type DBInterface interface {
    InsertTick(ctx context.Context, tick MarketTick) error
    ListProposals(ctx context.Context) ([]TradeProposal, error)
    // ...
}

// Real implementation
type DB struct { sqlx *sqlx.DB }

// Mock for tests
type MockDB struct {
    Ticks     []MarketTick
    Proposals []TradeProposal
    Err       error
}
func (m *MockDB) InsertTick(_ context.Context, _ MarketTick) error { return m.Err }
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Tests without `t.Helper()` in helpers | Add `t.Helper()` to all test utilities |
| Single test case (no table) | Table-driven: min 3 cases including edge cases |
| No role-constraint test | Always test readonly role cannot write |
| No confidence gate test | Test 0.69 is rejected, 0.70 is accepted |
| Direct DB in handler test | Use `httptest.NewRecorder()` + mock DB |
| Ignoring coverage below 90% | Run `go test -cover ./...` before every commit |
