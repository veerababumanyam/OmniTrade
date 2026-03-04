package plugins

import (
	"context"
	"errors"
	"sync"
	"time"
)

// CircuitState represents the state of a circuit breaker
type CircuitState int

const (
	// StateClosed means the circuit is closed and operations proceed normally
	StateClosed CircuitState = iota
	// StateOpen means the circuit is open and operations are blocked
	StateOpen
	// StateHalfOpen means the circuit is testing if operations can resume
	StateHalfOpen
)

// String returns the string representation of the circuit state
func (s CircuitState) String() string {
	switch s {
	case StateClosed:
		return "closed"
	case StateOpen:
		return "open"
	case StateHalfOpen:
		return "half-open"
	default:
		return "unknown"
	}
}

// CircuitBreaker implements the circuit breaker pattern for plugin resilience
type CircuitBreaker struct {
	mu sync.RWMutex

	// Configuration
	config CircuitBreakerConfig

	// State
	state           CircuitState
	failureCount    int
	successCount    int
	lastFailureTime time.Time
	lastStateChange time.Time

	// Metrics
	totalCalls     int64
	totalFailures  int64
	totalSuccesses int64
	totalRejects   int64
}

// ErrCircuitOpen is returned when the circuit is open
var ErrCircuitOpen = NewPluginError(ErrCodeCircuitOpen, "circuit breaker is open", false)

// NewCircuitBreaker creates a new circuit breaker with the given configuration
func NewCircuitBreaker(config CircuitBreakerConfig) *CircuitBreaker {
	if config.Timeout == 0 {
		config.Timeout = 30 * time.Second
	}
	if config.FailureThreshold == 0 {
		config.FailureThreshold = 5
	}
	if config.SuccessThreshold == 0 {
		config.SuccessThreshold = 2
	}

	return &CircuitBreaker{
		config:          config,
		state:           StateClosed,
		lastStateChange: time.Now(),
	}
}

// Execute runs the given operation through the circuit breaker
func (cb *CircuitBreaker) Execute(ctx context.Context, operation func(ctx context.Context) error) error {
	if !cb.config.Enabled {
		return operation(ctx)
	}

	// Check if we can execute
	if err := cb.beforeCall(); err != nil {
		return err
	}

	// Execute the operation
	err := operation(ctx)

	// Record the result
	cb.afterCall(err)

	return err
}

// ExecuteWithResult runs the operation and returns a result
func (cb *CircuitBreaker) ExecuteWithResult(ctx context.Context, operation func(ctx context.Context) (interface{}, error)) (interface{}, error) {
	if !cb.config.Enabled {
		return operation(ctx)
	}

	// Check if we can execute
	if err := cb.beforeCall(); err != nil {
		return nil, err
	}

	// Execute the operation
	result, err := operation(ctx)

	// Record the result
	cb.afterCall(err)

	return result, err
}

// beforeCall checks if the call should be allowed
func (cb *CircuitBreaker) beforeCall() error {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	cb.totalCalls++

	switch cb.state {
	case StateClosed:
		return nil

	case StateOpen:
		// Check if timeout has elapsed
		if time.Since(cb.lastFailureTime) > cb.config.Timeout {
			cb.setState(StateHalfOpen)
			return nil
		}
		cb.totalRejects++
		return ErrCircuitOpen

	case StateHalfOpen:
		// Allow the call through to test
		return nil
	}

	return nil
}

// afterCall records the result of the call
func (cb *CircuitBreaker) afterCall(err error) {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	if err == nil {
		cb.onSuccess()
	} else {
		cb.onFailure()
	}
}

// onSuccess handles a successful call
func (cb *CircuitBreaker) onSuccess() {
	cb.totalSuccesses++
	cb.failureCount = 0

	if cb.state == StateHalfOpen {
		cb.successCount++
		if cb.successCount >= cb.config.SuccessThreshold {
			cb.setState(StateClosed)
		}
	}
}

// onFailure handles a failed call
func (cb *CircuitBreaker) onFailure() {
	cb.totalFailures++
	cb.lastFailureTime = time.Now()
	cb.successCount = 0

	switch cb.state {
	case StateClosed:
		cb.failureCount++
		if cb.failureCount >= cb.config.FailureThreshold {
			cb.setState(StateOpen)
		}

	case StateHalfOpen:
		cb.setState(StateOpen)
	}
}

// setState changes the circuit state
func (cb *CircuitBreaker) setState(state CircuitState) {
	if cb.state != state {
		cb.state = state
		cb.lastStateChange = time.Now()
		cb.successCount = 0
		if state == StateClosed {
			cb.failureCount = 0
		}
	}
}

// State returns the current circuit state
func (cb *CircuitBreaker) State() CircuitState {
	cb.mu.RLock()
	defer cb.mu.RUnlock()
	return cb.state
}

// Metrics returns current circuit breaker metrics
func (cb *CircuitBreaker) Metrics() CircuitMetrics {
	cb.mu.RLock()
	defer cb.mu.RUnlock()

	return CircuitMetrics{
		State:           cb.state.String(),
		FailureCount:    cb.failureCount,
		SuccessCount:    cb.successCount,
		TotalCalls:      cb.totalCalls,
		TotalFailures:   cb.totalFailures,
		TotalSuccesses:  cb.totalSuccesses,
		TotalRejects:    cb.totalRejects,
		LastFailureTime: cb.lastFailureTime,
		LastStateChange: cb.lastStateChange,
	}
}

