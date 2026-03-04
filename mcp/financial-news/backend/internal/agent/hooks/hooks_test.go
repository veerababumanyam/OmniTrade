package hooks

import (
	"context"
	"fmt"
	"testing"
	"time"

	"go.uber.org/zap"
)

// TestNewEvent tests event creation
func TestNewEvent(t *testing.T) {
	payload := &BasePayload{Data: map[string]interface{}{"key": "value"}}
	event := NewEvent(EventBeforeAnalysis, "test-plugin", payload)

	if event.ID == "" {
		t.Error("event ID should not be empty")
	}
	if event.Type != EventBeforeAnalysis {
		t.Errorf("expected event type %s, got %s", EventBeforeAnalysis, event.Type)
	}
	if event.Source != "test-plugin" {
		t.Errorf("expected source test-plugin, got %s", event.Source)
	}
	if event.Category != CategoryIntelligence {
		t.Errorf("expected category %s, got %s", CategoryIntelligence, event.Category)
	}
	if event.IsCancelled() {
		t.Error("new event should not be cancelled")
	}
}

// TestEventCancellation tests event cancellation
func TestEventCancellation(t *testing.T) {
	event := NewEvent(EventBeforeAnalysis, "test", &BasePayload{})

	event.Cancel("test reason")

	if !event.IsCancelled() {
		t.Error("event should be cancelled")
	}
	if event.CancelReason() != "test reason" {
		t.Errorf("expected cancel reason 'test reason', got %s", event.CancelReason())
	}
}

// TestEventClone tests event cloning
func TestEventClone(t *testing.T) {
	original := NewEvent(EventBeforeAnalysis, "test", &BasePayload{})
	original.CorrelationID = "corr-123"
	original.SetMetadata("key", "value")

	clone := original.Clone()

	if clone.ID == original.ID {
		t.Error("clone should have different ID")
	}
	if clone.ParentEventID != original.ID {
		t.Errorf("clone parent event ID should be original ID")
	}
	if clone.CorrelationID != original.CorrelationID {
		t.Error("clone should preserve correlation ID")
	}
}

// TestHookBuilder tests hook builder
func TestHookBuilder(t *testing.T) {
	executed := false
	handler := func(ctx context.Context, event *Event) *HookResult {
		executed = true
		return NewHookResult()
	}

	hook, err := NewHookBuilder().
		WithID("test-hook").
		WithName("Test Hook").
		WithDescription("A test hook").
		WithEvents(EventBeforeAnalysis).
		WithPriority(PriorityHigh).
		WithHandler(handler).
		Build()

	if err != nil {
		t.Fatalf("failed to build hook: %v", err)
	}

	if hook.ID() != "test-hook" {
		t.Errorf("expected ID test-hook, got %s", hook.ID())
	}
	if hook.Name() != "Test Hook" {
		t.Errorf("expected name 'Test Hook', got %s", hook.Name())
	}
	if hook.Priority() != PriorityHigh {
		t.Errorf("expected priority %d, got %d", PriorityHigh, hook.Priority())
	}
	if !hook.IsEnabled() {
		t.Error("hook should be enabled by default")
	}

	// Test execution
	result := hook.Execute(context.Background(), NewEvent(EventBeforeAnalysis, "test", &BasePayload{}))
	if !result.Proceed {
		t.Error("hook should proceed")
	}
	if !executed {
		t.Error("handler should have been executed")
	}
}

// TestRegistry tests hook registry
func TestRegistry(t *testing.T) {
	logger := zap.NewNop()
	registry := NewRegistry(RegistryConfig{Logger: logger})

	hook, _ := NewHookBuilder().
		WithID("test-hook").
		WithName("Test Hook").
		WithEvents(EventBeforeAnalysis).
		WithHandler(func(ctx context.Context, event *Event) *HookResult {
			return NewHookResult()
		}).
		Build()

	// Test registration
	err := registry.Register(hook)
	if err != nil {
		t.Fatalf("failed to register hook: %v", err)
	}

	// Test duplicate registration
	err = registry.Register(hook)
	if err == nil {
		t.Error("duplicate registration should fail")
	}

	// Test retrieval
	retrieved, ok := registry.Get("test-hook")
	if !ok {
		t.Error("hook should be found")
	}
	if retrieved.ID() != "test-hook" {
		t.Errorf("expected ID test-hook, got %s", retrieved.ID())
	}

	// Test by event type
	hooks := registry.GetByEventType(EventBeforeAnalysis)
	if len(hooks) != 1 {
		t.Errorf("expected 1 hook, got %d", len(hooks))
	}

	// Test unregister
	err = registry.Unregister("test-hook")
	if err != nil {
		t.Fatalf("failed to unregister hook: %v", err)
	}

	_, ok = registry.Get("test-hook")
	if ok {
		t.Error("hook should not be found after unregister")
	}
}

