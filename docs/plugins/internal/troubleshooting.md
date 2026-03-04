# OmniTrade Plugin Architecture - Troubleshooting Guide

This guide covers common issues and solutions when working with the OmniTrade plugin architecture.

## Plugin Issues

### Plugin Not Loading

**Symptoms:**
- Plugin does not appear in registry
- "Plugin not found" errors
- Initialization fails silently

**Diagnosis:**

1. Check if the plugin is registered:
```go
registry := plugins.GetGlobalRegistry()
metadata, exists := registry.Get("my_plugin")
if !exists {
    log.Error("Plugin not registered")
}
```

2. Check plugin dependencies:
```go
deps := metadata.Dependencies
for _, dep := range deps {
    if _, exists := registry.Get(dep); !exists {
        log.Error("Missing dependency", "dependency", dep)
    }
}
```

3. Check plugin manifest:
```bash
# Verify plugin configuration
cat config/plugins.yaml | grep my_plugin
```

**Solutions:**

1. Ensure `init()` function registers the plugin:
```go
func init() {
    err := plugins.RegisterPlugin(func() plugins.Plugin {
        return New()
    })
    if err != nil {
        panic(fmt.Sprintf("failed to register plugin: %v", err))
    }
}
```

2. Import the plugin package in main:
```go
import (
    _ "github.com/omnitrade/backend/plugins/my_plugin"
)
```

3. Verify dependencies are loaded first:
```yaml
plugins:
  dependency_plugin:
    enabled: true
  my_plugin:
    enabled: true
    depends_on:
      - dependency_plugin
```

---

### Plugin Initialization Fails

**Symptoms:**
- Plugin stuck in "initializing" state
- Configuration errors
- Resource allocation failures

**Diagnosis:**

1. Check plugin state:
```go
state := plugin.State()
fmt.Printf("Plugin state: %s\n", state)
```

2. Review initialization logs:
```bash
grep "plugin.*initialization" logs/omnitrade.log
```

3. Validate configuration:
```go
config := plugins.PluginConfig{
    Settings: map[string]interface{}{
        "api_key": "test",
    },
}
err := plugin.ValidateConfig(config)
if err != nil {
    log.Error("Invalid config", "error", err)
}
```

**Solutions:**

1. Fix missing required settings:
```go
func (p *MyPlugin) Initialize(ctx *plugins.PluginContext, config plugins.PluginConfig) error {
    if apiKey, ok := config.Settings["api_key"].(string); !ok || apiKey == "" {
        return fmt.Errorf("api_key is required")
    }
    p.config.APIKey = apiKey
    return nil
}
```

2. Handle resource limits:
```go
func (p *MyPlugin) Initialize(ctx *plugins.PluginContext, config plugins.PluginConfig) error {
    // Check memory limit
    var m runtime.MemStats
    runtime.ReadMemStats(&m)
    if m.Alloc > 100*1024*1024 { // 100MB
        return fmt.Errorf("insufficient memory")
    }
    return nil
}
```

3. Add timeout to initialization:
```go
func (p *MyPlugin) Initialize(ctx *plugins.PluginContext, config plugins.PluginConfig) error {
    timeoutCtx, cancel := context.WithTimeout(ctx.Context, 30*time.Second)
    defer cancel()

    return p.initializeWithTimeout(timeoutCtx, config)
}
```

---

### Plugin Execution Fails

**Symptoms:**
- "Execution failed" errors
- Timeout errors
- Unexpected results

**Diagnosis:**

1. Check error type:
```go
result, err := plugin.Execute(ctx, input)
if err != nil {
    if pluginErr, ok := err.(*plugins.PluginError); ok {
        fmt.Printf("Error code: %s\n", pluginErr.Code)
        fmt.Printf("Retryable: %v\n", pluginErr.Retryable)
    }
}
```

2. Check circuit breaker state:
```go
manager := plugins.GetGlobalManager()
health, _ := manager.Health(ctx, "my_plugin")
fmt.Printf("Circuit breaker: %v\n", health.Data["circuit_breaker_state"])
```

