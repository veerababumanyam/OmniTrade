---
name: managing-redis-caching
description: Use when implementing Redis in OmniTrade — real-time market data pub/sub, session caching, rate limiting, or live WebSocket feed to the React frontend.
---

# Managing Redis Caching

This skill provides the structure and patterns for OmniTrade's **Performance Layer**, using Redis for real-time market tick pub/sub and computed indicator caching.

## When to use this skill
- When implementing real-time market tick propagation from ingestion to the frontend.
- When caching expensive technical indicator computations (RSI, MACD, etc.).
- When managing user sessions and JWT metadata.
- When implementing rate limiting for API endpoints.
- When storing/retiring session data or latest price lookups.
- When implementing the **Event-Driven Signal Bus** (IMC) for cross-service module communication.
- When storing **Spatial Continuity** metadata for UI volume handoffs.

## Workflow

- [ ] **Precision Sync**: Always store prices as strings in Redis to preserve `decimal.Decimal` precision. NO floats.
- [ ] **Define TTL**: Every `SET` operation must include an appropriate TTL (e.g., 5m for indicators, 24h for sessions).
- [ ] **Pub/Sub Namespace**: use the `market:ticks:{SYMBOL}` namespace for real-time tick channels.
- [ ] **Fallback Logic**: Ensure service logic falls back to PostgreSQL if Redis is unavailable or returns a cache miss.
- [ ] **Rate Limit Gate**: Use `INCR` + `EXPIRE` patterns for per-IP/per-endpoint rate limiting.
- [ ] **Session Security**: Store session JSON with a 24h TTL and verify against the `session:{TOKEN}` key.
- [ ] **IMC Bus Hub**: Configure Redis Pub/Sub for the global `ui:signals:*` namespace (AGM coordination).
- [ ] **Handoff Storage**: Store UI volume "Quantum States" with short TTL (e.g., 10m) for spatial handoffs.

## Instructions

### 1. Market Tick Pub/Sub (Go)
```go
func (t *Ticker) Publish(ctx context.Context, tick MarketBar) error {
    payload, _ := json.Marshal(tick)
    return t.rdb.Publish(ctx, "market:ticks:"+tick.Symbol, payload).Err()
}
```

### 2. Indicator Caching
Cache expensive indicators for 5 minutes to avoid recomputing on every agent call.
```go
key := "indicators:" + symbol
val, err := rdb.Get(ctx, key).Bytes()
if err == nil {
    return Unmarshal(val)
}
// Cache miss... compute and set with 5min TTL
```

### 3. Key Naming Standards
- `market:ticks:{SYMBOL}`: Live tick channel.
- `market:latest:{SYMBOL}`: Latest price (String).
- `indicators:{SYMBOL}`: Technical indicators (JSON).
- `session:{TOKEN}`: User session (JSON).
- `ratelimit:{IP}:{Path}`: Counter.
- `ui:signals:{MODULE}`: Global signal channel (Pub/Sub).
- `ui:handoff:{VOLUME_ID}`: UI volume state for spatial continuity (Short-lived JSON).

- **Precision Rules**: Always store prices as strings in Redis: `tick.Close.String()`.
- **Handoff Rule**: Store the complete "Functional Blueprint" of a module in `ui:handoff:*` keys to allow reconstruction on disparate devices.

## Resources
- [Redis Configuration](resources/REDIS_CONFIG.md)
- [Example: WebSocket Pusher](examples/ws_pusher.go)
