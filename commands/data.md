---
name: data
description: Data plane commands for OmniTrade - manage market data ingestion, WebSocket connections, and database operations
---

# Data Plane Operations

## Commands Reference

### `/data:status`
Display current data ingestion status and connection health.

**Usage:**
```
/data:status
```

**Shows:**
- WebSocket connection status (Polygon, Alpaca)
- Messages per second rate
- Database write lag
- Buffer queue size
- Connected symbols count

### `/data:connect <provider>`
Connect to a market data provider via WebSocket.

**Usage:**
```
/data:connect polygon
/data:connect alpaca
```

**Supported Providers:**
| Provider | WebSocket URL | Instruments |
|----------|---------------|-------------|
| Polygon | wss://socket.polygon.io/stocks | US Equities, ETFs, Options |
| Alpaca | wss://stream.data.alpaca.markets/v2/iex | US Equities, Crypto |
| Binance | wss://stream.binance.com:9443/ws | Crypto (300+ pairs) |

### `/data:disconnect <provider>`
Disconnect a WebSocket connection gracefully.

**Usage:**
```
/data:disconnect polygon
```

**Note:** Flushes buffer before disconnecting.

### `/data:ingest <symbol> <provider>`
Manually trigger data ingestion for a specific symbol.

**Usage:**
```
/data:ingest AAPL polygon
/data:ingest BTCUSDT binance
```

**Retrieves:**
- Real-time OHLCV bars
- Level 2 quotes (bid/ask)
- Trade ticks
- Aggregates (1m, 5m, 15m, 1h, 1d)

### `/data:query <symbol> <start> <end> [--interval N]`
Query historical market data from PostgreSQL.

**Usage:**
```
/data:query AAPL 2026-01-01 2026-03-01 --interval 15m
```

**Returns:** JSON array of MarketBar structs

### `/data:cache-stats`
Display Redis caching statistics.

**Usage:**
```
/data:cache-stats
```

**Shows:**
- Technical indicators cache hit rate
- Fundamental chunks cache size
- Session storage usage
- Pub/sub message rate

## Data Flow

```
WebSocket ──→ Tick Buffer ──→ Decoder ──→ Validator ──→ PostgreSQL
                                              ↓
                                         Redis Cache
                                              ↓
                                       Technical Indicators
```

## Database Roles

| Role | Access | Used By |
|------|--------|---------|
| `omnitrade_readonly` | SELECT only | AI agents, Genkit flows |
| `omnitrade_write` | INSERT/UPDATE | Data ingestion service |
| `omnitrade_admin` | ALL | Migrations, maintenance |

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| WebSocket disconnects | Rate limit exceeded | Reduce subscribed symbols |
| Stale market data | Ingestion stopped | Check `/data:status` |
| High DB write lag | Buffer overflow | Increase worker pool |
| Cache miss storm | Redis restart | Warm cache with common symbols |
