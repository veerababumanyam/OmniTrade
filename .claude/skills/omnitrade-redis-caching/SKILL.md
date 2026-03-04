---
name: omnitrade-redis-caching
description: Use when implementing Redis in OmniTrade — real-time market data pub/sub, session caching, rate limiting, or live WebSocket feed to the React frontend.
---

# OmniTrade Redis Caching Patterns

## Overview

OmniTrade uses Redis for two purposes: (1) real-time market tick pub/sub from the ingestion layer to the frontend WebSocket feed, and (2) caching computed indicators and session data. Redis is NOT the source of truth — PostgreSQL is.

## Connection Setup

```go
import "github.com/redis/go-redis/v9"

func NewRedisClient() *redis.Client {
    return redis.NewClient(&redis.Options{
        Addr:     os.Getenv("REDIS_ADDR"),     // e.g. "localhost:6379"
        Password: os.Getenv("REDIS_PASSWORD"), // empty if no auth
        DB:       0,
        PoolSize: 20,
    })
}
```

## Real-Time Market Data (Pub/Sub)

```go
// PUBLISHER: Ticker goroutine publishes after each DB write
func (t *Ticker) publishTick(ctx context.Context, tick MarketTick) error {
    payload, err := json.Marshal(tick)
    if err != nil {
        return fmt.Errorf("marshal tick: %w", err)
    }
    return t.redis.Publish(ctx, "market:ticks:"+tick.Symbol, payload).Err()
}

// SUBSCRIBER: WebSocket handler streams to browser
func (h *Handler) StreamMarketData(w http.ResponseWriter, r *http.Request) {
    symbol := chi.URLParam(r, "symbol")

    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        return
    }
    defer conn.Close()

    sub := h.redis.Subscribe(r.Context(), "market:ticks:"+symbol)
    defer sub.Close()

    ch := sub.Channel()
    for {
        select {
        case msg, ok := <-ch:
            if !ok {
                return
            }
            conn.WriteMessage(websocket.TextMessage, []byte(msg.Payload))
        case <-r.Context().Done():
            return
        }
    }
}
```

## Caching Computed Indicators

Cache expensive technical indicator calculations (avoid recomputing on every agent call):

```go
const indicatorCacheTTL = 5 * time.Minute

func (db *DB) GetIndicatorsCached(ctx context.Context, rdb *redis.Client, symbol string) (TechnicalIndicators, error) {
    key := fmt.Sprintf("indicators:%s", symbol)

    // Try cache first
    cached, err := rdb.Get(ctx, key).Bytes()
    if err == nil {
        var indicators TechnicalIndicators
        if json.Unmarshal(cached, &indicators) == nil {
            return indicators, nil
        }
    }

    // Cache miss — compute from DB
    indicators, err := db.ComputeIndicators(ctx, symbol)
    if err != nil {
        return TechnicalIndicators{}, err
    }

    // Cache result
    payload, _ := json.Marshal(indicators)
    rdb.Set(ctx, key, payload, indicatorCacheTTL)

    return indicators, nil
}
```

## Key Naming Conventions

```
market:ticks:{SYMBOL}          → pub/sub channel for live ticks
market:latest:{SYMBOL}         → latest price (STRING, decimal string)
indicators:{SYMBOL}            → cached TechnicalIndicators (JSON, 5min TTL)
session:{USER_ID}              → JWT session data (JSON, 24h TTL)
ratelimit:{IP}:{endpoint}      → rate limiting counter
```

## Storing Latest Price

```go
// Update on every tick — fast O(1) read for dashboard
func (t *Ticker) updateLatestPrice(ctx context.Context, tick MarketTick) {
    t.redis.Set(ctx,
        "market:latest:"+tick.Symbol,
        tick.Close.String(), // store as string to preserve decimal precision
        24*time.Hour,
    )
}

// Read latest price
func getLatestPrice(ctx context.Context, rdb *redis.Client, symbol string) (decimal.Decimal, error) {
    val, err := rdb.Get(ctx, "market:latest:"+symbol).Result()
    if err != nil {
        return decimal.Zero, fmt.Errorf("no cached price for %s: %w", symbol, err)
    }
    return decimal.NewFromString(val)
}
```

## Rate Limiting (API Endpoints)

```go
func (h *Handler) RateLimitMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        key := fmt.Sprintf("ratelimit:%s:%s", r.RemoteAddr, r.URL.Path)

        count, err := h.redis.Incr(r.Context(), key).Result()
        if err == nil && count == 1 {
            h.redis.Expire(r.Context(), key, time.Minute)
        }

        if count > 60 { // 60 req/min per IP
            http.Error(w, "rate limit exceeded", http.StatusTooManyRequests)
            return
        }
        next.ServeHTTP(w, r)
    })
}
```

## Session Caching

```go
type Session struct {
    UserID    string    `json:"user_id"`
    Role      string    `json:"role"`      // "admin" | "viewer"
    ExpiresAt time.Time `json:"expires_at"`
}

func cacheSession(ctx context.Context, rdb *redis.Client, token string, sess Session) error {
    payload, err := json.Marshal(sess)
    if err != nil {
        return err
    }
    return rdb.Set(ctx, "session:"+token, payload, 24*time.Hour).Err()
}

func getSession(ctx context.Context, rdb *redis.Client, token string) (Session, error) {
    data, err := rdb.Get(ctx, "session:"+token).Bytes()
    if err != nil {
        return Session{}, fmt.Errorf("session not found")
    }
    var sess Session
    return sess, json.Unmarshal(data, &sess)
}
```

## Quick Reference

| Operation | Command | TTL |
|-----------|---------|-----|
| Publish tick | `PUBLISH market:ticks:AAPL <json>` | — |
| Cache indicators | `SET indicators:AAPL <json> EX 300` | 5 min |
| Latest price | `SET market:latest:AAPL "150.25" EX 86400` | 24h |
| Session | `SET session:<token> <json> EX 86400` | 24h |
| Rate limit | `INCR ratelimit:<ip>:<path>` + `EXPIRE 60` | 1 min |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Storing `float64` price in Redis | Store `decimal.String()` — parse with `decimal.NewFromString()` |
| No TTL on cached values | Always set TTL — stale indicators worse than cache miss |
| Redis as source of truth | Redis is cache only — PostgreSQL owns all data |
| Blocking on Redis in hot path | Use `context.WithTimeout` for Redis calls |
| Not handling Redis unavailability | Fallback to DB query if Redis returns error |
