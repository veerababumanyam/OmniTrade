# OmniTrade Plugin Architecture

## Executive Summary

OmniTrade implements a sophisticated plugin architecture for AI-powered trading agents. This document provides a comprehensive technical reference for the plugin system, tools registry, hooks system, and Google ADK integration.

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        OMNITRADE AGENT SYSTEM                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ┌─────────────┐
│  │ Plugin Manager │◄──►│ Tools Registry │◄──►│ Hooks Registry │◄──►│ ADK Wrapper  │
│  └───────┬───────┘   └───────┬───────┘   └───────┬───────┘   └─────────────┘
│         │                     │                     │                     │         │
│         ▼                     ▼                     ▼                     ▼         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐
│  │                    DEPENDENCY INJECTION LAYER                           │
│  └─────────────────────────────────────────────────────────────────────────────┘
│                                    │
│  ▼                                   ▼
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ┌─────────────┐
│  │  Data Plane    │   │ Intelligence  │   │  Action Plane  │   │  Database   │
│  │  (Read-Only)    │   │    Plane       │   │    (HITL)       │   │  (PostgreSQL)  │
│  └───────────────┘   └───────────────┘   └───────────────┘   └─────────────┘
```

### Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PLUGIN EXECUTION FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
                           ┌───────────────────┐
                           │   User Request    │
                           └─────────┬─────────┘
                                     │
                                     ▼
                           ┌───────────────────┐
                           │  Plugin Manager    │
                           │  Load/Initialize │
                           └─────────┬─────────┘
                                     │
              ┌────────────────────┴────────────────────┐
              │                                        │
              ▼                                        ▼
   ┌───────────────────┐                           ┌───────────────────┐
   │  Before Hooks     │                           │  Tool Selection  │
   │  (Validation,     │                           │  (Registry Lookup)│
   │   Rate Limiting)   │                           └─────────┬─────────┘
   └─────────┬─────────┘                                     │
              │                                        │
              ▼                                        ▼
   ┌───────────────────┐                           ┌───────────────────┐
   │  Tool Execution    │◄──────────────────────────►│  After Hooks    │
   │  (Business Logic)   │                           │  (Logging, Audit) │
   └─────────┬─────────┘                           └─────────┬─────────┘
              │                                        │
              ▼                                        ▼
   ┌───────────────────┐                           ┌───────────────────┐
   │  Error Hooks        │                           │  Result Response │
   │  (Recovery, Retry)  │                           │                   │
   └───────────────────┘                           └───────────────────┘
```

## Core Components

### 1. Plugin System (`backend/internal/agent/plugins/`)

The File | Purpose | Description |
|------|---------|-------------|
| `plugin.go` | Core Types | Plugin interface, state machine, priority system |
| `registry.go` | Registration | Plugin registration, dependency resolution, health tracking |
| `manager.go` | Lifecycle | Initialization, startup, shutdown, circuit breaker integration |
| `loader.go` | Discovery | Plugin discovery, loading, hot reload support |
| `circuit.go` | Resilience | Circuit breaker pattern for fault tolerance |

#### Plugin Interface
```go
type Plugin interface {
    Metadata() PluginMetadata
    Initialize(ctx *PluginContext, config PluginConfig) error
    Start(ctx *PluginContext) error
    Stop(ctx *PluginContext) error
    Shutdown(ctx *PluginContext) error
    State() PluginState
    Health(ctx *PluginContext) (*PluginResult, error)
    Execute(ctx *PluginContext, input interface{}) (*PluginResult, error)
}
```

#### Plugin States
```go
const (
    StateUnloaded    PluginState = "unloaded"
    StateLoaded      PluginState = "loaded"
    StateInitializing PluginState = "initializing"
    StateActive      PluginState = "active"
    StateDegraded    PluginState = "degraded"
    StateStopping    PluginState = "stopping"
    StateError       PluginState = "error"
)
```

#### Plugin Priority System
```go
const (
    PriorityCritical  PluginPriority = 100  // Security, auth
    PriorityHigh      PluginPriority = 75   // Before normal
    PriorityNormal    PluginPriority = 50   // Default
    PriorityLow       PluginPriority = 25   // After normal
    PriorityBackground PluginPriority = 10   // Logging, metrics
)
```