// TestRegistryWithPlugin tests plugin-based registration
func TestRegistryWithPlugin(t *testing.T) {
	logger := zap.NewNop()
	registry := NewRegistry(RegistryConfig{Logger: logger})

	hook, _ := NewHookBuilder().
		WithID("plugin-hook").
		WithName("Plugin Hook").
		WithEvents(EventOnDataIngest).
		WithHandler(func(ctx context.Context, event *Event) *HookResult {
			return NewHookResult()
		}).
		Build()

	err := registry.RegisterWithPlugin(hook, "test-plugin")
	if err != nil {
		t.Fatalf("failed to register hook with plugin: %v", err)
	}

	// Test retrieval by plugin
	hooks := registry.GetByPlugin("test-plugin")
	if len(hooks) != 1 {
		t.Errorf("expected 1 hook for plugin, got %d", len(hooks))
	}

	// Test unregister by plugin
	err = registry.UnregisterPlugin("test-plugin")
	if err != nil {
		t.Fatalf("failed to unregister plugin: %v", err)
	}

	hooks = registry.GetByPlugin("test-plugin")
	if len(hooks) != 0 {
		t.Error("plugin hooks should be empty after unregister")
	}
}

// TestExecutor tests hook execution
func TestExecutor(t *testing.T) {
	logger := zap.NewNop()
	registry := NewRegistry(RegistryConfig{Logger: logger})
	executor := NewExecutor(ExecutorConfig{
		Registry: registry,
		Logger:   logger,
	})

	executed := false
	hook, _ := NewHookBuilder().
		WithID("test-hook").
		WithName("Test Hook").
		WithEvents(EventBeforeAnalysis).
		WithHandler(func(ctx context.Context, event *Event) *HookResult {
			executed = true
			return NewHookResult()
		}).
		Build()

	registry.Register(hook)

	event := NewEvent(EventBeforeAnalysis, "test", &BasePayload{})
	result := executor.Execute(context.Background(), event)

	if !executed {
		t.Error("hook should have been executed")
	}
	if result.HooksExecuted != 1 {
		t.Errorf("expected 1 hook executed, got %d", result.HooksExecuted)
	}
	if result.Stopped {
		t.Error("execution should not have been stopped")
	}
}

// TestExecutorWithPanic tests panic recovery
func TestExecutorWithPanic(t *testing.T) {
	logger := zap.NewNop()
	registry := NewRegistry(RegistryConfig{Logger: logger})
	executor := NewExecutor(ExecutorConfig{
		Registry: registry,
		Logger:   logger,
	})

	hook, _ := NewHookBuilder().
		WithID("panic-hook").
		WithName("Panic Hook").
		WithEvents(EventBeforeAnalysis).
		WithHandler(func(ctx context.Context, event *Event) *HookResult {
			panic("test panic")
		}).
		Build()

	registry.Register(hook)

	event := NewEvent(EventBeforeAnalysis, "test", &BasePayload{})
	result := executor.Execute(context.Background(), event)

	// Should continue after panic
	if !result.Results[0].Proceed {
		t.Error("execution should proceed after panic recovery")
	}
	if result.Results[0].Error == nil {
		t.Error("result should contain error from panic")
	}
}

