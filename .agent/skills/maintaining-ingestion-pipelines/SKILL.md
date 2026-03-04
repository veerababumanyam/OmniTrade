---
name: maintaining-ingestion-pipelines
description: Manages real-time market data ingestion via WebSockets and REST APIs for the OmniTrade Data Plane. Use when modifying ticker pipelines, WebSocket handlers, or market data ingestion logic.
---

# Maintaining Ingestion Pipelines

This skill covers the robust ingestion of real-time market data (Binance, Polygon) into the OmniTrade PostgreSQL and Redis layers.

## When to use this skill
- When adding support for a new market data provider (e.g., Alpaca, Kraken).
- When debugging WebSocket connection drops or reconnection logic.
- When optimizing Go-based concurrent pipelines for high-throughput ticker data.
- When implement data normalization layers (turning provider-specific JSON into internal structs).

## Workflow

- [ ] **Concurrency Control**: Use Go channels and `select` statements for non-blocking ingestion.
- [ ] **Rate Limiting**: Respect provider API limits using token bucket or similar algorithms.
- [ ] **Data Sanitization**: Validate that incoming prices and volumes are within sane ranges (no zero/negative values).
- [ ] **Monitoring**: Ensure every ingestion heartbeat is logged for observability.

## Instructions

### 1. WebSocket Handler Pattern
```go
func (p *Provider) StreamTickers(ctx context.Context, symbols []string) {
    conn, _, err := websocket.Dial(ctx, p.WSUrl, nil)
    if err != nil {
        p.Logger.Error("WS dial failed", zap.Error(err))
        return
    }
    // Reconnection logic with exponential backoff
}
```

### 2. Ticker Pipeline
Raw data is converted to `Tick` structs and pushed to a shared channel.
```go
type Tick struct {
    Symbol    string
    Bid       decimal.Decimal
    Ask       decimal.Decimal
    Timestamp time.Time
}
```

### 3. Redis Pub/Sub
Real-time data should be broadcast to Redis for the React frontend and fast-path agents.

## Resources
- [Data Ingestion Strategy](../../docs/03_Data_Ingestion_Strategy.md)
- [Backend Structure](../../docs/Technical_Specification.md)
