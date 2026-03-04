# OmniTrade Hooks Reference

This document provides comprehensive documentation for the hook system in OmniTrade.

## Overview

Hooks enable automation at key points in OmniTrade's execution lifecycle. The system supports extensibility for registering hooks to respond to events, validate data, and execute custom logic based on event type and priority.

 This document covers:

- **Hook Types** (`before.*`, `after.*`, etc.)
- **Hook Interface** and implementation patterns
- **Hook Builder** for building hooks with fluent API

- **Hook Registry** for managing hooks
- **Hook Executor** for executing hooks

## Quick Start

### Your First Hook

```go
package hooks

import (
    "github.com/omnitrade/backend/internal/agent/hooks"
)

// Create a simple hook
func NewBasicHook(name string) *hooks.BaseHook {
    return &hooks.BaseHook{
        config: config
        h.ID = name
        h.Name = name
        h.Description = description
        h.EventTypes = eventTypes
        h.Priority = priority
        h.Timeout = timeout
        h.Enabled = true
    }
}

// Execute runs the hook logic
func (h *MyHook) Execute(ctx context.Context, event *hooks.Event) *hooks.HookResult {
    // Return result
}
```

### Data Ingestion Hook

```go
// Event types
const (
    EventBeforeDataFetch  EventType = "before.data.fetch"
    EventAfterDataFetch   EventType = "after.data.fetch"
    EventOnDataIngest     EventType = "on.data.ingest"
    EventOnMarketUpdate   EventType = "on.market.update"
    EventOnTickerUpdate   EventType = "on.ticker.update"
    EventOnOrderBookSync  EventType = "on.orderbook.sync"
    EventOnHistoricalSync EventType = "on.historical.sync"
)

)
```

### Intelligence Plane Events
const (
    EventBeforeAnalysis     EventType = "before.analysis"
    EventAfterAnalysis      EventType = "after.analysis"
    EventBeforeAgentRun     EventType = "before.agent.run"
    EventAfterAgentRun      EventType = "after.agent.run"
    EventOnSignalGenerated  EventType = "on.signal.generated"
    EventOnPatternDetected  EventType = "on.pattern.detected"
    EventOnRiskCalculated   EventType = "on.risk.calculated"
    EventOnConfidenceScore  EventType = "on.confidence.score"
    EventOnMultiAgentSync   EventType = "on.multiagent.sync"
    EventBeforeGenkitFlow EventType = "before.genkit.flow"
    EventAfterGenkitFlow    EventType = "after.genkit.flow"
)
```

### Action Plane Events (HITL)
const (
    EventBeforeTradeProposal EventType = "before.trade.proposal"
    EventAfterTradeProposal  EventType = "after.trade.proposal"
    EventOnApprovalRequired  EventType = "on.approval.required"
    EventOnApprovalGranted   EventType = "on.approval.granted"
    EventOnApprovalDenied    EventType = "on.approval.denied"
    EventBeforeOrderSubmit   EventType = "before.order.submit"
    EventAfterOrderSubmit    EventType = "after.order.submit"
    EventOnOrderFilled       EventType = "on.order.filled"
    EventOnOrderCancelled  EventType = "on.order.cancelled"
)

```

### System Events
const (
    EventOnPluginLoad    EventType = "on.plugin.load"
    EventOnPluginUnload  EventType = "on.plugin.unload"
    EventOnPluginError   EventType = "on.plugin.error"
    EventOnConfigChange   EventType = "on.config.change"
    EventOnHealthCheck   EventType = "on.health.check"
    EventOnAuditLog      EventType = "on.audit.log"
    EventOnMetricEmit    EventType = "on.metric.emit"
    EventOnAlert         EventType = "on.alert"
    EventOnShutdownStart EventType = "on.shutdown.start"
)
```

### Hook Priority
const (
    PriorityLowest    Priority = 0
    PriorityLow        Priority = 25
    PriorityNormal     Priority = 50
    PriorityHigh        Priority = 75
    PriorityHighest    Priority = 100
    PriorityMonitors   Priority = -1   // Run first for observability
    PriorityCritical  Priority = 200 // Critical hooks must run absolutely first
)

```