3. Monitor execution time:
```go
start := time.Now()
result, err := plugin.Execute(ctx, input)
duration := time.Since(start)
fmt.Printf("Execution time: %v\n", duration)
```

**Solutions:**

1. Add proper error handling:
```go
func (p *MyPlugin) Execute(ctx *plugins.PluginContext, input interface{}) (*plugins.PluginResult, error) {
    // Validate input
    if input == nil {
        return &plugins.PluginResult{
            Success: false,
            Error: plugins.NewPluginError(
                plugins.ErrCodeInvalidInput,
                "input cannot be nil",
                false,
            ),
        }, nil
    }

    // Execute with timeout
    timeoutCtx, cancel := context.WithTimeout(ctx.Context, p.config.Timeout)
    defer cancel()

    return p.doWork(timeoutCtx, input)
}
```

2. Implement retry logic:
```go
func (p *MyPlugin) ExecuteWithRetry(ctx *plugins.PluginContext, input interface{}) (*plugins.PluginResult, error) {
    var lastErr error
    for attempt := 0; attempt <= p.config.MaxRetries; attempt++ {
        result, err := p.Execute(ctx, input)
        if err == nil {
            return result, nil
        }

        lastErr = err
        if !p.isRetryable(err) {
            break
        }

        time.Sleep(p.calculateBackoff(attempt))
    }
    return nil, lastErr
}
```

---

## Tool Issues

### Tool Not Found

**Symptoms:**
- "Tool not found" errors
- Empty tool lists
- Missing tool definitions

**Diagnosis:**

1. Check tool registration:
```go
registry := tools.GetGlobalRegistry()
_, exists := registry.Get("my_tool")
fmt.Printf("Tool exists: %v\n", exists)
```

2. List all tools:
```go
toolIDs := registry.List()
for _, id := range toolIDs {
    fmt.Printf("Tool: %s\n", id)
}
```

3. Search for tool:
```go
results := registry.Search("market")
fmt.Printf("Found tools: %v\n", results)
```

**Solutions:**

1. Register tool in init():
```go
func init() {
    tools.MustRegister(NewMyTool())
}
```

2. Import tool package:
```go
import (
    _ "github.com/omnitrade/backend/internal/agent/tools/categories"
)
```

---

### Tool Validation Fails

**Symptoms:**
- "Validation error" responses
- Required parameter errors
- Type mismatch errors

**Diagnosis:**

1. Check parameter types:
```go
input := &tools.ExecutionInput{
    ToolID: "my_tool",
    Arguments: map[string]interface{}{
        "symbol": "AAPL",  // string
        "count":  10,       // int
    },
}
```

2. Validate against schema:
```go
def := tool.Definition()
schema := def.ToJSONSchema()
// Validate input against schema
```

**Solutions:**

1. Ensure correct types:
```go
// Use proper types
Arguments: map[string]interface{}{
    "symbol":   "AAPL",
    "count":    float64(10),  // Numbers as float64
    "enabled":  true,          // Booleans as bool
}
```

2. Handle validation errors:
```go
result, err := registry.Execute(ctx, input)
if err != nil {
    if result.Error.Type == "validation" {
        fmt.Printf("Validation error: %s\n", result.Error.Message)
    }
}
```

---

### Permission Denied

**Symptoms:**
- "Permission denied" errors
- "Unauthorized" responses
- Tool execution blocked

**Diagnosis:**

1. Check user roles:
```go
pm := tools.NewPermissionManager()
roles := pm.GetUserRoles("user-123")
fmt.Printf("User roles: %v\n", roles)
```

2. Check tool permissions:
```go
def := tool.Definition()
fmt.Printf("Permission level: %s\n", def.PermissionLevel)
fmt.Printf("Risk level: %s\n", def.RiskLevel)
```

**Solutions:**

1. Assign appropriate roles:
```go
pm.SetUserRole("user-123", tools.RoleTrader)
```

2. Request human approval for high-risk tools:
```go
if tools.RequiresHumanApproval(def, input) {
    // Submit for approval
}
```

---

## Hook Issues

### Hook Not Executing

**Symptoms:**
- Hooks not called
- Events not processed
- Missing hook logs

**Diagnosis:**