// TestHookChain tests hook chain execution
func TestHookChain(t *testing.T) {
	var order []string

	hook1 := NewHookFunc(HookConfig{
		ID:         "hook-1",
		Name:       "Hook 1",
		EventTypes: []EventType{EventBeforeAnalysis},
		Priority:   PriorityHigh,
		Enabled:    true,
	}, func(ctx context.Context, event *Event) *HookResult {
		order = append(order, "hook-1")
		return NewHookResult()
	})

	hook2 := NewHookFunc(HookConfig{
		ID:         "hook-2",
		Name:       "Hook 2",
		EventTypes: []EventType{EventBeforeAnalysis},
		Priority:   PriorityNormal,
		Enabled:    true,
	}, func(ctx context.Context, event *Event) *HookResult {
		order = append(order, "hook-2")
		return NewHookResult()
	})

	chain := NewHookChain(hook1, hook2)
	event := NewEvent(EventBeforeAnalysis, "test", &BasePayload{})
	chain.Execute(context.Background(), event)

	// Higher priority should execute first
	if len(order) != 2 {
		t.Fatalf("expected 2 hooks executed, got %d", len(order))
	}
	if order[0] != "hook-1" || order[1] != "hook-2" {
		t.Errorf("wrong execution order: %v", order)
	}
}

// TestMiddleware tests middleware functionality
func TestMiddleware(t *testing.T) {
	logger := zap.NewNop()
	registry := NewRegistry(RegistryConfig{Logger: logger})

	var middlewareCalled bool
	middleware := func(next HookExecutor) HookExecutor {
		return func(ctx context.Context, event *Event) *HookResult {
			middlewareCalled = true
			return next(ctx, event)
		}
	}

	registry.AddMiddleware(middleware)

	executor := NewExecutor(ExecutorConfig{
		Registry: registry,
		Logger:   logger,
	})

	hook, _ := NewHookBuilder().
		WithID("test-hook").
		WithName("Test Hook").
		WithEvents(EventBeforeAnalysis).
		WithHandler(func(ctx context.Context, event *Event) *HookResult {
			return NewHookResult()
		}).
		Build()

	registry.Register(hook)

	event := NewEvent(EventBeforeAnalysis, "test", &BasePayload{})
	executor.Execute(context.Background(), event)

	if !middlewareCalled {
		t.Error("middleware should have been called")
	}
}

// TestPanicRecoveryMiddleware tests panic recovery middleware
func TestPanicRecoveryMiddleware(t *testing.T) {
	logger := zap.NewNop()

	var panicValue interface{}
	middleware := PanicRecoveryMiddleware(logger, func(recovery interface{}, event *Event) {
		panicValue = recovery
	})

	executor := middleware(func(ctx context.Context, event *Event) *HookResult {
		panic("test panic")
	})

	result := executor(context.Background(), NewEvent(EventBeforeAnalysis, "test", &BasePayload{}))

	if panicValue != "test panic" {
		t.Errorf("panic handler should have been called with 'test panic', got %v", panicValue)
	}
	if result.Error == nil {
		t.Error("result should contain error")
	}
}

// TestCircuitBreaker tests circuit breaker functionality
func TestCircuitBreaker(t *testing.T) {
	breaker := NewDefaultCircuitBreaker(3, 2, 1*time.Second)

	eventType := EventBeforeAnalysis

	// Should be closed initially
	if breaker.State(eventType) != CircuitStateClosed {
		t.Error("circuit should be closed initially")
	}

	// Record failures
	for i := 0; i < 3; i++ {
		breaker.RecordFailure(eventType)
	}

	// Should be open after threshold
	if breaker.State(eventType) != CircuitStateOpen {
		t.Error("circuit should be open after failure threshold")
	}

	// Should not allow requests when open
	if breaker.Allow(eventType) {
		t.Error("should not allow requests when circuit is open")
	}

	// Wait for timeout
	time.Sleep(1100 * time.Millisecond)

	// Should transition to half-open after timeout
	if breaker.Allow(eventType) {
		if breaker.State(eventType) != CircuitStateHalfOpen {
			t.Error("circuit should be half-open after timeout")
		}
	}

	// Record successes to close
	breaker.RecordSuccess(eventType)
	breaker.RecordSuccess(eventType)

	if breaker.State(eventType) != CircuitStateClosed {
		t.Error("circuit should be closed after success threshold")
	}
}

