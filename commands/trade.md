---
name: trade
description: Trade management commands for OmniTrade's Human-in-the-Loop workflow - approve, reject, list, and analyze trade proposals
---

# Trade Management

## Commands Reference

### `/trade:status`
Display current HITL queue status and pending trade proposals.

**Usage:**
```
/trade:status
```

**Shows:**
- Pending proposals count
- Approval rate (last 24h)
- Active symbols
- Risk Manager veto count

### `/trade:approve <proposal-id>`
Approve a specific trade proposal after reviewing its chain-of-thought reasoning.

**Usage:**
```
/trade:approve 123e4567-e89b-12d3-a456-426614174000
```

**Requirements:**
- Confidence score ≥ 0.70
- Risk Manager approved (not REJECT)
- Audit log will record approval with timestamp and actor

### `/trade:reject <proposal-id> <reason>`
Reject a trade proposal with documented reasoning.

**Usage:**
```
/trade:reject 123e4567-e89b-12d3-a456-426614174000 "Excessive exposure to tech sector"
```

**Note:** Rejection reason is permanently logged to immutable audit log.

### `/trade:analyze <symbol>`
Generate a new trade proposal for the specified symbol using multi-agent analysis.

**Usage:**
```
/trade:analyze AAPL
/trade:analyze TSLA --strategy day_trading
```

**Triggers:**
1. Data Fetcher (OHLCV, news, fundamentals)
2. Parallel Agent Analysis (Fundamental, Technical, Sentiment)
3. Risk Manager Review
4. Portfolio Manager Synthesis

### `/trade:history <symbol> [--days N]`
View past trade proposals and their outcomes for a symbol.

**Usage:**
```
/trade:history AAPL
/trade:history AAPL --days 30
```

**Shows:**
- Proposal timestamps
- Actions taken (BUY/SELL/HOLD)
- Approval/rejection status
- Performance metrics

## Workflow

```
/trade:analyze → TradeProposal → PENDING_REVIEW
                                    ↓
                            /trade:approve  → APPROVED → Execution (Alpaca API)
                                    ↓
                            /trade:reject  → REJECTED → Audit Log
```

## Safety Rules

- All trades require human approval (HITL enforced)
- AI agents use `omnitrade_readonly` database role
- Risk Manager REJECT cannot be overridden
- Minimum confidence: 0.70
- All prices use `decimal.Decimal` (never float64)