#### Plugin Capabilities
```go
const (
    CapabilityDataIngestion    PluginCapability = "data_ingestion"
    CapabilityAnalysis           PluginCapability = "analysis"
    CapabilitySignalGeneration PluginCapability = "signal_generation"
    CapabilityRiskAssessment    PluginCapability = "risk_assessment"
    CapabilityExecution          PluginCapability = "execution"
    CapabilityNotification       PluginCapability = "notification"
)
```

### 2. Tools Registry (`backend/internal/agent/tools/`)

| File | Purpose | Description |
|------|---------|-------------|
| `definition.go` | Tool Types | Tool definition, parameters, results, execution modes |
| `registry.go` | Registration | Tool registration, lookup, search, categorization |
| `executor.go` | Execution | Genkit integration, batch execution, streaming |
| `permissions.go` | Security | Permission levels, role-based access, audit logging |

#### Tool Definition Structure
```go
type ToolDefinition struct {
    ID              string
    Name            string
    Version         string
    Description     string
    Category        Category
    Parameters      []ParameterDefinition
    Result          ResultDefinition
    ExecutionMode    ExecutionMode
    PermissionLevel PermissionLevel
    RiskLevel       RiskLevel
    Tags            []string
    RateLimitRequests int
    RateLimitWindow   time.Duration
    Timeout         time.Duration
    Dependencies     []string
}
```

#### Tool Categories
```go
const (
    CategoryMarketData   Category = "market_data"    // Real-time and historical market data
    CategoryFundamental  Category = "fundamental"    // Company fundamentals and financials
    CategorySentiment    Category = "sentiment"      // News sentiment and social analysis
    CategoryTechnical    Category = "technical"      // Technical analysis indicators
    CategoryRisk         Category = "risk"           // Risk assessment and management
    CategoryPortfolio    Category = "portfolio"      // Portfolio management operations
    CategoryNotification Category = "notification"   // Alert and notification tools
    CategoryAnalysis     Category = "analysis"       // General analysis tools
)
```

#### Permission Levels
```go
const (
    PermissionRead      PermissionLevel = "read"       // Read-only data access
    PermissionAnalyze   PermissionLevel = "analyze"    // Analysis and computation
    PermissionTrade     PermissionLevel = "trade"      // Trade proposal generation
    PermissionAdmin     PermissionLevel = "admin"      // Administrative operations
)
```

### 3. Hooks System (`backend/internal/agent/hooks/`)

| File | Purpose | Description |
|------|---------|-------------|
| `events.go` | Event Types | Event types, categories, payload definitions |
| `hook.go` | Hook Interface | Hook interface, base implementation, builders |
| `registry.go` | Registration | Hook registration, event routing, wildcard matching |
| `execution.go` | Execution | Hook executor, batch execution, pipelines |
| `middleware.go` | Middleware | Logging, metrics, rate limiting, circuit breaking |

#### Event Types
```go
const (
    // Data Plane Events (Read-Only)
    EventBeforeDataFetch  EventType = "before.data.fetch"
    EventAfterDataFetch   EventType = "after.data.fetch"
    EventOnDataIngest     EventType = "on.data.ingest"
    EventOnMarketUpdate   EventType = "on.market.update"

    // Intelligence Plane Events
    EventBeforeAnalysis     EventType = "before.analysis"
    EventAfterAnalysis      EventType = "after.analysis"
    EventBeforeAgentRun     EventType = "before.agent.run"
    EventAfterAgentRun      EventType = "after.agent.run"
    EventOnSignalGenerated  EventType = "on.signal.generated"
    EventOnPatternDetected  EventType = "on.pattern.detected"
    EventOnRiskCalculated   EventType = "on.risk.calculated"

    // Action Plane Events (HITL)
    EventBeforeTradeProposal EventType = "before.trade.proposal"
    EventAfterTradeProposal  EventType = "after.trade.proposal"
    EventOnApprovalRequired  EventType = "on.approval.required"
    EventOnApprovalGranted   EventType = "on.approval.granted"
    EventOnApprovalDenied    EventType = "on.approval.denied"
    EventBeforeOrderSubmit   EventType = "before.order.submit"
    EventAfterOrderSubmit    EventType = "after.order.submit"

    // System Events
    EventOnPluginLoad    EventType = "on.plugin.load"
    EventOnPluginUnload  EventType = "on.plugin.unload"
    EventOnPluginError   EventType = "on.plugin.error"
    EventOnConfigChange   EventType = "on.config.change"
    EventOnHealthCheck     EventType = "on.health.check"
    EventOnAuditLog        EventType = "on.audit.log"
    EventOnAlert           EventType = "on.alert"
)
```