### Implementing Hooks

#### Using HookBuilder

```go
// Create a hook using the builder
func NewHookBuilder() *HookBuilder {
    return &HookBuilder{
        config: HookConfig{
            ID:          "my_hook",
            Name:        "My Hook",
            Description: "Example hook using builder",
            EventTypes: []hooks.EventType{hooks.EventBeforeDataFetch, hooks.EventAfterDataFetch},
            Priority:    hooks.PriorityHigh,
        },
    }
}

// Implement the interface
type Hook interface {
    // ID returns a unique identifier for this hook
    ID() string {
        return h.config.ID
    }

    // Name returns a human-readable name for the hook
    Name() string {
        return h.config.Name
    }

    // Description returns a description of what the hook does
    Description() string {
        return h.config.Description
    }

    // EventTypes returns the event types this hook subscri to
    EventTypes() []hooks.EventType {
        return []hooks.EventType{
            hooks.EventBeforeDataFetch,
            hooks.EventAfterDataFetch,
        }
    }
}

// Execute runs the hook logic
func (h *MyHook) Execute(ctx context.Context, event *hooks.Event) *hooks.HookResult {
    // Modify event if needed
    if result.ModifiedEvent != nil {
                currentEvent = result.ModifiedEvent
            }
        }
    }

    // Return result
    return result
}
```

### Complete Example

```go
package main

import (
    "context"
    "encoding/json"
    "fmt"
    "time"

    "github.com/omnitrade/backend/internal/agent/hooks"
)

// DataIngestionHook hooks data ingestion
type DataIngestionHook struct {
    hooks.BaseHook
}

func NewDataIngestionHook() *DataIngestionHook {
    return &hooks.BaseHook{
        config: hooks.HookConfig{
            ID:          "data_ingestion",
            Name:        "Data Ingestion Hook",
            Description: "Hooks data ingestion from external sources",
            EventTypes: []hooks.EventType{
                hooks.EventBeforeDataFetch,
                hooks.EventAfterDataFetch,
                hooks.EventOnDataIngest,
                hooks.EventOnMarketUpdate,
            },
            Priority: hooks.PriorityHigh,
        },
    }
}

// Execute processes incoming market data
func (h *DataIngestionHook) Execute(ctx context.Context, event *hooks.Event) *hooks.HookResult {
    // Parse event
    marketData, ok := event.Payload.(*hooks.M MarketDataPayload); !ok {
        return nil, fmt.Errorf("invalid payload type")
    }

    // Extract market data
    symbol := marketData.Symbol
    source := marketData.Source

    price := marketData.Price
    volume := marketData.Volume
    timestamp := marketData.Timestamp

    // Validate price
    if _, err := json.Unmarshal([]byte(price), &price); err != nil {
        return nil, fmt.Errorf("invalid price format: %w", err)
    }

    // Store in database
    if err := h.storeData(ctx, marketData); err != nil {
        return nil, fmt.Errorf("failed to store data: %w", err)
    }

    // Build result
    result := &hooks.HookResult{
        Proceed:  true,
        Data: map[string]interface{}{
            "symbol":    symbol,
            "price":    price,
            "volume": volume,
            "source":  source,
            "timestamp": timestamp.Format(time.RFC3339),
        },
    }

    return result
}

```

## Registering Hooks

```go
// In main function
func RegisterDataIngestionHooks() {
    hooksRegistry := GetGlobalRegistry()

    hook := NewDataIngestionHook()
    if err := hooksRegistry.Register(hook); err != nil {
        log.Printf("Failed to register data ingestion hook: %v", err)
    }
}

func init() {
    // This init ensures the package is importeded
}
}
```

Now let me create more example hooks. Let me continue with the example hooks for more advanced use cases.### Example 2: Sentiment Analysis Hook