// TestRateLimiter tests rate limiting
func TestRateLimiter(t *testing.T) {
	limiter := NewTokenBucketLimiter(2, 2) // 2 RPS, burst of 2

	eventType := EventBeforeAnalysis

	// Should allow burst
	if !limiter.Allow(eventType) {
		t.Error("first request should be allowed")
	}
	if !limiter.Allow(eventType) {
		t.Error("second request should be allowed")
	}

	// Should be rate limited after burst
	if limiter.Allow(eventType) {
		t.Error("third request should be rate limited")
	}

	// Reset
	limiter.Reset(eventType)

	// Should allow after reset
	if !limiter.Allow(eventType) {
		t.Error("request should be allowed after reset")
	}
}

// TestTradeProposalPayload tests trade proposal payload validation
func TestTradeProposalPayload(t *testing.T) {
	validPayload := &TradeProposalPayload{
		ProposalID: "prop-123",
		Symbol:     "AAPL",
		Side:       "buy",
		Quantity:   "100",
		Price:      "150.00",
		Strategy:   "momentum",
		Confidence: 0.85,
		RiskScore:  0.3,
	}

	if err := validPayload.Validate(); err != nil {
		t.Errorf("valid payload should pass validation: %v", err)
	}

	invalidPayload := &TradeProposalPayload{
		ProposalID: "",
		Symbol:     "AAPL",
		Side:       "invalid",
		Confidence: 1.5,
		RiskScore:  -0.1,
	}

	if err := invalidPayload.Validate(); err == nil {
		t.Error("invalid payload should fail validation")
	}
}

// TestEventMatchPattern tests event pattern matching
func TestEventMatchPattern(t *testing.T) {
	tests := []struct {
		pattern   EventType
		eventType EventType
		expected  bool
	}{
		{"before.*", EventBeforeAnalysis, true},
		{"before.*", EventBeforeDataFetch, true},
		{"before.*", EventAfterAnalysis, false},
		{"*.analysis", EventBeforeAnalysis, false}, // Not supported pattern
		{"before.analysis", EventBeforeAnalysis, true},
	}

	for _, test := range tests {
		result := MatchEventType(test.pattern, test.eventType)
		if result != test.expected {
			t.Errorf("MatchEventType(%s, %s) = %v, expected %v",
				test.pattern, test.eventType, result, test.expected)
		}
	}
}

// TestBackoffStrategies tests backoff strategies
func TestBackoffStrategies(t *testing.T) {
	// Exponential backoff
	expBackoff := NewExponentialBackoff(100*time.Millisecond, 5*time.Second)

	delays := []time.Duration{
		expBackoff.Delay(0),
		expBackoff.Delay(1),
		expBackoff.Delay(2),
	}

	for i := 1; i < len(delays); i++ {
		if delays[i] <= delays[i-1] {
			t.Errorf("exponential backoff should increase: %v", delays)
			break
		}
	}

	// Linear backoff
	linBackoff := NewLinearBackoff(100*time.Millisecond, 1*time.Second)

	if linBackoff.Delay(0) != 100*time.Millisecond {
		t.Errorf("linear backoff delay(0) should be 100ms")
	}
	if linBackoff.Delay(5) != 600*time.Millisecond {
		t.Errorf("linear backoff delay(5) should be 600ms")
	}

	// Constant backoff
	constBackoff := NewConstantBackoff(200 * time.Millisecond)

	if constBackoff.Delay(0) != 200*time.Millisecond {
		t.Errorf("constant backoff should always return 200ms")
	}
	if constBackoff.Delay(10) != 200*time.Millisecond {
		t.Errorf("constant backoff should always return 200ms")
	}
}

// TestBatchExecutor tests batch execution
func TestBatchExecutor(t *testing.T) {
	logger := zap.NewNop()
	registry := NewRegistry(RegistryConfig{Logger: logger})
	executor := NewExecutor(ExecutorConfig{
		Registry: registry,
		Logger:   logger,
	})

	batchExecutor := NewBatchExecutor(BatchExecutorConfig{
		Executor:  executor,
		Workers:   2,
		QueueSize: 10,
	})

	events := make([]*Event, 5)
	for i := 0; i < 5; i++ {
		events[i] = NewEvent(EventBeforeAnalysis, fmt.Sprintf("test-%d", i), &BasePayload{})
	}

	result := batchExecutor.ExecuteBatch(context.Background(), events)

	if len(result.Results) != 5 {
		t.Errorf("expected 5 results, got %d", len(result.Results))
	}
}

