# OmniTrade Plugin Development Guide

## Overview

This guide walks you through creating plugins for the OmniTrade agent system. You'll learn how to implement the Plugin interface, register tools, create hooks, and integrate with Google ADK.

## Prerequisites

- Go 1.21+
- Understanding of OmniTrade architecture
- Familiarity with the plugin system concepts

## Plugin Development Process

### Step 1: Define Your Plugin

First, create a new file for your plugin (e.g., `my_plugin.go`):

```go
package myplugin

import (
    "context"
    "time"

    "github.com/omnitrade/backend/internal/agent/plugins"
)

// Define your plugin struct
type MyPlugin struct {
    plugins.BasePlugin
    config MyPluginConfig
}

// Define plugin-specific configuration
type MyPluginConfig struct {
    APIKey         string        `json:"api_key"`
    MaxRetries     int           `json:"max_retries"`
    Timeout        time.Duration `json:"timeout"`
    EnableCaching  bool          `json:"enable_caching"`
}
```

### Step 2: Implement the Plugin Interface

```go
// New creates a new instance of your plugin
func New() *MyPlugin {
    return &MyPlugin{
        BasePlugin: *plugins.NewBasePlugin(&plugins.PluginMetadata{
            ID:          "my_plugin",
            Name:        "My Custom Plugin",
            Version:     "1.0.0",
            Description: "A custom plugin for OmniTrade",
            Author:      "Your Name",
            Priority:    plugins.PriorityNormal,
            Capabilities: []plugins.PluginCapability{
                plugins.CapabilityAnalysis,
            },
            Dependencies: []string{}, // Add plugin IDs this depends on
            Tags:        []string{"custom", "analysis"},
        }),
    }
}

// Initialize sets up the plugin with configuration
func (p *MyPlugin) Initialize(ctx *plugins.PluginContext, config plugins.PluginConfig) error {
    // Parse plugin-specific configuration
    if apiKey, ok := config.Settings["api_key"].(string); ok {
        p.config.APIKey = apiKey
    }

    if maxRetries, ok := config.Settings["max_retries"].(int); ok {
        p.config.MaxRetries = maxRetries
    } else {
        p.config.MaxRetries = 3 // Default
    }

    if timeout, ok := config.Settings["timeout"].(string); ok {
        if d, err := time.ParseDuration(timeout); err == nil {
            p.config.Timeout = d
        }
    } else {
        p.config.Timeout = 30 * time.Second // Default
    }

    if enableCaching, ok := config.Settings["enable_caching"].(bool); ok {
        p.config.EnableCaching = enableCaching
    } else {
        p.config.EnableCaching = true // Default
    }

    // Validate configuration
    if p.config.APIKey == "" {
        return fmt.Errorf("api_key is required")
    }

    // Perform initialization tasks
    // e.g., connect to external services, initialize caches

    return nil
}

// Start begins plugin operation
func (p *MyPlugin) Start(ctx *plugins.PluginContext) error {
    // Start any background goroutines
    // Initialize connections
    // Warm up caches

    return nil
}

// Stop gracefully stops the plugin
func (p *MyPlugin) Stop(ctx *plugins.PluginContext) error {
    // Stop background goroutines
    // Close connections
    // Flush caches

    return nil
}

// Shutdown performs final cleanup
func (p *MyPlugin) Shutdown(ctx *plugins.PluginContext) error {
    // Release all resources
    // Close all connections
    // Persist any state if needed

    return nil
}

// Health checks if the plugin is healthy
func (p *MyPlugin) Health(ctx *plugins.PluginContext) (*plugins.PluginResult, error) {
    // Check if the plugin is healthy
    // Return health status

    return &plugins.PluginResult{
        Success: true,
        Data: map[string]interface{}{
            "status":   "healthy",
            "uptime":   time.Since(ctx.Timestamp).Seconds(),
        },
    }, nil
}

// Execute runs the plugin's main operation
func (p *MyPlugin) Execute(ctx *plugins.PluginContext, input interface{}) (*plugins.PluginResult, error) {
    // Parse input
    inputMap, ok := input.(map[string]interface{})
    if !ok {
        return nil, fmt.Errorf("invalid input type")
    }

    // Perform the main operation
    result, err := p.doWork(ctx, inputMap)
    if err != nil {
        return &plugins.PluginResult{
            Success: false,
            Error:   plugins.NewPluginError("EXECUTION_ERROR", err.Error(), true),
        }, err
    }

    return &plugins.PluginResult{
        Success: true,
        Data:    result,
        Metadata: map[string]interface{}{
            "duration":  time.Since(ctx.Timestamp).Milliseconds(),
        },
    }, nil
}

// doWork contains the actual business logic
func (p *MyPlugin) doWork(ctx *plugins.PluginContext, input map[string]interface{}) (interface{}, error) {
    // Your plugin's business logic here
    return map[string]interface{}{
        "result": "success",
    }, nil
}
```