1. Check hook registration:
```go
registry := hooks.GetGlobalRegistry()
hooks := registry.GetByEventType(hooks.EventBeforeAnalysis)
fmt.Printf("Registered hooks: %d\n", len(hooks))
```

2. Check hook enabled status:
```go
config := hook.Config()
fmt.Printf("Hook enabled: %v\n", config.Enabled)
```

3. Check event type matching:
```go
eventTypes := hook.EventTypes()
for _, et := range eventTypes {
    fmt.Printf("Subscribed to: %s\n", et)
}
```

**Solutions:**

1. Register hook properly:
```go
registry := hooks.NewRegistry()
hook := NewMyHook()
if err := registry.Register(hook); err != nil {
    log.Fatal(err)
}
```

2. Enable hook:
```go
hook := NewMyHook()
hook.Config().Enabled = true
```

3. Subscribe to correct events:
```go
Config: hooks.HookConfig{
    EventTypes: []hooks.EventType{
        hooks.EventBeforeAnalysis,
        hooks.EventAfterAnalysis,
    },
}
```

---

### Hook Execution Timeout

**Symptoms:**
- "Hook timed out" errors
- Slow event processing
- Blocked execution

**Diagnosis:**

1. Check hook timeout:
```go
config := hook.Config()
fmt.Printf("Timeout: %v\n", config.Timeout)
```

2. Measure execution time:
```go
start := time.Now()
result := hook.Execute(ctx, event)
duration := time.Since(start)
fmt.Printf("Execution time: %v\n", duration)
```

**Solutions:**

1. Increase timeout:
```go
Config: hooks.HookConfig{
    Timeout: 30 * time.Second,
}
```

2. Optimize hook logic:
```go
func (h *MyHook) Execute(ctx context.Context, event *hooks.Event) *hooks.HookResult {
    // Use context for cancellation
    select {
    case <-ctx.Done():
        return hooks.ErrorResult(ctx.Err())
    default:
        // Do work
    }
    return hooks.NewHookResult()
}
```

3. Use async processing:
```go
func (h *MyHook) Execute(ctx context.Context, event *hooks.Event) *hooks.HookResult {
    // Queue for async processing
    go h.processAsync(event)
    return hooks.NewHookResult()
}
```

---

### Hook Priority Issues

**Symptoms:**
- Hooks executing in wrong order
- Validation running after transformation
- Audit logs missing data

**Diagnosis:**

1. Check hook priorities:
```go
hooks := registry.GetByEventType(hooks.EventBeforeAnalysis)
sort.Slice(hooks, func(i, j int) bool {
    return hooks[i].Config().Priority > hooks[j].Config().Priority
})
for _, h := range hooks {
    fmt.Printf("Hook: %s, Priority: %d\n", h.ID(), h.Config().Priority)
}
```

**Solutions:**

1. Set correct priority:
```go
Config: hooks.HookConfig{
    Priority: hooks.PriorityCritical, // Run first
}
```

2. Use priority constants:
```go
const (
    PriorityMonitors  Priority = -1   // Observability
    PriorityCritical  Priority = 200  // Must run first
    PriorityHigh      Priority = 75   // Before normal
    PriorityNormal    Priority = 50   // Default
    PriorityLow       Priority = 25   // After normal
    PriorityBackground Priority = 10  // Logging
)
```

---

## Circuit Breaker Issues

### Circuit Breaker Always Open

**Symptoms:**
- All requests blocked
- "Circuit breaker open" errors
- No recovery

**Diagnosis:**

1. Check circuit breaker state:
```go
state := breaker.State(eventType)
fmt.Printf("Circuit state: %s\n", state)
```

2. Check failure count:
```go
// Circuit breaker internals
fmt.Printf("Failures: %d\n", circuit.failures)
fmt.Printf("Threshold: %d\n", breaker.failureThreshold)
```

**Solutions:**

1. Check underlying issues:
```bash
# Check external service health
curl -X GET https://api.example.com/health
```

2. Adjust thresholds:
```go
breaker := hooks.NewDefaultCircuitBreaker(
    10,  // Higher failure threshold
    3,   // Success threshold
    60*time.Second, // Longer recovery timeout
)
```