// CircuitMetrics holds circuit breaker metrics
type CircuitMetrics struct {
	State           string        `json:"state"`
	FailureCount    int           `json:"failure_count"`
	SuccessCount    int           `json:"success_count"`
	TotalCalls      int64         `json:"total_calls"`
	TotalFailures   int64         `json:"total_failures"`
	TotalSuccesses  int64         `json:"total_successes"`
	TotalRejects    int64         `json:"total_rejects"`
	LastFailureTime time.Time     `json:"last_failure_time"`
	LastStateChange time.Time     `json:"last_state_change"`
	Config          CircuitBreakerConfig `json:"config"`
}

// Reset resets the circuit breaker to closed state
func (cb *CircuitBreaker) Reset() {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	cb.state = StateClosed
	cb.failureCount = 0
	cb.successCount = 0
	cb.lastStateChange = time.Now()
}

// Trip manually trips the circuit breaker
func (cb *CircuitBreaker) Trip() {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	cb.setState(StateOpen)
	cb.lastFailureTime = time.Now()
}

// CircuitBreakerMiddleware wraps a plugin with circuit breaker protection
type CircuitBreakerMiddleware struct {
	plugin Plugin
	cb     *CircuitBreaker
}

// NewCircuitBreakerMiddleware creates a new circuit breaker middleware
func NewCircuitBreakerMiddleware(plugin Plugin, config CircuitBreakerConfig) *CircuitBreakerMiddleware {
	return &CircuitBreakerMiddleware{
		plugin: plugin,
		cb:     NewCircuitBreaker(config),
	}
}

// Metadata returns plugin metadata
func (m *CircuitBreakerMiddleware) Metadata() PluginMetadata {
	return m.plugin.Metadata()
}

// Initialize initializes the plugin
func (m *CircuitBreakerMiddleware) Initialize(ctx *PluginContext, config PluginConfig) error {
	return m.cb.Execute(ctx.Context, func(_ context.Context) error {
		return m.plugin.Initialize(ctx, config)
	})
}

// Start starts the plugin
func (m *CircuitBreakerMiddleware) Start(ctx *PluginContext) error {
	return m.cb.Execute(ctx.Context, func(_ context.Context) error {
		return m.plugin.Start(ctx)
	})
}

// Stop stops the plugin
func (m *CircuitBreakerMiddleware) Stop(ctx *PluginContext) error {
	return m.cb.Execute(ctx.Context, func(_ context.Context) error {
		return m.plugin.Stop(ctx)
	})
}

// Shutdown shuts down the plugin
func (m *CircuitBreakerMiddleware) Shutdown(ctx *PluginContext) error {
	return m.cb.Execute(ctx.Context, func(_ context.Context) error {
		return m.plugin.Shutdown(ctx)
	})
}

// State returns the plugin state
func (m *CircuitBreakerMiddleware) State() PluginState {
	return m.plugin.State()
}

// Health checks plugin health
func (m *CircuitBreakerMiddleware) Health(ctx *PluginContext) (*PluginResult, error) {
	result, err := m.cb.ExecuteWithResult(ctx.Context, func(_ context.Context) (interface{}, error) {
		return m.plugin.Health(ctx)
	})
	if err != nil {
		return nil, err
	}
	return result.(*PluginResult), nil
}

// Execute executes the plugin
func (m *CircuitBreakerMiddleware) Execute(ctx *PluginContext, input interface{}) (*PluginResult, error) {
	result, err := m.cb.ExecuteWithResult(ctx.Context, func(_ context.Context) (interface{}, error) {
		return m.plugin.Execute(ctx, input)
	})
	if err != nil {
		if errors.Is(err, ErrCircuitOpen) {
			return nil, err
		}
		return nil, err
	}
	return result.(*PluginResult), nil
}

// CircuitBreaker returns the underlying circuit breaker
func (m *CircuitBreakerMiddleware) CircuitBreaker() *CircuitBreaker {
	return m.cb
}

// RetryConfig holds retry configuration
type RetryConfig struct {
	// MaxAttempts is the maximum number of retry attempts
	MaxAttempts int
	// InitialDelay is the initial backoff delay
	InitialDelay time.Duration
	// MaxDelay is the maximum backoff delay
	MaxDelay time.Duration
	// Multiplier for exponential backoff
	Multiplier float64
	// RetryableErrors is a list of error codes that should trigger retries
	RetryableErrors []string
}

// DefaultRetryConfig returns a default retry configuration
func DefaultRetryConfig() RetryConfig {
	return RetryConfig{
		MaxAttempts:     3,
		InitialDelay:    100 * time.Millisecond,
		MaxDelay:        5 * time.Second,
		Multiplier:      2.0,
		RetryableErrors: []string{ErrCodeTimeout, ErrCodeInternal, ErrCodeNotAvailable},
	}
}

// IsRetryable checks if an error is retryable
func (c RetryConfig) IsRetryable(err error) bool {
	if err == nil {
		return false
	}

	var pluginErr *PluginError
	if errors.As(err, &pluginErr) {
		if !pluginErr.Retryable {
			return false
		}

		// Check if error code is in retryable list
		for _, code := range c.RetryableErrors {
			if pluginErr.Code == code {
				return true
			}
		}
	}

	return false
}

// CalculateDelay calculates the backoff delay for a given attempt
func (c RetryConfig) CalculateDelay(attempt int) time.Duration {
	delay := time.Duration(float64(c.InitialDelay) * float64(uint64(1)<<uint(attempt)))
	if delay > c.MaxDelay {
		delay = c.MaxDelay
	}
	return delay
}