### Step 3: Register Your Plugin

Create a registration function:

```go
package myplugin

import (
    "github.com/omnitrade/backend/internal/agent/plugins"
)

// init registers the plugin automatically when the package is imported
func init() {
    // Register with the global registry
    err := plugins.RegisterPlugin(func() plugins.Plugin {
        return New()
    })
    if err != nil {
        panic(fmt.Sprintf("failed to register plugin: %v", err))
    }
}
```

### Step 4: Create Plugin Configuration

Create a configuration file (e.g., `config.yaml`):

```yaml
plugins:
  my_plugin:
    enabled: true
    settings:
      api_key: "${MY_PLUGIN_API_KEY}"
      max_retries: 5
      timeout: "60s"
      enable_caching: true
    circuit_breaker:
      enabled: true
      failure_threshold: 5
      success_threshold: 2
      timeout: "30s"
```

## Plugin Patterns

### 1. Data Ingestion Plugin

Data ingestion plugins handle real-time market data:

```go
package dataingestion

import (
    "context"
    "time"

    "github.com/omnitrade/backend/internal/agent/plugins"
)

type DataIngestionPlugin struct {
    plugins.BasePlugin
    dataSource DataSource
    bufferSize int
}

func NewDataIngestionPlugin() *DataIngestionPlugin {
    return &DataIngestionPlugin{
        BasePlugin: *plugins.NewBasePlugin(&plugins.PluginMetadata{
            ID:          "data_ingestion",
            Name:        "Data Ingestion Plugin",
            Version:     "1.0.0",
            Description: "Handles real-time market data ingestion",
            Priority:    plugins.PriorityHigh,
            Capabilities: []plugins.PluginCapability{
                plugins.CapabilityDataIngestion,
            },
        }),
        bufferSize: 1000,
    }
}

func (p *DataIngestionPlugin) Execute(ctx *plugins.PluginContext, input interface{}) (*plugins.PluginResult, error) {
    // Parse market data
    marketData, ok := input.(MarketDataInput)
    if !ok {
        return nil, fmt.Errorf("invalid market data input")
    }

    // Validate data
    if err := p.validateMarketData(marketData); err != nil {
        return nil, err
    }

    // Process data
    processedData, err := p.processData(ctx, marketData)
    if err != nil {
        return nil, err
    }

    // Store in database
    if err := p.storeData(ctx, processedData); err != nil {
        return nil, err
    }

    return &plugins.PluginResult{
        Success: true,
        Data: map[string]interface{}{
            "symbol":    marketData.Symbol,
            "timestamp": time.Now().UTC(),
            "processed": true,
        },
    }, nil
}
```

### 2. Analysis Plugin

Analysis plugins perform computations on data:

```go
package analysis

import (
    "context"

    "github.com/omnitrade/backend/internal/agent/plugins"
)

type AnalysisPlugin struct {
    plugins.BasePlugin
    models map[string]AnalysisModel
}

func NewAnalysisPlugin() *AnalysisPlugin {
    return &AnalysisPlugin{
        BasePlugin: *plugins.NewBasePlugin(&plugins.PluginMetadata{
            ID:          "analysis",
            Name:        "Analysis Plugin",
            Version:     "1.0.0",
            Description: "Performs technical and fundamental analysis",
            Priority:    plugins.PriorityNormal,
            Capabilities: []plugins.PluginCapability{
                plugins.CapabilityAnalysis,
            },
        }),
        models: make(map[string]AnalysisModel),
    }
}

func (p *AnalysisPlugin) Initialize(ctx *plugins.PluginContext, config plugins.PluginConfig) error {
    // Load analysis models
    if err := p.loadModels(config); err != nil {
        return err
    }

    return nil
}

func (p *AnalysisPlugin) Execute(ctx *plugins.PluginContext, input interface{}) (*plugins.PluginResult, error) {
    analysisInput, ok := input.(AnalysisInput)
    if !ok {
        return nil, fmt.Errorf("invalid analysis input")
    }

    // Run analysis
    results := make(map[string]interface{})

    for name, model := range p.models {
        result, err := model.Analyze(ctx, analysisInput)
        if err != nil {
            ctx.Logger.Warn("model analysis failed", "model", name, "error", err)
            continue
        }
        results[name] = result
    }

    return &plugins.PluginResult{
        Success: true,
        Data:    results,
    }, nil
}
```

