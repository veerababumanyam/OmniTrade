# OmniTrade Architecture Review & Recommendations

## Executive Summary

OmniTrade is a sophisticated multi-agent AI quantitative trading platform with a well-conceived **Three-Plane Architecture** (Data, Intelligence, Action). The project demonstrates strong foundational thinking around security (read-only AI access, HITL approvals), extensibility (plugin systems, MCP integration), and modern UX (Generative UI, Liquid Glass design). Many critical issues have been addressed in recent updates.

---

## 1. Architecture Strengths

### 1.1 Three-Plane Separation
The architectural concept of **Data Plane (Read-Only) → Intelligence Plane → Action Plane (HITL)** is sound and aligns with security best practices for financial systems.

### 1.2 Rich Technical Indicator Library
The `backend/indicators/` package contains **100+ technical indicators** across momentum, trend, volatility, and volume categories, plus **50+ trading strategies** with decorator/compound patterns. This is exceptional depth.

### 1.3 Plugin Architecture
The dual-plugin system (Claude Code Plugin + Internal Agent Plugin System) with hooks, tools registry, and circuit breakers demonstrates enterprise-grade extensibility.

### 1.4 Comprehensive Frontend Design System
The `frontend/packages/ui/` provides a well-structured component library with atoms → molecules → organisms → templates hierarchy and modern CSS tooling.

### 1.5 MCP Integration
Five MCP servers (Polygon, SEC, pgvector, Alpaca, Financial News) provide solid data integration fabric.

---

## 2. Completed Improvements

### 2.1 Global Mutex State in Agent Orchestrator ✅ FIXED

**Location:** `backend/internal/agent/orchestrator.go`

**Previous Issue:** Using package-level global variable `var dbConn *database.DB` violated dependency injection principles.

**Fix Applied:** Replaced with proper `Orchestrator` struct with dependency injection:
```go
type Orchestrator struct {
    genkit *genkit.Genkit
}

func NewOrchestrator(g *genkit.Genkit) *Orchestrator {
    return &Orchestrator{genkit: g}
}
```

---

### 2.2 Mock Data in API Handlers ✅ FIXED

**Location:** `backend/internal/api/handlers.go`

**Previous Issue:** Production endpoints returned hardcoded mock data.

**Fix Applied:** Implemented actual database queries:
- `FetchAssets()` - retrieves all stock assets
- `FetchAssetBySymbol()` - retrieves single asset
- `FetchLatestMarketData()` - retrieves latest price data
- `FetchMarketDataRange()` - retrieves historical data
- `FetchProposals()` - retrieves trade proposals
- `FetchProposalByID()` - retrieves single proposal

---

### 2.3 Missing Database Indexes ✅ FIXED

**Location:** `backend/internal/database/schema.sql`

**Previous Issue:** No indexes on frequently queried columns.

**Fix Applied:** Added strategic indexes:
```sql
CREATE INDEX idx_market_data_symbol_timestamp ON market_data(symbol, timestamp DESC);
CREATE INDEX idx_fundamental_data_symbol_report ON fundamental_data(symbol, report_type);
CREATE INDEX idx_trade_proposals_status_created ON trade_proposals(status, created_at DESC);
```

---

### 2.4 Authentication/Authorization Layer ✅ IMPLEMENTED

**Location:** `backend/internal/api/middleware.go`

**Previous Issue:** All API endpoints were unauthenticated.

**Fix Applied:** Implemented JWT authentication:
- Token-based authentication with HMAC signing
- Role-based access control (RequireRole middleware)
- Login endpoint with token generation
- User context propagation through request lifecycle

---

### 2.5 Three-Plane Database Isolation ✅ IMPLEMENTED

**Location:** `backend/internal/actionPlane/service.go`, `backend/internal/database/schema.sql`

**Previous Issue:** Schema documented intent but didn't implement role separation.

**Fix Applied:**
- Created `omnitrade_readonly` role for Intelligence Plane
- Created `omnitrade_write` role for Action Plane
- Implemented `ActionPlaneDB` service with separate connection
- Added proposal creation, approval, rejection, and execution handlers
- Added immutable audit logging

---

### 2.6 Health Check Enhancement ✅ IMPLEMENTED

**Location:** `backend/internal/api/handlers.go`

**Previous Issue:** Health check didn't verify dependencies.

**Fix Applied:** Comprehensive health check with:
- Database connectivity verification
- Read-only mode status
- Service status per dependency
- Appropriate HTTP status codes (200/503)

---

### 2.7 Rate Limiting ✅ IMPLEMENTED

**Location:** `backend/internal/api/router.go`

**Previous Issue:** No rate limiting protection.

**Fix Applied:** Added go-chi throttling middleware:
```go
r.Use(middleware.Throttle(100))
```

---

## 3. Remaining Recommendations

### 3.1 Incomplete MCP Server Implementation

