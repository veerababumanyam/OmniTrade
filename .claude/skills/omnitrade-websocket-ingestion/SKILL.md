---
name: omnitrade-websocket-ingestion
description: Use when implementing OmniTrade's market data ingestion — WebSocket connections to Polygon.io or Alpaca, tick processing, OHLCV storage, or real-time data pipelines in Go.
---

# OmniTrade WebSocket Market Data Ingestion

## Overview

OmniTrade's Data Plane ingests real-time OHLCV ticks from Polygon.io and Alpaca via WebSocket. Data is written to `market_data` with a write-role DB connection — this is the ONLY component that writes market data. AI agents only read.

## Architecture

```
WebSocket (Polygon / Alpaca)
       ↓
  Ticker (Go goroutine)
       ↓
  Validate + Normalize tick
       ↓
  Write to market_data (write-role)
       ↓
  Publish to Redis pub/sub (real-time feed)
```

## Ticker Structure

```go
// internal/ingestion/ticker.go
type Ticker struct {
    db     *database.DB
    redis  *redis.Client
    symbols []string
    done   chan struct{}
}

func NewTicker(db *database.DB, redis *redis.Client, symbols []string) *Ticker {
    return &Ticker{db: db, redis: redis, symbols: symbols, done: make(chan struct{})}
}

func (t *Ticker) Start(ctx context.Context) error {
    conn, _, err := websocket.DefaultDialer.DialContext(ctx, polygonWSURL, nil)
    if err != nil {
        return fmt.Errorf("dial polygon: %w", err)
    }
    defer conn.Close()

    if err := t.authenticate(conn); err != nil {
        return fmt.Errorf("authenticate: %w", err)
    }
    if err := t.subscribe(conn, t.symbols); err != nil {
        return fmt.Errorf("subscribe: %w", err)
    }

    return t.readLoop(ctx, conn)
}
```

## Read Loop with Reconnect

```go
func (t *Ticker) readLoop(ctx context.Context, conn *websocket.Conn) error {
    for {
        select {
        case <-ctx.Done():
            return nil
        default:
        }

        _, msg, err := conn.ReadMessage()
        if err != nil {
            log.Printf("websocket read error: %v — reconnecting", err)
            return t.reconnect(ctx) // exponential backoff reconnect
        }

        var ticks []PolygonTick
        if err := json.Unmarshal(msg, &ticks); err != nil {
            log.Printf("unmarshal tick: %v", err)
            continue // skip bad message, don't crash
        }

        for _, tick := range ticks {
            if err := t.processTick(ctx, tick); err != nil {
                log.Printf("process tick %s: %v", tick.Symbol, err)
            }
        }
    }
}
```

## Tick Processing

```go
type MarketTick struct {
    Symbol    string          `db:"symbol"`
    Open      decimal.Decimal `db:"open"`   // NEVER float64
    High      decimal.Decimal `db:"high"`
    Low       decimal.Decimal `db:"low"`
    Close     decimal.Decimal `db:"close"`
    Volume    int64           `db:"volume"`
    Timestamp time.Time       `db:"timestamp"` // UTC from exchange
}

func (t *Ticker) processTick(ctx context.Context, raw PolygonTick) error {
    tick := normalizeTick(raw) // validate + convert to decimal

    // Write to DB (write-role connection)
    if err := t.db.InsertTick(ctx, tick); err != nil {
        return fmt.Errorf("insert tick: %w", err)
    }

    // Publish to Redis for real-time UI updates
    payload, _ := json.Marshal(tick)
    t.redis.Publish(ctx, "market:"+tick.Symbol, payload)
    return nil
}
```

## DB Insert

```go
func (db *DB) InsertTick(ctx context.Context, tick MarketTick) error {
    _, err := db.sqlx.NamedExecContext(ctx, `
        INSERT INTO market_data (symbol, open, high, low, close, volume, timestamp)
        VALUES (:symbol, :open, :high, :low, :close, :volume, :timestamp)
    `, tick)
    return err
}
```

## Polygon.io WebSocket Protocol

```go
const polygonWSURL = "wss://socket.polygon.io/stocks"

// 1. Auth message
type PolygonAuth struct {
    Action string `json:"action"`
    Params string `json:"params"` // API key
}

// 2. Subscribe message
type PolygonSubscribe struct {
    Action string `json:"action"` // "subscribe"
    Params string `json:"params"` // "AM.AAPL,AM.TSLA" (AM = aggregate minute)
}

// 3. Incoming tick
type PolygonTick struct {
    EventType string  `json:"ev"`  // "AM"
    Symbol    string  `json:"sym"`
    Open      float64 `json:"o"`   // convert to decimal on receipt
    High      float64 `json:"h"`
    Low       float64 `json:"l"`
    Close     float64 `json:"c"`
    Volume    int64   `json:"v"`
    StartTime int64   `json:"s"`   // Unix ms → time.Time UTC
}

// Convert float64 from wire format to decimal immediately
func normalizeTick(raw PolygonTick) MarketTick {
    return MarketTick{
        Symbol:    raw.Symbol,
        Open:      decimal.NewFromFloat(raw.Open),
        High:      decimal.NewFromFloat(raw.High),
        Low:       decimal.NewFromFloat(raw.Low),
        Close:     decimal.NewFromFloat(raw.Close),
        Volume:    raw.Volume,
        Timestamp: time.UnixMilli(raw.StartTime).UTC(),
    }
}
```

## Reconnect with Backoff

```go
func (t *Ticker) reconnect(ctx context.Context) error {
    backoff := 1 * time.Second
    for attempt := 1; attempt <= 10; attempt++ {
        select {
        case <-ctx.Done():
            return ctx.Err()
        case <-time.After(backoff):
        }
        if err := t.Start(ctx); err == nil {
            return nil
        }
        backoff = min(backoff*2, 60*time.Second) // cap at 60s
    }
    return fmt.Errorf("reconnect failed after 10 attempts")
}
```

## Data Providers

| Provider | WebSocket URL | Format | Use Case |
|----------|--------------|--------|----------|
| Polygon.io | `wss://socket.polygon.io/stocks` | AM aggregate | US equities |
| Alpaca | `wss://stream.data.alpaca.markets/v2/iex` | bar | US equities alt |
| Binance | `wss://stream.binance.com/ws` | kline | Crypto |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using `float64` from wire format | Convert to `decimal.Decimal` immediately in `normalizeTick` |
| No reconnect logic | Always implement exponential backoff |
| Crash on bad message | Log and `continue` in read loop |
| Writing from AI agent | Only Ticker (Data Plane) writes market_data |
| Not publishing to Redis | Frontend won't get real-time updates |
| Storing exchange timestamp as local | Always `.UTC()` on all timestamps |