### 3. Signal Generation Plugin

Signal generation plugins create trading signals:

```go
package signalgen

import (
    "context"
    "time"

    "github.com/omnitrade/backend/internal/agent/plugins"
)

type SignalGenerationPlugin struct {
    plugins.BasePlugin
    minConfidence float64
}

func NewSignalGenerationPlugin() *SignalGenerationPlugin {
    return &SignalGenerationPlugin{
        BasePlugin: *plugins.NewBasePlugin(&plugins.PluginMetadata{
            ID:          "signal_generation",
            Name:        "Signal Generation Plugin",
            Version:     "1.0.0",
            Description: "Generates trading signals based on analysis",
            Priority:    plugins.PriorityNormal,
            Capabilities: []plugins.PluginCapability{
                plugins.CapabilitySignalGeneration,
            },
        }),
        minConfidence: 0.70, // Minimum 0.70 confidence
    }
}

func (p *SignalGenerationPlugin) Execute(ctx *plugins.PluginContext, input interface{}) (*plugins.PluginResult, error) {
    signalInput, ok := input.(SignalInput)
    if !ok {
        return nil, fmt.Errorf("invalid signal input")
    }

    // Generate signals
    signals := p.generateSignals(ctx, signalInput)

    // Filter by confidence
    filteredSignals := p.filterByConfidence(signals)

    // Apply risk checks
    safeSignals := p.applyRiskChecks(ctx, filteredSignals)

    return &plugins.PluginResult{
        Success: true,
        Data: map[string]interface{}{
            "signals":  safeSignals,
            "count":   len(safeSignals),
        },
    }, nil
}

func (p *SignalGenerationPlugin) filterByConfidence(signals []Signal) []Signal {
    filtered := make([]Signal, 0)
    for _, signal := range signals {
        if signal.Confidence >= p.minConfidence {
            filtered = append(filtered, signal)
        }
    }
    return filtered
}
```

### 4. Risk Assessment Plugin

Risk assessment plugins evaluate trading risks:

```go
package risk

import (
    "context"

    "github.com/omnitrade/backend/internal/agent/plugins"
)

type RiskAssessmentPlugin struct {
    plugins.BasePlugin
    maxRiskLevel RiskLevel
}

func NewRiskAssessmentPlugin() *RiskAssessmentPlugin {
    return &RiskAssessmentPlugin{
        BasePlugin: *plugins.NewBasePlugin(&plugins.PluginMetadata{
            ID:          "risk_assessment",
            Name:        "Risk Assessment Plugin",
            Version:     "1.0.0",
            Description: "Assesses risk for trading operations",
            Priority:    plugins.PriorityHigh,
            Capabilities: []plugins.PluginCapability{
                plugins.CapabilityRiskAssessment,
            },
        }),
        maxRiskLevel: RiskHigh,
    }
}

func (p *RiskAssessmentPlugin) Execute(ctx *plugins.PluginContext, input interface{}) (*plugins.PluginResult, error) {
    riskInput, ok := input.(RiskInput)
    if !ok {
        return nil, fmt.Errorf("invalid risk input")
    }

    // Calculate risk metrics
    riskMetrics := p.calculateRiskMetrics(ctx, riskInput)

    // Generate risk score
    riskScore := p.calculateRiskScore(riskMetrics)

    // Determine if operation is acceptable
    acceptable := riskScore <= p.maxRiskLevel

    return &plugins.PluginResult{
        Success: true,
        Data: map[string]interface{}{
            "risk_score":   riskScore,
            "metrics":     riskMetrics,
            "acceptable":  acceptable,
            "warnings":    p.generateWarnings(riskMetrics),
        },
    }, nil
}
```

