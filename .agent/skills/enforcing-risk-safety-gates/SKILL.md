---
name: enforcing-risk-safety-gates
description: Implements position sizing logic, stop-loss enforcement, and the RiskManager agent veto protocols across both Go and Python layers. Use when handling trade execution or defining risk limits.
---

# Enforcing Risk and Safety Gates

This skill defines the "Pre-Flight" checks and automated safety protocols that protect the OmniTrade portfolio from catastrophic loss.

## When to use this skill
- When implementing the `RiskManager` agent logic.
- When calculating position sizes or stop-loss levels.
- When defining "Flash Crash" circuit breakers.
- When modifying the Action Plane's verification logic.

## Workflow

- [ ] **Exposure Limit**: Ensure no single asset exceeds 10% of total portfolio value.
- [ ] **Stop-Loss Enforcement**: Every trade MUST have a programmatic stop-loss or ATR-based trailing stop.
- [ ] **Risk Veto**: The `RiskManager` agent has final "Veto" power over any `PortfolioManager` proposal.
- [ ] **Audit Trail**: Every risk rejection must be logged with specific violation codes.

## Instructions

### 1. Position Sizing (Fixed Risk model)
```go
// Example in Go (Internal/Risk)
func CalculateSize(capital float64, price float64, stopLoss float64) float64 {
    riskPerTrade := capital * 0.01 // Risk 1% of total capital
    riskAmount := price - stopLoss
    if riskAmount <= 0 { return 0 }
    return riskPerTrade / riskAmount
}
```

### 2. Risk Manager Agent Logic
The Risk Manager evaluates proposals based on:
1. **Correlation**: Does this trade increase exposure to an already saturated sector?
2. **Volatility**: Is the current ATR (Average True Range) too high for the strategy's risk profile?
3. **Budget**: Does the trade exceed the `allocator_budget`?

### 3. Veto Protocol
If any safety gate fails, the proposal status must be set to `REJECTED_BY_RISK` and a notification sent to the UI.

## Resources
- [Security & HITL Protocol](../../docs/05_Security_HITL_Protocol.md)
- [Risk Manager Implementation](../../backend/internal/agent/risk_manager.go)