**Problem:** The `financial-news` MCP server path references a non-existent file.

**Recommendation:** Verify all MCP server implementations exist or remove unused configurations from `.mcp.json`.

---

### 3.2 Frontend Monorepo Incomplete

**Problem:** The `frontend/apps/web` directory appears empty.

**Recommendation:** Verify frontend entry point and ensure complete web application exists.

---

### 3.3 Missing ML Microservice

**Problem:** The architecture document references a Python ML microservice but no implementation exists.

**Recommendation:** Create `backend/ml/` or separate `ml-service/` repository with FastAPI for model inference.

---

### 3.4 WebSocket Support

**Problem:** No WebSocket endpoint for real-time frontend updates.

**Recommendation:** Add WebSocket support using `gorilla/websocket` for real-time market data streaming.

---

### 3.5 Observability & Logging

**Problem:** Uses basic `log` package.

**Recommendation:** Implement structured logging with `slog` or `zap`, add OpenTelemetry tracing.

---

## 4. Summary

| Priority | Issue | Status |
|----------|-------|--------|
| **Critical** | Global `dbConn` state | ✅ Fixed |
| **Critical** | Mock API handlers | ✅ Fixed |
| **Critical** | Missing DB indexes | ✅ Fixed |
| **High** | No authentication | ✅ Fixed |
| **High** | Incomplete three-plane isolation | ✅ Fixed |
| **Medium** | Empty frontend app dir | 🔲 Pending |
| **Medium** | Missing ML microservice | 🔲 Pending |
| **Low** | No WebSocket support | 🔲 Pending |

The foundation is now solid for production deployment. The priority should be addressing the remaining medium-priority items.

**Location:** [`backend/internal/agent/orchestrator.go:12`](backend/internal/agent/orchestrator.go:12)

```go
var dbConn *database.DB  // ⚠️ Global mutable state
```

**Problem:** Using a package-level global variable violates the dependency injection principle stated in CLAUDE.md and introduces race conditions in concurrent requests.

**Recommendation:** Pass `db` through context or use Genkit's dependency injection properly.

---

### 2.2 Mock Data in API Handlers

**Location:** [`backend/internal/api/handlers.go:26-29`](backend/internal/api/handlers.go:26-29)

```go
mockAssets := []Asset{
    {Symbol: "AAPL", CompanyName: "Apple Inc.", Sector: "Technology"},
    {Symbol: "MSFT", CompanyName: "Microsoft Corp.", Sector: "Technology"},
}
```

**Problem:** Production endpoints return hardcoded mock data. No database queries implemented.

**Recommendation:** Implement actual `sqlx` queries using the injected `a.DB` connection.

---

### 2.3 Missing Indexes in Database Schema

**Location:** [`backend/internal/database/schema.sql`](backend/internal/database/schema.sql)

**Problem:** 
- No indexes on `market_data.symbol`, `market_data.timestamp`
- No composite index on `fundamental_data.symbol`, `fundamental_data.report_type`
- No index on `trade_proposals.status` for filtering

**Recommendation:** Add strategic indexes for query performance:

```sql
CREATE INDEX idx_market_data_symbol_time ON market_data(symbol, timestamp DESC);
CREATE INDEX idx_fundamental_data_symbol_report ON fundamental_data(symbol, report_type);
CREATE INDEX idx_trade_proposals_status ON trade_proposals(status);
```

---

### 2.4 Incomplete MCP Server Implementation

**Problem:** While MCP servers are configured in `.mcp.json`, the `financial-news` server path references a non-existent file:
```
C:\Users\admin\Desktop\OmniTrade\mcp\financial-news\dist\index.js
```

**Recommendation:** Verify all MCP server implementations exist or remove unused configurations.

---

### 2.5 No Authentication/Authorization Layer

**Location:** [`backend/internal/api/router.go:40-41`](backend/internal/api/router.go:40-41)

```go
// Mock Authentication middleware could be added here
// r.Use(AuthMiddleware)
```

**Problem:** All API endpoints are unauthenticated. The Three-Plane Architecture's security model is incomplete without this.

**Recommendation:** Implement JWT/OAuth middleware before production deployment.

---

## 3. Medium-Priority Enhancements

### 3.1 Incomplete Three-Plane Database Isolation

**Location:** [`backend/internal/database/schema.sql:41-43`](backend/internal/database/schema.sql:41-43)

```sql
-- Note: The Intelligence plane should NOT have INSERT access...
-- A separate microservice with a different role should handle...
```

**Problem:** The schema documents the intent but doesn't implement the role separation. There's no separate write service or role configuration.

**Recommendation:** 
1. Create `omnitrade_write` role with restricted INSERT/UPDATE on `trade_proposals`
2. Create separate database connection pool for Action Plane
3. Implement proposal creation service using write role

---

### 3.2 Frontend Monorepo Incomplete

