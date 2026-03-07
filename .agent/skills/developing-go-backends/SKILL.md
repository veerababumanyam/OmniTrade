---
name: developing-go-backends
description: Develops and maintains Go backend applications following OmniTrade's Three-Plane Architecture. Use when modifying or creating main.go, internal/api, internal/database, or internal/agent modules. Focuses on Dependency Injection, sqlx, and Genkit patterns.
---

# Developing Go Backends

This skill provides the structure and patterns for the OmniTrade Go backend, which serves as the **Intelligence** and **Action** plane coordinator.

## When to use this skill
- When creating or refactoring backend services, API handlers, or database layers.
- When implementing **Dependency Injection** for new components.
- When navigating the codebase using **kilo-indexer** or **jcodemunch**.
- When defining environment variables or service configuration.

## Workflow

- [ ] **Context Discovery**: Use **`kilo-indexer:codebase_search`** or **`jcodemunch:get_file_outline`** to understand existing patterns.
- [ ] **Logic Isolation**: Use **`jcodemunch:get_symbol`** to read specific implementation details before refactoring.
- [ ] **Dependency Injection**: Use constructors to pass dependencies. No global states.
- [ ] **Layering Check**: Keep business logic in `internal/agent` or `internal/ingestion`, not API handlers.
- [ ] **Error Handling**: Explicitly return and handle errors. NO `panic` in production.
- [ ] **Testing Coverage**: Follow table-driven testing patterns (target 90% coverage).
- [ ] **Environment Mapping**: Ensure all secrets are pulled from Environment Variables.

## Instructions

### 1. Codebase Exploration (MCP)
Before adding new features, use semantic search to find similar existing patterns.
```bash
# Semantic search for logic
tools/call kilo-indexer codebase_search { "query": "how is the consensus reach?" }

# Precise symbol retrieval
tools/call jcodemunch get_symbol { "repo": "OmniTrade", "symbol_id": "ConsensusLogic" }
```

### 2. Database Patterns (sqlx)
Use named queries for clarity and struct mapping for safety.
```go
type Asset struct {
    ID     string `db:"id"`
    Symbol string `db:"symbol"`
}

func GetAssets(db *sqlx.DB) ([]Asset, error) {
    var assets []Asset
    err := db.Select(&assets, "SELECT id, symbol FROM assets")
    return assets, err
}
```

### 3. API Handlers (go-chi)
Handlers should be simple "thin" wrappers that decode input and call service logic.
```go
func (h *Handler) GetAsset(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    asset, err := h.service.FetchAsset(id)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    json.NewEncoder(w).Encode(asset)
}
```

### 4. Dependency Injection
```go
func NewService(db *sqlx.DB, logger *zap.Logger) *Service {
    return &Service{db: db, logger: logger}
}
```

## Resources
- [Leveraging MCP Ecosystem](../leveraging-omnitrade-mcp-ecosystem/SKILL.md)
- [Backend Structure Reference](resources/BACKEND_STRUCTURE.md)
- [Example: Flow-Service Link](examples/flow-service.go)
