---
name: managing-financial-trading
description: Enforces strict financial calculation rules, decimal precision, and trading safety gates. Use when handling prices, monetary values, confidence scores, position sizing, or any financial calculation in OmniTrade. Prevents float precision bugs and ensures HITL compliance.
---

# Managing Financial Trading

This skill ensures all financial operations within OmniTrade adhere to strict precision and safety standards. It prohibits `float64` for monetary values and enforces the **Three-Plane Architecture**'s safety gates.

## When to use this skill
- When defining structs/models for trade proposals, prices, or orders.
- When performing arithmetic on currency or asset volumes.
- When implementing trade validation or "Circuit Breaker" logic.
- When handling timestamps or audit logs for financial events.

## Workflow

- [ ] **Enforce Decimals**: Ensure `decimal.Decimal` (from `github.com/shopspring/decimal`) is used for all monetary types. NO `float64`.
- [ ] **Validate Confidence**: Apply the `>= 0.70` confidence threshold gate.
- [ ] **Audit Compliance**: Every state change must include `AuditContext` (Timestamp, Actor, Reasoning).
- [ ] **Verify HITL**: Ensure AI agents NEVER execute trades directly; all actions must route to the Action Plane for approval.
- [ ] **Position Limits**: Validate that no single position exceeds 10% of portfolio value.
- [ ] **Timezone Check**: Ensure `time.Time.UTC()` is used for all timestamps.

## Instructions

### 1. The "Zero-Float" Mandate
Floating-point errors are unacceptable in trading.
- **Go**: Use `decimal.Decimal`.
- **SQL**: Use `DECIMAL(15, 4)` for prices and `DECIMAL(20, 8)` for volumes.

### 2. Boundary Conversion
Convert external data (APIs, LLM outputs) to `Decimal` immediately at the boundary.
```go
// Boundary: Flow output or API response
confidence := decimal.NewFromFloat(llmOutput.Confidence)
price := decimal.NewFromFloat(apiTick.Price)
```

### 3. Safety Gates (Go)
```go
const MinConfidenceScore = 0.70

func IsValidProposal(p *TradeProposal) error {
    if p.Confidence.LessThan(decimal.NewFromFloat(MinConfidenceScore)) {
        return fmt.Errorf("confidence below threshold: %v", p.Confidence)
    }
    return nil
}
```

### 4. Database Mapping
- Use `TIMESTAMPTZ` for all time columns.
- Use `DECIMAL` types. Avoid `FLOAT` or `REAL`.

## Resources
- [Financial Type Reference](resources/FINANCIAL_TYPES.md)
- [Example: Risk Manager Logic](examples/risk-manager.go)
