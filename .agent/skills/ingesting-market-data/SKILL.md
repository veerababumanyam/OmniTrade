---
name: ingesting-market-data
description: Manages real-time market data ingestion via WebSockets and REST APIs for the OmniTrade Data Plane. Use when modifying ticker pipelines, WebSocket handlers, or market data ingestion logic. Focuses on ticker pipelines and Data Plane read-only workflows.
---

# Ingesting Market Data

This skill provides the structure and patterns for the OmniTrade Data Plane, which focuses on real-time ingestion of market telemetry.

## When to use this skill
- When building or refactoring WebSocket (WS) clients for market data.
- When creating REST-based market data crawlers or fundamental data importers.
- When working with ticker pipelines or ticker handlers.
- When implementing market data storage logic for the Data Plane.

## Workflow

- [ ] **Data Plane Isolation**: Ensure ingestion logic is read-only (except for writing to `market_data` tables). No trade execution logic here.
- [ ] **WebSocket Resilience**: Implement reconnection logic (exponential backoff) and heartbeat handlers.
- [ ] **Ticker Handling**: Use structured buffers (e.g., channels) to manage high-throughput ticks.
- [ ] **OHLCV Alignment**: Ensure all ticks are transformed into UTC-based `MarketBar` structs.
- [ ] **Precision Conversion**: Convert raw input floats to `decimal.Decimal` **at the moment of arrival**.
- [ ] **Logging & Telemetry**: Monitor for gaps in data (data-fill gaps) and ingestion latency.

## Instructions

### 1. WebSocket Ingestion (Go)
Use a resilient pattern for high-frequency data.
```go
func (p *Pipeline) Connect(ctx context.Context) {
    for {
        conn, _, err := websocket.Dial(ctx, p.url, nil)
        if err != nil {
            p.retry(ctx)
            continue
        }
        p.process(ctx, conn)
    }
}
```

### 2. Ticker Normalization
Convert raw vendor data to the OmniTrade `MarketBar` standard.
```go
func ToMarketBar(v VendorTick) MarketBar {
    return MarketBar{
        Symbol:    v.S,
        Open:      decimal.NewFromFloat(v.O),
        Close:     decimal.NewFromFloat(v.C),
        Timestamp: time.UnixMilli(v.T).UTC(),
    }
}
```

### 3. Read-Only Boundaries
Ensure agents in the Data Plane ONLY have access to market-related tables.
- **Role**: `omnitrade_readonly`
- **Tables**: `market_data`, `fundamental_data`, `assets`

### 4. Throughput Management
Use `channel` with appropriate buffers to prevent blocking the WS reader.
```go
ticks := make(chan Tick, 1000)
go p.bufferTicks(ticks)
```

## Resources
- [Ticker Pipeline Patterns](resources/PIPELINE_PATTERNS.md)
- [Example: Kraken WS Client](examples/kraken-ws.go)