#### Hook Priority System
```go
const (
    PriorityLowest    Priority = 0
    PriorityLow        Priority = 25
    PriorityNormal     Priority = 50
    PriorityHigh        Priority = 75
    PriorityHighest    Priority = 100
    PriorityMonitors    Priority = -1   // Run first for observability
    PriorityCritical    Priority = 200 // Must run absolutely first
)
```

### 4. ADK Integration (`backend/internal/agent/adk/`)

| File | Purpose | Description |
|------|---------|-------------|
| `config.go` | Configuration | Agent types, model configuration, system prompts |
| `wrapper.go` | Tool Wrapping | Function tool wrapper, Go function wrapping, schema generation |
| `hooks.go` | Hook Integration | ADK hook integration, event translation |
| `agent.go` | Agent Implementation | Base agent, agent pool, agent factory |
| `flow.go` | Flow Definition | Genkit flow definitions, multi-step workflows |

#### Agent Types
```go
const (
    AgentTypeFundamentalAnalyst AgentType = "fundamental_analyst"
    AgentTypeTechnicalAnalyst   AgentType = "technical_analyst"
    AgentTypeSentimentAnalyst   AgentType = "sentiment_analyst"
    AgentTypeRiskManager        AgentType = "risk_manager"
    AgentTypePortfolioManager   AgentType = "portfolio_manager"
    AgentTypeOrchestrator       AgentType = "orchestrator"
)
```

## Data Flow

### Request Processing Flow
```
┌──────────────┐
│ HTTP Request │
└──────┬───────┘
        │
        ▼
┌──────────────────────────────────────────────────────────┐
│                    Router Layer                              │
│  - Route matching                                    │
│  - Middleware injection                                 │
│  - Context propagation                                  │
└──────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────┐
│                  Plugin Manager                            │
│  - Resolve plugins by capability                        │
│  - Initialize plugins in dependency order                 │
│  - Start plugins based on priority                       │
└──────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────┐
│                  Hook Executor                            │
│  - Execute before hooks (validation, rate limiting)        │
│  - Check permissions                                     │
│  - Execute tool                                            │
│  - Execute after hooks (logging, audit)                     │
└──────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────┐
│                  Tool Executor                            │
│  - Lookup tool in registry                               │
│  - Validate input against schema                           │
│  - Check permissions                                      │
│  - Execute with timeout                                    │
│  - Apply rate limiting                                    │
└──────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────┐
│                  Response Builder                         │
│  - Collect execution metadata                           │
│  - Build response object                                  │
│  - Apply transformations                                    │
│  - Return to client                                          │
└──────────────────────────────────────────────────────────┘
```

### Plugin Loading Sequence
```
┌──────────────────────────────────────────────────────────────┐
│                    PLUGIN LIFECYCLE                          │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │  Discovery Phase  │
                 │  - Scan plugin paths  │
                 │  - Validate manifests │
                 │  - Build dependency graph  │
                 └─────────┬──────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │  Registration Phase │
                 │  - Register factories  │
                 │  - Index capabilities │
                 │  - Resolve dependencies│
                 └─────────┬──────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ Initialization Phase │
                 │  - Create instances  │
                 │  - Apply configuration│
                 │  - Initialize plugins  │
                 └─────────┬──────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │   Activation Phase   │
                 │  - Health check       │
                 │  - Start plugins      │
                 │  - Enable execution  │
                 └─────────┬──────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │  Runtime Phase      │
                 │  - Execute requests   │
                 │  - Handle errors       │
                 │  - Update metrics     │
                 └─────────┬──────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │  Shutdown Phase     │
                 │  - Stop plugins        │
                 │  - Cleanup resources │
                 │  - Finalize state     │
                 └─────────┬──────────┘
```

## Error Handling and Circuit Breaker

### Circuit Breaker Pattern

The OmniTrade system implements the circuit breaker pattern to handle failures gracefully:

