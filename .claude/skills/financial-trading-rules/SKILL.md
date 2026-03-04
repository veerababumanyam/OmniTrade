---
name: financial-trading-rules
description: Use when handling prices, monetary values, confidence scores, position sizing, or any financial calculation in OmniTrade. Prevents float precision bugs and enforces trading safety rules.
---

# Financial Trading Data Rules

## Overview

Financial systems require exact decimal arithmetic. `float64` is FORBIDDEN for monetary values — floating-point precision errors compound in trading calculations and cause real money losses.

## The Golden Rules

1. **Never use `float64` for prices, amounts, or monetary values** — use `decimal.Decimal`
2. **Minimum confidence score: 0.70** — proposals below this are invalid
3. **All trades require human approval** — AI never executes directly
4. **All operations must have audit context** — timestamp, actor, reasoning

## Decimal Types in Go

```go
import "github.com/shopspring/decimal"

// Prices and monetary values
type TradeProposal struct {
    Symbol          string          `db:"symbol"`
    Action          string          `db:"action"`
    ConfidenceScore decimal.Decimal `db:"confidence_score"` // NOT float64
    TargetPrice     decimal.Decimal `db:"target_price"`
    StopLossPrice   decimal.Decimal `db:"stop_loss_price"`
    PositionSize    decimal.Decimal `db:"position_size"`    // % of portfolio
}

// Arithmetic — always use decimal methods
totalValue := price.Mul(quantity)
profitPct  := profit.Div(invested).Mul(decimal.NewFromInt(100))
isAbove    := price.GreaterThan(decimal.NewFromFloat(150.0))
```

## SQL Types

```sql
-- Monetary values
price           DECIMAL(15, 4)   -- e.g., 12345.6789
amount          DECIMAL(20, 8)   -- crypto support
confidence_score DECIMAL(3, 2)  -- 0.00–1.00

-- NEVER
price FLOAT     -- forbidden — imprecise
price REAL      -- forbidden — imprecise
```

## Confidence Score Rules

```go
const MinConfidenceScore = 0.70

// Gate at flow output
if output.ConfidenceScore.LessThan(decimal.NewFromFloat(MinConfidenceScore)) {
    return nil, fmt.Errorf("confidence %.2f below minimum %.2f",
        output.ConfidenceScore, MinConfidenceScore)
}
```

## Risk Manager Circuit Breakers

These are hard rules — the Risk Manager Agent enforces them, and they CANNOT be bypassed even by high-confidence proposals:

```go
const (
    MaxSinglePositionPct = 0.10  // 10% max per asset
    MaxSectorExposurePct = 0.25  // 25% max per sector
    VIXReduceThreshold   = 30.0  // 50% size reduction
    VIXHoldThreshold     = 40.0  // Hold only, no new buys
)

func applyCircuitBreakers(proposal *TradeProposal, vix float64) *TradeProposal {
    if vix > VIXHoldThreshold {
        proposal.Action = "HOLD"
        proposal.Reasoning += " [Circuit Breaker: VIX > 40, no new positions]"
        return proposal
    }
    if vix > VIXReduceThreshold {
        proposal.PositionSize = proposal.PositionSize.Mul(decimal.NewFromFloat(0.5))
        proposal.Reasoning += " [Circuit Breaker: VIX > 30, 50% size reduction]"
    }
    return proposal
}
```

## Audit Context (Required for All Operations)

Every trade-related operation must include:

```go
type AuditContext struct {
    Timestamp time.Time  // UTC always
    Actor     string     // model name or user ID
    Reasoning string     // verbatim AI chain of thought
    EventType string     // PROPOSED | APPROVED | REJECTED | EXECUTED
}
```

## Position Sizing Validation

**These checks are mandatory regardless of upstream approval status. Risk Manager approval does NOT substitute for programmatic validation — both must run independently.**

```go
func validatePositionSize(size decimal.Decimal, portfolioValue decimal.Decimal) error {
    pct := size.Div(portfolioValue)

    if pct.GreaterThan(decimal.NewFromFloat(MaxSinglePositionPct)) {
        return fmt.Errorf("position %.1f%% exceeds 10%% limit",
            pct.Mul(decimal.NewFromInt(100)).InexactFloat64())
    }
    return nil
}
```

## BUY / SELL / HOLD Enum

```go
type TradeAction string

const (
    ActionBUY  TradeAction = "BUY"
    ActionSELL TradeAction = "SELL"
    ActionHOLD TradeAction = "HOLD"
)

// Validate incoming strings
func ParseTradeAction(s string) (TradeAction, error) {
    switch TradeAction(s) {
    case ActionBUY, ActionSELL, ActionHOLD:
        return TradeAction(s), nil
    default:
        return "", fmt.Errorf("invalid trade action: %q", s)
    }
}
```

## Time Handling

```go
// Always UTC — never local time
timestamp := time.Now().UTC()

// DB column type: TIMESTAMPTZ (not TIMESTAMP)
created_at TIMESTAMPTZ DEFAULT NOW()
```

## Boundary Conversion Rule

External APIs and Genkit LLM outputs return `float64`. Convert to `decimal.Decimal` **immediately at the boundary** — never pass raw floats into business logic:

```go
// At the boundary (flow output, API response, WebSocket tick)
confidence := decimal.NewFromFloat(output.ConfidenceScore) // convert once here
price      := decimal.NewFromFloat(rawTick.Close)          // convert once here

// Everything downstream uses decimal.Decimal
```

## OHLCV Struct (MarketBar)

```go
// All price fields use decimal.Decimal — including Volume for crypto (can be fractional)
type MarketBar struct {
    Symbol    string          `db:"symbol"`
    Open      decimal.Decimal `db:"open"`
    High      decimal.Decimal `db:"high"`
    Low       decimal.Decimal `db:"low"`
    Close     decimal.Decimal `db:"close"`
    Volume    decimal.Decimal `db:"volume"`    // decimal — crypto volumes can be fractional
    Timestamp time.Time       `db:"timestamp"` // UTC
}
```

## Quick Reference: Type Rules

| Data | Go Type | SQL Type |
|------|---------|----------|
| Price (OHLC) | `decimal.Decimal` | `DECIMAL(15,4)` |
| Volume | `decimal.Decimal` | `DECIMAL(20,8)` |
| Confidence | `decimal.Decimal` | `DECIMAL(3,2)` |
| Position size | `decimal.Decimal` | `DECIMAL(10,4)` |
| VIX level | `float64` (ok — display only) | `DECIMAL(6,2)` |
| ID | `uuid.UUID` | `UUID` |
| Timestamp | `time.Time` (UTC) | `TIMESTAMPTZ` |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `float64` for price | `decimal.Decimal` |
| `FLOAT` in SQL for money | `DECIMAL(15,4)` |
| `==` comparison on decimals | Use `.Equal()` method |
| Confidence 0.65 accepted | Enforce `>= 0.70` gate |
| Missing audit log | Every status change needs AuditContext |
| `TIMESTAMP` without TZ | Use `TIMESTAMPTZ` |
