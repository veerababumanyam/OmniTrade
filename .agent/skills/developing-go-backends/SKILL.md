---
name: developing-go-backends
description: Develops and maintains Go backend applications following OmniTrade's Three-Plane Architecture. Use when modifying or creating main.go, internal/api, internal/database, or internal/agent modules. Focuses on Dependency Injection, sqlx, and Genkit patterns.
---

# Developing Go Backends

This skill provides the structure and patterns for the OmniTrade Go backend, which serves as the **Intelligence** and **Action** plane coordinator.

## When to use this skill
- When creating or refactoring backend services, API handlers, or database layers.
- When implementing **Dependency Injection** for new components.
- When working with the `go-chi` router or `sqlx` database extension.
- When defining environment variables or service configuration.

## Workflow

- [ ] **Dependency Injection**: Use constructors to pass dependencies. No global states except `genkit.DefineFlow` context requirements.
- [ ] **Layering Check**: Keep business logic in `internal/agent` or `internal/ingestion`, not API handlers.
- [ ] **Error Handling**: Explicitly return and handle errors. NO `panic` in production.
- [ ] **Testing Coverage**: Follow table-driven testing patterns (target 90% coverage).
- [ ] **SQL Hardening**: Use `sqlx` named queries and struct scanning. NO manual string concatenation.
- [ ] **Environment Mapping**: Ensure all secrets are pulled from Environment Variables, never hardcoded.

## Instructions

### 1. Database Patterns (sqlx)
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

### 2. API Handlers (go-chi)
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

### 3. Dependency Injection
```go
func NewService(db *sqlx.DB, logger *zap.Logger) *Service {
    return &Service{db: db, logger: logger}
}
```

### 4. Configuration
Ensure `main.go` wires everything and exits gracefully on system signals.

## Resources
- [Backend Structure Reference](resources/BACKEND_STRUCTURE.md)
- [Example: Flow-Service Link](examples/flow-service.go)