```
┌───────────────────────────────────────────────────────────────────────────┐
│                        CIRCUIT BREAKER STATES                         │
└───────────────────────────────────────────────────────────────────────────┘
                                │
            ┌────────────────────┴─────────────────────┐
            │                    │                     │
            ▼                    ▼                     ▼
   ┌───────────────┐    ┌───────────────┐    ┌───────────────┐
   │  CLOSED State  │◄──►│  HALF-OPEN   │◄──►│  OPEN State    │
   │  Normal        │    │  Testing      │    │  Blocked        │
   │  Operation      │    │  Recovery     │    │  Fallback       │
   └───────────────┘    └───────────────┘    └───────────────┘
```

### Circuit Breaker Configuration
```go
type CircuitBreakerConfig struct {
    Enabled          bool          // Enable circuit breaker
    FailureThreshold int           // Failures before opening (default: 5)
    SuccessThreshold int           // Successes before closing (default: 2)
    Timeout          time.Duration // Recovery timeout (default: 30s)
}
```

### Error Types and Handling

| Error Code | Type | Retryable | Handling |
|------------|------|------------|----------|
| `TIMEOUT` | Transient | Yes | Retry with exponential backoff |
| `CANCELED` | Context | No | Return immediately, log |
| `INVALID_INPUT` | Validation | No | Return 400, log details |
| `INTERNAL_ERROR` | System | Yes | Retry, circuit breaker |
| `DEPENDENCY_ERROR` | Dependency | Yes | Retry, check deps |
| `CIRCUIT_OPEN` | Circuit | No | Return 503, fallback |
| `RATE_LIMITED` | Throttling | Yes | Retry with delay |
| `UNAUTHORIZED` | Security | No | Return 401, log |
| `NOT_AVAILABLE` | Availability | Yes | Retry with backoff |

### Retry Strategy

```go
type RetryConfig struct {
    MaxAttempts     int           // Maximum retry attempts (default: 3)
    InitialDelay    time.Duration // Initial backoff delay (default: 100ms)
    MaxDelay        time.Duration // Maximum backoff delay (default: 5s)
    Multiplier       float64       // Backoff multiplier (default: 2.0)
    RetryableErrors []string      // Error codes that trigger retry
}
```

## Security Model

### Permission Hierarchy

```
┌───────────────────────────────────────────────────────────────┐
│                    PERMISSION LEVELS                          │
└───────────────────────────────────────────────────────────────┘
     │                 │                  │
     ▼                 ▼                  ▼
┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐
│   READ     │   │  ANALYZE   │   │   TRADE    │   │   ADMIN    │
│  Data access│   │ Computation │   │ Proposals│   │ Full access│
└────────────┘   └────────────┘   └────────────┘   └────────────┘
     │                  │                  │
     ▼                  ▼                  ▼
┌────────────┐   ┌────────────┐   ┌────────────┐
│   Viewer   │   │   Analyst  │   │   Trader   │
│  Read + Analyze│   │ All above  │   │ All above  │
└────────────┘   └────────────┘   └────────────┘
```

### Risk Levels

| Level | Description | Human Approval Required |
|-------|-------------|-------------------------|
| `low` | Minimal impact, safe for autonomous execution | No |
| `medium` | Moderate impact, may require review | No (but logged) |
| `high` | Significant impact, requires HITL approval | Yes |
| `critical` | Maximum impact, always requires human approval | Yes (always) |

### Audit Trail

All operations are OmniTrade are logged with:

- **Timestamp** (UTC)
- **Actor** (user ID or agent ID)
- **Operation Type** (tool execution, plugin lifecycle)
- **Input Parameters** (sanitized for sensitive data)
- **Output** (success/failure, result summary)
- **Duration** (execution time)
- **Reasoning** (AI confidence and justification for trading decisions)

## Integration with Google ADK

### ADK Wrapper Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                        ADK INTEGRATION LAYER                         │
└───────────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│  Function Tools    │   │  Tool Registry   │   │  Agent Pool       │
│  (ADK-compatible)  │   │  (OmniTrade)       │   │  (Multi-agent)   │
└───────────────────┘   └───────────────────┘   └───────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│  Hook Integration  │   │  Flow Definitions │   │  Agent Factory    │
│  (Event translation)│   │  (Genkit flows)     │   │  (Agent creation) │
└───────────────────┘   └───────────────────┘   └───────────────────┘
```

### Function Tool Wrapper

The ADK wrapper converts OmniTrade tools to ADK-compatible function tools:

```go
type FunctionTool struct {
    Name        string
    Description string
    Parameters  map[string]interface{}
    Required    []string
    Handler     ToolHandler
    Timeout     time.Duration
    RetryCount  int
    Metadata    map[string]interface{}
}