### 5. Notification Plugin

Notification plugins send alerts and notifications:

```go
package notification

import (
    "context"

    "github.com/omnitrade/backend/internal/agent/plugins"
)

type NotificationPlugin struct {
    plugins.BasePlugin
    channels []NotificationChannel
}

func NewNotificationPlugin() *NotificationPlugin {
    return &NotificationPlugin{
        BasePlugin: *plugins.NewBasePlugin(&plugins.PluginMetadata{
            ID:          "notification",
            Name:        "Notification Plugin",
            Version:     "1.0.0",
            Description: "Sends alerts and notifications",
            Priority:    plugins.PriorityBackground,
            Capabilities: []plugins.PluginCapability{
                plugins.CapabilityNotification,
            },
        }),
        channels: make([]NotificationChannel, 0),
    }
}

func (p *NotificationPlugin) Initialize(ctx *plugins.PluginContext, config plugins.PluginConfig) error {
    // Initialize notification channels
    if err := p.initializeChannels(config); err != nil {
        return err
    }

    return nil
}

func (p *NotificationPlugin) Execute(ctx *plugins.PluginContext, input interface{}) (*plugins.PluginResult, error) {
    notification, ok := input.(NotificationInput)
    if !ok {
        return nil, fmt.Errorf("invalid notification input")
    }

    // Send to all channels
    results := make(map[string]bool)
    for _, channel := range p.channels {
        err := channel.Send(ctx, notification)
        results[channel.Name()] = err == nil
    }

    return &plugins.PluginResult{
        Success: true,
        Data: map[string]interface{}{
            "sent_to": results,
        },
    }, nil
}
```

## Testing Your Plugin

### Unit Tests

Create a test file (e.g., `my_plugin_test.go`):

```go
package myplugin

import (
    "context"
    "testing"
    "time"

    "github.com/omnitrade/backend/internal/agent/plugins"
)

func TestMyPlugin_Initialize(t *testing.T) {
    p := New()

    ctx := &plugins.PluginContext{
        Context:     context.Background(),
        CorrelationID: "test-123",
        Timestamp:   time.Now(),
        Metadata:    make(map[string]interface{}),
    }

    config := plugins.PluginConfig{
        Enabled:  true,
        Settings: map[string]interface{}{
            "api_key":        "test-key",
            "max_retries":     3,
            "timeout":         "30s",
            "enable_caching":  true,
        },
    }

    err := p.Initialize(ctx, config)
    if err != nil {
        t.Fatalf("Initialize failed: %v", err)
    }
}

func TestMyPlugin_Execute(t *testing.T) {
    p := New()

    // Initialize first
    ctx := &plugins.PluginContext{
        Context:     context.Background(),
        CorrelationID: "test-123",
        Timestamp:   time.Now(),
        Metadata:    make(map[string]interface{}),
    }

    config := plugins.PluginConfig{
        Enabled:  true,
        Settings: map[string]interface{}{
            "api_key": "test-key",
        },
    }

    if err := p.Initialize(ctx, config); err != nil {
        t.Fatalf("Initialize failed: %v", err)
    }

    // Execute
    input := map[string]interface{}{
        "symbol": "AAPL",
        "action": "analyze",
    }

    result, err := p.Execute(ctx, input)
    if err != nil {
        t.Fatalf("Execute failed: %v", err)
    }

    if !result.Success {
        t.Error("Expected success")
    }
}
```

### Integration Tests

```go
package myplugin

import (
    "context"
    "testing"
    "time"

    "github.com/omnitrade/backend/internal/agent/plugins"
)

func TestMyPlugin_Integration(t *testing.T) {
    // Create registry
    registry := plugins.NewRegistry()

    // Register plugin
    err := registry.Register(func() plugins.Plugin {
        return New()
    })
    if err != nil {
        t.Fatalf("Registration failed: %v", err)
    }

    // Create manager
    manager := plugins.NewManager(plugins.DefaultManagerConfig(), registry)

    // Load and initialize
    ctx := context.Background()
    if err := manager.Load(ctx); err != nil {
        t.Fatalf("Load failed: %v", err)
    }

    // Execute
    input := map[string]interface{}{
        "symbol": "AAPL",
    }

    result, err := manager.Execute(ctx, "my_plugin", input)
    if err != nil {
        t.Fatalf("Execute failed: %v", err)
    }

    if !result.Success {
        t.Error("Expected success")
    }

    // Shutdown
    if err := manager.Shutdown(ctx); err != nil {
        t.Fatalf("Shutdown failed: %v", err)
    }
}
```