// TestHookScheduler tests hook scheduling
func TestHookScheduler(t *testing.T) {
	logger := zap.NewNop()
	registry := NewRegistry(RegistryConfig{Logger: logger})
	executor := NewExecutor(ExecutorConfig{
		Registry: registry,
		Logger:   logger,
	})

	scheduler := NewHookScheduler(executor, logger)

	event := NewEvent(EventBeforeAnalysis, "scheduled", &BasePayload{})

	err := scheduler.Schedule("test-schedule", event, 100*time.Millisecond, WithMaxRuns(2))
	if err != nil {
		t.Fatalf("failed to schedule: %v", err)
	}

	scheduler.Start()
	defer scheduler.Stop()

	// Wait for executions
	time.Sleep(300 * time.Millisecond)

	// Verify scheduled hook was removed after max runs
	scheduler.mu.RLock()
	_, exists := scheduler.scheduled["test-schedule"]
	scheduler.mu.RUnlock()

	if exists {
		t.Error("scheduled hook should be removed after max runs")
	}
}

// TestHookInfo tests hook info retrieval
func TestHookInfo(t *testing.T) {
	logger := zap.NewNop()
	registry := NewRegistry(RegistryConfig{Logger: logger})

	hook, _ := NewHookBuilder().
		WithID("info-test-hook").
		WithName("Info Test Hook").
		WithDescription("Test hook for info retrieval").
		WithEvents(EventBeforeAnalysis, EventAfterAnalysis).
		WithPriority(PriorityHigh).
		WithHandler(func(ctx context.Context, event *Event) *HookResult {
			return NewHookResult()
		}).
		Build()

	registry.RegisterWithPlugin(hook, "test-plugin")

	info, ok := registry.GetHookInfo("info-test-hook")
	if !ok {
		t.Fatal("hook info should be found")
	}

	if info.ID != "info-test-hook" {
		t.Errorf("expected ID info-test-hook, got %s", info.ID)
	}
	if info.Name != "Info Test Hook" {
		t.Errorf("expected name 'Info Test Hook', got %s", info.Name)
	}
	if info.Plugin != "test-plugin" {
		t.Errorf("expected plugin test-plugin, got %s", info.Plugin)
	}
	if info.Priority != int(PriorityHigh) {
		t.Errorf("expected priority %d, got %d", PriorityHigh, info.Priority)
	}
	if len(info.EventTypes) != 2 {
		t.Errorf("expected 2 event types, got %d", len(info.EventTypes))
	}
}

// BenchmarkHookExecution benchmarks hook execution
func BenchmarkHookExecution(b *testing.B) {
	logger := zap.NewNop()
	registry := NewRegistry(RegistryConfig{Logger: logger})
	executor := NewExecutor(ExecutorConfig{
		Registry: registry,
		Logger:   logger,
	})

	hook, _ := NewHookBuilder().
		WithID("bench-hook").
		WithName("Benchmark Hook").
		WithEvents(EventBeforeAnalysis).
		WithHandler(func(ctx context.Context, event *Event) *HookResult {
			return NewHookResult()
		}).
		Build()

	registry.Register(hook)

	event := NewEvent(EventBeforeAnalysis, "benchmark", &BasePayload{})
	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		executor.Execute(ctx, event)
	}
}

// BenchmarkRegistryRegister benchmarks hook registration
func BenchmarkRegistryRegister(b *testing.B) {
	logger := zap.NewNop()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		registry := NewRegistry(RegistryConfig{Logger: logger})
		hook, _ := NewHookBuilder().
			WithID(fmt.Sprintf("bench-hook-%d", i)).
			WithName("Benchmark Hook").
			WithEvents(EventBeforeAnalysis).
			WithHandler(func(ctx context.Context, event *Event) *HookResult {
				return NewHookResult()
			}).
			Build()
		registry.Register(hook)
	}
}