type ToolHandler func(ctx context.Context, params map[string]interface{}) (interface{}, error)
```

### Agent Configuration

```go
type AgentConfig struct {
    ID           string
    Name         string
    Type         AgentType
    Description  string
    SystemPrompt string
    Model        ModelConfig
    Tools       []string
    MaxTokens    int
    Temperature  float64
    Timeout      time.Duration
    RetryCount   int
    Metadata     map[string]interface{}
}
```

### Multi-Agent Orchestration

```
┌───────────────────────────────────────────────────────────────────────┐
│                    MULTI-AGENT ORCHESTRATION                          │
└───────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                     ┌──────────────────┐
                     │  Orchestrator    │
                     │  (Coordinator)    │
                     └────────┬─────────┘
                                │
            ┌────────────────────┴─────────────────────┐
            │                    │                     │
            ▼                    ▼                     ▼
   ┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
   │  Fundamental       │   │  Technical       │   │  Sentiment       │
   │  Analyst           │   │  Analyst         │   │  Analyst         │
   └─────────┬─────────┘   └─────────┬─────────┘   └─────────┬─────────┘
            │                       │                     │
            └───────────────────────┴─────────────────────┘
                                │
                                ▼
                     ┌──────────────────┐
                     │  Risk Manager    │
                     │  (Veto Power)     │
                     └────────┬─────────┘
                                │
                                ▼
                     ┌──────────────────┐
                     │  Portfolio        │
                     │  Manager          │
                     │  (Final Decision) │
                     └────────┬─────────┘
                                │
                                ▼
                     ┌──────────────────┐
                     │  Trade Proposal   │
                     │  (HITL Required)  │
                     └──────────────────┘
```

## Performance Considerations

### Caching Strategy

- **Tool Results**: Cached by tool ID + input hash
- **Market Data**: Cached with configurable TTL
- **Plugin States**: Cached in memory with periodic refresh

### Concurrency Model

- **Plugin Initialization**: Concurrent with semaphore limiting
- **Tool Execution**: Configurable parallelism
- **Hook Execution**: Sequential within event type, parallel across types

### Resource Limits

```go
type ResourceLimits struct {
    MaxConcurrentPlugins     int           // Maximum concurrent plugin operations
    MaxConcurrentTools       int           // Maximum concurrent tool executions
    MaxConcurrentHooks       int           // Maximum concurrent hook executions
    MaxMemoryMB             int           // Maximum memory usage
    MaxCPUTimeSeconds       int           // Maximum CPU time per operation
    DefaultTimeout          time.Duration // Default operation timeout
}
```

## Monitoring and Observability

### Metrics Collected

- **Plugin Metrics**: Load time, execution count, error rate, health status
- **Tool Metrics**: Execution time, success rate, cache hit rate
- **Hook Metrics**: Execution time, error rate, event distribution

### Health Checks

- **Plugin Health**: Periodic health check with configurable interval
- **Tool Health**: Check tool availability and dependencies
- **System Health**: Overall system health aggregation

### Logging

- **Structured Logging**: JSON-formatted logs with context
- **Correlation IDs**: Request tracing across components
- **Log Levels**: DEBUG, INFO, WARN, ERROR

## Troubleshooting

### Common Issues

1. **Plugin Not Loading**
   - Check plugin manifest
   - Verify dependencies
   - Check file permissions

2. **Tool Execution Failures**
   - Validate input parameters
   - Check permissions
   - Review rate limits

3. **Hook Execution Errors**
   - Check hook registration
   - Verify event type matching
   - Review hook priority

4. **Circuit Breaker Tripping**
   - Review failure threshold
   - Check underlying errors
   - Monitor recovery

### Debugging Tips

1. Enable debug logging
2. Check plugin states
3. Review hook execution order
4. Verify tool registrations
5. Check circuit breaker status

## Related Documentation

- [Plugin Development Guide](./plugin-development-guide.md)
- [Tool Reference](./tool-reference.md)
- [Hooks Reference](./hooks-reference.md)
- [Examples](./examples/)