## Best Practices

### 1. Error Handling

Always return meaningful errors:

```go
func (p *MyPlugin) Execute(ctx *plugins.PluginContext, input interface{}) (*plugins.PluginResult, error) {
    // Validate input
    if input == nil {
        return &plugins.PluginResult{
            Success: false,
            Error: plugins.NewPluginError(
                plugins.ErrCodeInvalidInput,
                "input cannot be nil",
                false, // Not retryable
            ),
        }, nil
    }

    // Handle transient errors
    if err := p.callExternalAPI(ctx); err != nil {
        return &plugins.PluginResult{
            Success: false,
            Error: plugins.NewPluginError(
                plugins.ErrCodeTimeout,
                "API call timed out",
                true, // Retryable
            ).WithCause(err),
        }, nil
    }

    // ... rest of implementation
}
```

### 2. Logging

Use structured logging:

```go
func (p *MyPlugin) Execute(ctx *plugins.PluginContext, input interface{}) (*plugins.PluginResult, error) {
    ctx.Logger.Info("starting execution",
        "plugin_id", p.Metadata().ID,
        "correlation_id", ctx.CorrelationID,
    )

    // ... execution logic ...

    ctx.Logger.Debug("execution completed",
        "plugin_id", p.Metadata().ID,
        "duration", time.Since(ctx.Timestamp).Milliseconds(),
    )
}
```

### 3. Context Propagation

Always propagate context:

```go
func (p *MyPlugin) doWork(ctx *plugins.PluginContext, input map[string]interface{}) (interface{}, error) {
    // Create timeout context
    timeoutCtx, cancel := context.WithTimeout(ctx.Context, p.config.Timeout)
    defer cancel()

    // Pass context to all operations
    result, err := p.dataSource.Query(timeoutCtx, input)
    if err != nil {
        return nil, err
    }

    return result, nil
}
```

### 4. Resource Cleanup

Always clean up resources:

```go
func (p *MyPlugin) Stop(ctx *plugins.PluginContext) error {
    // Close connections
    if p.conn != nil {
        if err := p.conn.Close(); err != nil {
            ctx.Logger.Error("failed to close connection", "error", err)
        }
    }

    // Flush buffers
    if p.buffer != nil {
        p.buffer.Flush()
    }

    // Cancel background goroutines
    if p.cancelFunc != nil {
        p.cancelFunc()
    }

    return nil
}
```

### 5. Configuration Validation

Validate configuration early:

```go
func (p *MyPlugin) Initialize(ctx *plugins.PluginContext, config plugins.PluginConfig) error {
    // Validate required settings
    requiredSettings := []string{"api_key", "endpoint"}
    for _, setting := range requiredSettings {
        if _, ok := config.Settings[setting]; !ok {
            return fmt.Errorf("required setting '%s' is missing", setting)
        }
    }

    // Validate setting types
    if apiKey, ok := config.Settings["api_key"].(string); !ok || apiKey == "" {
        return fmt.Errorf("api_key must be a non-empty string")
    }

    // Validate ranges
    if maxRetries, ok := config.Settings["max_retries"].(int); ok {
        if maxRetries < 0 || maxRetries > 10 {
            return fmt.Errorf("max_retries must be between 0 and 10")
        }
    }

    return nil
}
```

## Troubleshooting

### Plugin Not Loading

1. Check plugin registration
2. Verify plugin ID is unique
3. Check dependencies are satisfied
4. Review initialization logs

### Execution Failures

1. Validate input parameters
2. Check circuit breaker state
3. Review error codes
4. Check timeout settings

### Performance Issues

1. Review timeout settings
2. Check for blocking operations
3. Enable caching where appropriate
4. Use concurrent execution where possible

## Related Documentation

- [Architecture Overview](./architecture.md)
- [Tool Reference](./tool-reference.md)
- [Hooks Reference](./hooks-reference.md)
- [Examples](./examples/)