**Location:** [`frontend/apps/web`](frontend/apps/web)

**Problem:** The `frontend/apps/web` directory appears empty. The monorepo structure (`apps/`, `packages/`) is set up but the main web application may not be fully implemented.

**Recommendation:** Verify frontend entry point and ensure complete web application exists.

---

### 3.3 Missing Error Handling in Handlers

**Location:** [`backend/internal/api/handlers.go`](backend/internal/api/handlers.go)

**Problem:** Handlers lack proper error handling. No JSON encoding errors are caught, no database error propagation.

**Recommendation:**
```go
func (a *API) HandleGetAssets(w http.ResponseWriter, r *http.Request) {
    // Add actual DB query with error handling
    assets, err := a.DB.FetchAssets(r.Context())
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(assets)
}
```

---

### 3.4 No Rate Limiting or Circuit Breaker on API

**Problem:** API handlers have no rate limiting, throttling, or circuit breaker protection against abuse.

**Recommendation:** Add middleware:
- `ratelimit.NewMiddleware` (go-chi middleware)
- Circuit breaker pattern for external API calls

---

### 3.5 Missing Health Check for Dependencies

**Location:** [`backend/internal/api/handlers.go:11-14`](backend/internal/api/handlers.go:11-14)

```go
func (a *API) HandleHealth(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"status": "..."})
}
```

**Problem:** Health check doesn't verify database connectivity, Redis, or external API availability.

**Recommendation:** Implement comprehensive health check:
```go
func (a *API) HandleHealth(w http.ResponseWriter, r *http.Request) {
    health := map[string]interface{}{"status": "healthy"}
    
    // Check DB
    if err := a.DB.Ping(); err != nil {
        health["database"] = map[string]string{"status": "unhealthy", "error": err.Error()}
    }
    
    // Return appropriate status code
    status := http.StatusOK
    if health["database"] != nil { status = http.StatusServiceUnavailable }
    
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(health)
}
```

---

## 4. Recommended Improvements & Future Enhancements

### 4.1 ML Microservice (Phase 4 Gap)

The architecture document references a **Python ML microservice** with LightGBM, LSTM, TFT, but no `ml-service/` directory exists in the codebase.

**Recommendation:** Create `backend/ml/` or separate `ml-service/` repository with:
- FastAPI endpoints for model inference
- MLflow integration for model registry
- Feature store connectivity

---

### 4.2 WebSocket Support for Real-Time Data

The ingestion layer has [`backend/internal/ingestion/ticker.go`](backend/internal/ingestion/ticker.go) but no WebSocket endpoint for real-time frontend updates.

**Recommendation:** Add WebSocket support using `gorilla/websocket`:
```go
import "github.com/gorilla/websocket"

var upgrader = websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool { return true },
}

func (a *API) HandleWS(w http.ResponseWriter, r *http.Request) {
    conn, _ := upgrader.Upgrade(w, r, nil)
    // Subscribe to market data events
}
```

---

### 4.3 Observability & Logging

**Current:** Uses basic `log` package

**Recommendation:** Implement structured logging:
- Use `slog` (Go 1.21+) or `zap`
- Add request tracing (OpenTelemetry)
- Integrate with SpecSwarm quality gates

---

### 4.4 Configuration Management

**Current:** Environment variables hardcoded with defaults in multiple places

**Recommendation:** Implement centralized config:
- Use `viper` or `standard library envconfig`
- Add config validation at startup
- Store runtime config in database (per architecture doc)

---

### 4.5 Testing Coverage

**Current:** No visible test files in core backend packages

**Recommendation:** Add comprehensive tests:
- Unit tests for indicators (already extensive)
- Integration tests for API handlers
- Mock-based tests for agent orchestration

---

## 5. Summary of Priority Actions

| Priority | Issue | Impact |
|----------|-------|--------|
| **Critical** | Global `dbConn` state | Concurrency bugs |
| **Critical** | Mock API handlers | No real functionality |
| **Critical** | Missing DB indexes | Poor query performance |
| **High** | No authentication | Security vulnerability |
| **High** | Incomplete three-plane isolation | Architecture mismatch |
| **Medium** | Empty frontend app dir | Missing web UI |
| **Medium** | No error handling | Unstable production |
| **Low** | Missing ML microservice | Incomplete architecture |

---

## 6. Positive Observations

Despite these issues, the project demonstrates:

- ✅ **Clear architectural vision** with Three-Plane model
- ✅ **Exceptional indicator/strategy coverage** (100+ indicators, 50+ strategies)
- ✅ **Modern frontend design system** with proper component hierarchy
- ✅ **Strong extensibility** via plugins, hooks, and MCP
- ✅ **Comprehensive documentation** (PRD, architecture docs, design specs)
- ✅ **Well-structured monorepo** with proper separation

The foundation is solid; the priority should be addressing the critical issues to achieve production-readiness.