```go
package hooks

import (
    "context"
    "fmt"

    "github.com/omnitrade/backend/internal/agent/hooks"
)

// SentimentAnalysisHook hooks sentiment analysis
type SentimentAnalysisHook struct {
    hooks.BaseHook
    apiKey string
}

func NewSentimentAnalysisHook(apiKey string) *SentimentAnalysisHook {
    return &hooks.BaseHook{
        config: hooks.HookConfig{
            ID:          "sentiment_analysis",
            Name:        "Sentiment Analysis Hook",
            Description: "Hooks sentiment analysis from news and social media",
            EventTypes: []hooks.EventType{
                hooks.EventBeforeAnalysis,
                hooks.EventAfterAnalysis,
                hooks.EventOnSignalGenerated,
            },
            Priority: hooks.PriorityNormal,
        },
    }
}

// Execute performs sentiment analysis
func (h *SentimentAnalysisHook) Execute(ctx context.Context, event *hooks.Event) *hooks.HookResult {
    // Get symbol
    symbol, _ := event.Payload.(*hooks.BasePayload); !ok {
        return nil, fmt.Errorf("symbol is required")
    }
    // Call sentiment API
    sentiment, err := h.callSentimentAPI(ctx, symbol)
    if err != nil {
        return nil, fmt.Errorf("sentiment API error: %w", err)
    }

    // Build result
    return &hooks.HookResult{
        Proceed: true,
        Data: map[string]interface{}{
            "symbol":    symbol,
            "sentiment": sentiment.Score,
            "confidence": sentiment.Confidence,
            "timestamp": time.Now().UTC().Format(time.RFC3339),
        },
    }
    return result
}
```

### Example 3: Trade Proposal Validation Hook

