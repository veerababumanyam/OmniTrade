---
name: testing-go-applications
description: Writes and runs tests for OmniTrade's Go backend, including table-driven tests, DB mocking, and Genkit flow testing. Enforces the 90% coverage requirement and CI quality gates.
---

# Testing Go Applications

This skill provides the standards for ensuring code quality and safety in the OmniTrade backend, with a strict focus on table-driven testing and 90% coverage.

## When to use this skill
- When writing unit tests for new Go packages or functions.
- When implementing integration tests with `testcontainers` (PostgreSQL/pgvector).
- When mocking database interactions using interfaces.
- When testing Genkit flows with mock LLM outputs and tools.
- When verifying security constraints (e.g., `omnitrade_readonly` role permissions).

## Workflow

- [ ] **Table-Driven Design**: Use anonymous structs to define test cases. Include edge cases (0, max, nil).
- [ ] **Requirement: 90% Coverage**: Run `go test -cover ./...` and ensure every package meets the 90% target (85% for agent/ingestion).
- [ ] **Mocking Strategy**: Use interfaces for external dependencies (DB, LLM, APIs) to ensure tests are deterministic.
- [ ] **Security Testing**: Explicitly test that read-only roles cannot perform `INSERT/UPDATE/DELETE`.
- [ ] **Genkit Validation**: Mock Genkit tools and verify that flows handle confidence threshold gates correctly.
- [ ] **Assertion Helpers**: Use `require` (from `github.com/stretchr/testify`) for fast failure in setup, and `assert` for general checks.

## Instructions

### 1. Table-Driven Test Pattern (Go)
```go
func TestLogic(t *testing.T) {
    tests := []struct {
        name    string
        input   int
        expected int
        wantErr bool
    }{
        {"Base Case", 10, 20, false},
        {"Edge Case 0", 0, 0, false},
        {"Error Case", -1, 0, true},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := MyFunc(tt.input)
            if (err != nil) != tt.wantErr { t.Errorf("wantErr %v, got %v", tt.wantErr, err) }
            if got != tt.expected { t.Errorf("got %v, expected %v", got, tt.expected) }
        })
    }
}
```

### 2. DB Test Setup
Use `testcontainers-go` to spin up a real `pgvector` instance for integration tests.
- **Image**: `pgvector/pgvector:pg16`
- **Cleanup**: Always use `t.Cleanup` to terminate containers.

### 3. Coverage Commands
- `go test -cover ./...`
- `go test -coverprofile=coverage.out ./...`
- `go tool cover -html=coverage.out` (to visualize missed lines)

### 4. Quality Gates
CI will reject any PR where:
- Coverage falls below 90%.
- A "Read-only" test fails (permission check).
- Confidence threshold tests fail.

## Resources
- [Test Helper Utils](resources/TEST_UTILS.md)
- [Example: DB Mock](examples/db_mock_test.go)