3. Manual reset:
```go
// Reset circuit breaker
breaker.Reset(eventType)
```

---

## Performance Issues

### Slow Plugin Loading

**Symptoms:**
- Long startup time
- Timeout during initialization
- Slow dependency resolution

**Diagnosis:**

1. Profile loading time:
```go
start := time.Now()
manager.Load(ctx)
fmt.Printf("Load time: %v\n", time.Since(start))
```

2. Check dependency graph:
```go
graph := manager.DependencyGraph()
for plugin, deps := range graph {
    fmt.Printf("Plugin: %s, Dependencies: %v\n", plugin, deps)
}
```

**Solutions:**

1. Lazy load plugins:
```go
config := plugins.ManagerConfig{
    LazyLoad: true,
}
manager := plugins.NewManager(config, registry)
```

2. Parallel initialization:
```go
config := plugins.ManagerConfig{
    MaxConcurrentInit: 5,
}
```

---

### High Memory Usage

**Symptoms:**
- Out of memory errors
- Slow garbage collection
- Increasing memory over time

**Diagnosis:**

1. Monitor memory:
```go
var m runtime.MemStats
runtime.ReadMemStats(&m)
fmt.Printf("Alloc: %v MB\n", m.Alloc/1024/1024)
fmt.Printf("TotalAlloc: %v MB\n", m.TotalAlloc/1024/1024)
```

2. Profile memory:
```bash
go tool pprof http://localhost:6060/debug/pprof/heap
```

**Solutions:**

1. Clear caches:
```go
func (p *MyPlugin) clearCache() {
    p.mu.Lock()
    defer p.mu.Unlock()
    p.cache = make(map[string]interface{})
}
```

2. Limit buffer sizes:
```go
type MyPlugin struct {
    buffer *ring.Ring // Fixed-size ring buffer
}
```

---

## Debugging Tips

### Enable Debug Logging

```go
import "go.uber.org/zap"

config := zap.NewDevelopmentConfig()
config.Level = zap.NewAtomicLevelAt(zap.DebugLevel)
logger, _ := config.Build()
```

### Trace Execution

```go
import "go.opentelemetry.io/otel"

tracer := otel.Tracer("omnitrade")
ctx, span := tracer.Start(ctx, "plugin.Execute")
defer span.End()
```

### Check Health Endpoints

```bash
# Plugin health
curl http://localhost:8080/health/plugins

# Tool registry
curl http://localhost:8080/health/tools

# Hook system
curl http://localhost:8080/health/hooks
```

### Use Debug Endpoints

```bash
# List all plugins
curl http://localhost:8080/debug/plugins

# List all tools
curl http://localhost:8080/debug/tools

# List all hooks
curl http://localhost:8080/debug/hooks
```

---

## Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `PLUGIN_NOT_FOUND` | Plugin not registered | Register plugin in init() |
| `PLUGIN_INIT_FAILED` | Initialization failed | Check configuration |
| `PLUGIN_TIMEOUT` | Operation timed out | Increase timeout or optimize |
| `TOOL_NOT_FOUND` | Tool not registered | Register tool in init() |
| `VALIDATION_ERROR` | Input validation failed | Check parameter types |
| `PERMISSION_DENIED` | User lacks permission | Check user roles |
| `RATE_LIMITED` | Rate limit exceeded | Reduce request frequency |
| `CIRCUIT_OPEN` | Circuit breaker tripped | Check underlying issues |
| `DEPENDENCY_ERROR` | Dependency failed | Check dependency health |

---

## Getting Help

1. **Check logs**: Review logs in `logs/omnitrade.log`
2. **Enable debug mode**: Set `LOG_LEVEL=debug`
3. **Check metrics**: Review metrics at `/metrics`
4. **Search issues**: Check GitHub issues for similar problems
5. **Ask in Slack**: Join #omnitrade-support

## Related Documentation

- [Architecture Overview](./architecture.md)
- [Plugin Development Guide](./plugin-development-guide.md)
- [Tool Reference](./tool-reference.md)
- [Hooks Reference](./hooks-reference.md)