```go
package hooks

import (
    "context"
    "fmt"
    "regexp"
    "time"

    "github.com/omnitrade/backend/internal/agent/hooks"
)

// TradeProposalValidationHook validates trade proposals
type TradeProposalValidationHook struct {
    hooks.BaseHook
    minConfidence float64
    maxRisk   RiskLevel
}

func NewTradeProposalValidationHook(minConfidence float64, maxRisk RiskLevel) *TradeProposalValidationHook {
    return &hooks.BaseHook{
        config: hooks.HookConfig{
            ID:          "trade_proposal_validation",
            Name:        "Trade Proposal Validation Hook",
            Description: "Validates trade proposals before submission",
            EventTypes: []hooks.EventType{
                hooks.EventBeforeTradeProposal,
            },
            Priority: hooks.PriorityHigh,
        },
    }
}

// Initialize sets configuration
func (h *TradeProposalValidationHook) Initialize(ctx *PluginContext, config PluginConfig) error {
    // Parse minimum confidence
    if minConf, ok := config.Settings["min_confidence"].(float64); ok {
        h.minConfidence = minConf
    }

    // Parse max risk
    if maxRisk, ok := config.Settings["max_risk"].(string); ok {
        h.maxRisk = RiskLevel(maxRisk)
    }

}

// Execute validates the proposal
func (h *TradeProposalValidationHook) Execute(ctx context.Context, event *hooks.Event) *hooks.HookResult {
    // Get trade proposal
    proposal, ok := event.Payload.(*hooks.TradeProposalPayload)
    if !ok {
        return nil, fmt.Errorf("expected TradeProposalPayload")
    }

    // Validate confidence
    if proposal.Confidence < h.minConfidence {
        return &hooks.HookResult{
            Proceed: false,
            Data: map[string]interface{}{
                "error": fmt.Sprintf("confidence %.2f below minimum %.2f", proposal.Confidence),
            },
        }
    }
    // Validate risk score
    if proposal.RiskScore > float64(h.maxRisk) {
        return &hooks.HookResult{
            Proceed: false,
            Data: map[string]interface{}{
                "error": fmt.Sprintf("risk score %.2f exceeds maximum %.2f", h.maxRisk),
            },
        }
    }
    // Validate symbol format
    matched, _ := regexp.MatchString(`^[A-Z]{1,5}$`, proposal.Symbol)
    if !matched {
        return &hooks.HookResult{
            Proceed: false,
            Data: map[string]interface{}{
                "error": fmt.Sprintf("invalid symbol format: %s", proposal.Symbol),
            },
        }
    }
    // Validate side
    if proposal.Side != "buy" && proposal.Side != "sell" {
        return &hooks.HookResult{
            Proceed: false,
            Data: map[string]interface{}{
                "error": fmt.Sprintf("side must be 'buy` or `sell`, proposal.Side),
            },
        }
    }
    // Validate quantity (should be positive decimal)
    if _, ok := proposal.Quantity.(string); ok {
        if _, err := strconv.ParseInt(quantityStr, 10); err != nil || quantity < 0 {
            return &hooks.HookResult{
                Proceed: false,
                Data: map[string]interface{}{
                    "error": fmt.Sprintf("invalid quantity: %s", quantityStr),
            },
        }
    }
    // Validate price (should be decimal)
    if _, ok := proposal.Price.(string); ok {
        if _, err := strconv.ParseFloat(priceStr); err != nil || price <= 0 {
            return &hooks.HookResult{
                Proceed: false,
                Data: map[string]interface{}{
                    "error": fmt.Sprintf("invalid price format: %s", priceStr),
            },
        }
    }
    // All validations passed
    return hooks.NewHookResult()
}
```

## Hook Middleware

OmniTrade provides a middleware system for hooks. allowing you to add cross-cutting functionality to hooks.

### Logging Middleware

```go
// LoggingMiddleware creates a logging middleware
func LoggingMiddleware(logger *zap.Logger) HookMiddleware {
    return func(next HookExecutor) HookExecutor {
        return func(ctx context.Context, event *Event) *HookResult {
            start := time.Now()

            logger.Info("hook execution started",
                zap.String("hook_id", ""),
                zap.String("event_type", string(event.Type)),
                zap.Time("start", time.Now()),
            )

            result := next(ctx, event)

            logger.Info("hook execution completed",
                zap.Duration("duration", time.Since(start)),
                zap.Bool("success", result.Success),
            )

            return result
        }
    }
}
```

### Metrics Middleware

```go
// MetricsMiddleware creates a metrics middleware
func MetricsMiddleware(collector MetricsCollector) HookMiddleware {
    return func(next HookExecutor) HookExecutor {
        return func(ctx context.Context, event *Event) *HookResult {
            start := time.Now()

            result := next(ctx, event)

            duration := time.Since(start)
            collector.RecordHookExecution(
                string(event.Type),
                duration,
                result.Error != nil,
            )

            return result
        }
    }
}
```

### Rate Limiting Middleware

```go
// RateLimitMiddleware creates a rate limiting middleware
func RateLimitMiddleware(limiter RateLimiter, logger *zap.Logger) HookMiddleware {
    return func(next HookExecutor) HookExecutor {
    return func(ctx context.Context, event *Event) *HookResult {
        if !limiter.Allow(event.Type) {
            logger.Warn("hook rate limited",
                zap.String("event_type", string(event.Type)),
            )

            return &HookResult{
                Proceed: true,
                Error: fmt.Errorf("rate limit exceeded for event type %s", event.Type),
                Metadata: map[string]interface{}{
                    "rate_limited": true,
                },
            }
        }

        return next(ctx, event)
    }
}
```

### Circuit Breaker Middleware

```go
// CircuitBreakerMiddleware creates a circuit breaker middleware
func CircuitBreakerMiddleware(breaker CircuitBreaker, logger *zap.Logger) HookMiddleware {
    return func(next HookExecutor) HookExecutor {
    return func(ctx context.Context, event *Event) *HookResult {
        if !breaker.Allow(event.Type) {
            logger.Warn("circuit breaker open",
                zap.String("event_type", string(event.Type)),
            )

            return &HookResult{
                Proceed: true,
                Error: fmt.Errorf("circuit breaker open for event type %s", event.Type),
                Metadata: map[string]interface{}{
                    "circuit_breaker_open": true,
                },
            }
        }

        // Execute with circuit breaker protection
        result := next(ctx, event)

        // Record result
        if result.Error != nil {
            breaker.RecordFailure(event.Type)
        } else {
            breaker.RecordSuccess(event.Type)
        }

        return result
    }
}
```

### Validation Middleware

```go
// ValidationMiddleware creates a validation middleware
func ValidationMiddleware(logger *zap.Logger) HookMiddleware {
    return func(next HookExecutor) HookExecutor {
        return func(ctx context.Context, event *Event) *HookResult {
        if event == nil {
            return &HookResult{
                Proceed: false,
                Error: fmt.Errorf("event cannot be nil"),
            }
        }

        if event.Type == "" {
            return &HookResult{
                Proceed: false,
                Error: fmt.Errorf("event type cannot be empty"),
            }
        }

        if event.Payload == nil {
            return &HookResult{
                Proceed: false,
                Error: fmt.Errorf("event payload cannot be nil"),
            }
        }

        if err := event.Payload.Validate(); err != nil {
            return &HookResult{
                Proceed: false,
                Error: fmt.Errorf("payload validation failed: %w", err),
            }
        }

        }

        return next(ctx, event)
    }
}
```

## Testing Hooks

```go
package hooks

import (
    "context"
    "testing"
    "time"

    "github.com/omnitrade/backend/internal/agent/hooks"
)

func TestMyHook(t *testing.T) {
    // Create hook
    hook := NewHookBuilder().
        WithID("test_hook").
        WithName("Test Hook").
        WithDescription("A test hook for unit tests").
        WithEvents(hooks.EventBeforeDataFetch, hooks.EventAfterDataFetch).
        WithPriority(hooks.PriorityNormal).
        WithHandler(func(ctx context.Context, event *hooks.Event) *hooks.HookResult {
            // Test handler logic
            return hooks.NewHookResult()
        } }).
        MustBuild()

    // Create registry
    registry := hooks.NewRegistry(hooks.RegistryConfig{
        Logger: zap.NewNop(),
    })

    // Register hook
    err := registry.Register(hook)
    if err != nil {
        t.Fatalf("Failed to register hook: %v", err)
    }

    // Test execution
    event := hooks.NewEvent(
        hooks.EventBeforeDataFetch,
        "test_source",
        &hooks.BasePayload{},
    )
    ctx := context.Background()
    result := hook.Execute(ctx, event)

    if !result.Proceed {
        t.Error("Expected hook to proceed")
    }
}

func TestHookChain(t *testing.T) {
    // Create hooks
    hook1 := NewHookBuilder().
        WithID("first_hook").
        WithName("First Hook").
        WithDescription("First hook in chain").
        WithEvents(hooks.EventBeforeAnalysis).
        WithPriority(hooks.PriorityHigh).
        WithHandler(func(ctx context.Context, event *hooks.Event) *hooks.HookResult {
            return hooks.NewHookResult()
        })

    hook2 := NewHookBuilder().
        WithID("second_hook").
        WithName("Second Hook").
        WithDescription("Second hook in chain").
        WithEvents(hooks.EventBeforeAnalysis).
        WithPriority(hooks.PriorityNormal).
        WithHandler(func(ctx context.Context, event *hooks.Event) *hooks.HookResult {
            return hooks.NewHookResult()
        })

    // Create registry
    registry := hooks.NewRegistry(hooks.RegistryConfig{
        Logger: zap.NewNop(),
    })

    // Register hooks
    _ = registry.Register(hook1)
    registry.Register(hook2)

    // Test chain execution
    event := hooks.NewEvent(
        hooks.EventBeforeAnalysis,
        "test_source",
        &hooks.BasePayload{},
    )

    // Get hooks for this event
    hooksForEvent := registry.GetByEventType(hooks.EventBeforeAnalysis)

    if len(hooksForEvent) != 2 {
        t.Errorf("Expected 2 hooks for BeforeAnalysis event")
    }
}
```

## Related Documentation

- [Architecture Overview](./architecture.md)
- [Plugin Development Guide](./plugin-development-guide.md)
- [Tool Reference](./tool-reference.md)
