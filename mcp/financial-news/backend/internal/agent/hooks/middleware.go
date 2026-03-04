package hooks

import (
	"context"
	"fmt"
	"time"

	"go.uber.org/zap"
)

// Middleware provides common hook middlewares for the OmniTrade agent system.
// Middlewares wrap hook execution to add cross-cutting concerns like
// logging, metrics, panic recovery, rate limiting, and circuit breaking.

// LoggingMiddleware creates a middleware that logs hook executions
func LoggingMiddleware(logger *zap.Logger) HookMiddleware {
	return func(next HookExecutor) HookExecutor {
		return func(ctx context.Context, event *Event) *HookResult {
			start := time.Now()

			logger.Debug("hook execution started",
				zap.String("event_id", event.ID),
				zap.String("event_type", string(event.Type)),
				zap.String("source", event.Source),
			)

			result := next(ctx, event)

			logger.Info("hook execution completed",
				zap.String("event_id", event.ID),
				zap.String("event_type", string(event.Type)),
				zap.Duration("duration", time.Since(start)),
				zap.Bool("proceed", result.Proceed),
				zap.Bool("has_error", result.Error != nil),
				zap.Bool("event_modified", result.ModifiedEvent != nil),
			)

			return result
		}
	}
}

// MetricsMiddleware creates a middleware that collects metrics
func MetricsMiddleware(collector MetricsCollector) HookMiddleware {
	return func(next HookExecutor) HookExecutor {
		return func(ctx context.Context, event *Event) *HookResult {
			start := time.Now()

			result := next(ctx, event)

			duration := time.Since(start)

			// Record metrics
			collector.RecordHookExecution(
				string(event.Type),
				duration,
				result.Error != nil,
			)

			return result
		}
	}
}

// MetricsCollector is the interface for metrics collection
type MetricsCollector interface {
	RecordHookExecution(eventType string, duration time.Duration, hasError bool)
	RecordHookPanic(eventType string)
	RecordHookTimeout(eventType string)
	RecordHookRetry(eventType string)
}

// PanicRecoveryMiddleware creates a middleware that recovers from panics
func PanicRecoveryMiddleware(logger *zap.Logger, onPanic func(recovery interface{}, event *Event)) HookMiddleware {
	return func(next HookExecutor) HookExecutor {
		return func(ctx context.Context, event *Event) (result *HookResult) {
			defer func() {
				if recovery := recover(); recovery != nil {
					logger.Error("panic recovered in hook middleware",
						zap.String("event_id", event.ID),
						zap.String("event_type", string(event.Type)),
						zap.Any("panic", recovery),
					)

					if onPanic != nil {
						onPanic(recovery, event)
					}

					result = &HookResult{
						Proceed: true,
						Error:   fmt.Errorf("panic recovered: %v", recovery),
						Metadata: map[string]interface{}{
							"panic":   recovery,
							"recovered": true,
						},
					}
				}
			}()

			return next(ctx, event)
		}
	}
}

// TimeoutMiddleware creates a middleware that enforces timeouts
func TimeoutMiddleware(defaultTimeout time.Duration, logger *zap.Logger) HookMiddleware {
	return func(next HookExecutor) HookExecutor {
		return func(ctx context.Context, event *Event) *HookResult {
			// Create timeout context
			timeoutCtx, cancel := context.WithTimeout(ctx, defaultTimeout)
			defer cancel()

			// Channel to receive result
			resultCh := make(chan *HookResult, 1)

			go func() {
				resultCh <- next(timeoutCtx, event)
			}()

			select {
			case result := <-resultCh:
				return result
			case <-timeoutCtx.Done():
				logger.Warn("hook execution timed out",
					zap.String("event_id", event.ID),
					zap.Duration("timeout", defaultTimeout),
				)

				return &HookResult{
					Proceed: true,
					Error:   fmt.Errorf("hook execution timed out after %v", defaultTimeout),
					Metadata: map[string]interface{}{
						"timeout":     defaultTimeout.String(),
						"timed_out":   true,
					},
				}
			}
		}
	}
}

// RetryMiddleware creates a middleware that retries failed executions
func RetryMiddleware(maxRetries int, backoff BackoffStrategy, logger *zap.Logger) HookMiddleware {
	return func(next HookExecutor) HookExecutor {
		return func(ctx context.Context, event *Event) *HookResult {
			var result *HookResult

			for attempt := 0; attempt <= maxRetries; attempt++ {
				result = next(ctx, event)

				if result.Error == nil {
					return result
				}

				// Check if error is retryable
				if !isRetryable(result.Error) {
					return result
				}

				// Check context
				if ctx.Err() != nil {
					result.Error = ctx.Err()
					return result
				}

				// Wait before retry
				if attempt < maxRetries {
					delay := backoff.Delay(attempt)
					logger.Debug("retrying hook execution",
						zap.String("event_id", event.ID),
						zap.Int("attempt", attempt+1),
						zap.Duration("delay", delay),
						zap.Error(result.Error),
					)

					select {
					case <-time.After(delay):
					case <-ctx.Done():
						result.Error = ctx.Err()
						return result
					}
				}
			}

			return result
		}
	}
}

// BackoffStrategy defines the backoff strategy for retries
type BackoffStrategy interface {
	Delay(attempt int) time.Duration
}

// ExponentialBackoff implements exponential backoff
type ExponentialBackoff struct {
	InitialDelay time.Duration
	MaxDelay     time.Duration
	Multiplier   float64
}

// NewExponentialBackoff creates a new exponential backoff
func NewExponentialBackoff(initial, max time.Duration) *ExponentialBackoff {
	return &ExponentialBackoff{
		InitialDelay: initial,
		MaxDelay:     max,
		Multiplier:   2.0,
	}
}

// Delay calculates the delay for the given attempt
func (b *ExponentialBackoff) Delay(attempt int) time.Duration {
	delay := b.InitialDelay
	for i := 0; i < attempt; i++ {
		delay = time.Duration(float64(delay) * b.Multiplier)
		if delay > b.MaxDelay {
			return b.MaxDelay
		}
	}
	return delay
}

// LinearBackoff implements linear backoff
type LinearBackoff struct {
	Delay    time.Duration
	MaxDelay time.Duration
}

// NewLinearBackoff creates a new linear backoff
func NewLinearBackoff(delay, max time.Duration) *LinearBackoff {
	return &LinearBackoff{
		Delay:    delay,
		MaxDelay: max,
	}
}

// Delay calculates the delay for the given attempt
func (b *LinearBackoff) Delay(attempt int) time.Duration {
	delay := time.Duration(attempt+1) * b.Delay
	if delay > b.MaxDelay {
		return b.MaxDelay
	}
	return delay
}

// ConstantBackoff implements constant backoff
type ConstantBackoff struct {
	Delay time.Duration
}

// NewConstantBackoff creates a new constant backoff
func NewConstantBackoff(delay time.Duration) *ConstantBackoff {
	return &ConstantBackoff{Delay: delay}
}

// Delay returns the constant delay
func (b *ConstantBackoff) Delay(attempt int) time.Duration {
	return b.Delay
}

// isRetryable determines if an error is retryable
func isRetryable(err error) bool {
	if err == nil {
		return false
	}

	// Context errors are not retryable
	if err == context.Canceled || err == context.DeadlineExceeded {
		return false
	}

	return true
}

// RateLimitMiddleware creates a middleware that rate limits hook executions
func RateLimitMiddleware(limiter RateLimiter, logger *zap.Logger) HookMiddleware {
	return func(next HookExecutor) HookExecutor {
		return func(ctx context.Context, event *Event) *HookResult {
			if !limiter.Allow(event.Type) {
				logger.Warn("hook rate limited",
					zap.String("event_id", event.ID),
					zap.String("event_type", string(event.Type)),
				)

				return &HookResult{
					Proceed: true,
					Error:   fmt.Errorf("rate limit exceeded for event type %s", event.Type),
					Metadata: map[string]interface{}{
						"rate_limited": true,
					},
				}
			}

			return next(ctx, event)
		}
	}
}

// RateLimiter is the interface for rate limiting
type RateLimiter interface {
	Allow(eventType EventType) bool
	Reset(eventType EventType)
}

// TokenBucketLimiter implements token bucket rate limiting
type TokenBucketLimiter struct {
	tokens     map[EventType]*tokenBucket
	defaultRPS int
	burstSize  int
}

type tokenBucket struct {
	tokens     float64
	maxTokens  float64
	refillRate float64 // tokens per second
	lastRefill time.Time
}

// NewTokenBucketLimiter creates a new token bucket rate limiter
func NewTokenBucketLimiter(defaultRPS, burstSize int) *TokenBucketLimiter {
	return &TokenBucketLimiter{
		tokens:     make(map[EventType]*tokenBucket),
		defaultRPS: defaultRPS,
		burstSize:  burstSize,
	}
}

// Allow checks if a request is allowed
func (l *TokenBucketLimiter) Allow(eventType EventType) bool {
	bucket, ok := l.tokens[eventType]
	if !ok {
		bucket = &tokenBucket{
			tokens:     float64(l.burstSize),
			maxTokens:  float64(l.burstSize),
			refillRate: float64(l.defaultRPS),
			lastRefill: time.Now(),
		}
		l.tokens[eventType] = bucket
	}

	// Refill tokens
	now := time.Now()
	elapsed := now.Sub(bucket.lastRefill).Seconds()
	bucket.tokens += elapsed * bucket.refillRate
	if bucket.tokens > bucket.maxTokens {
		bucket.tokens = bucket.maxTokens
	}
	bucket.lastRefill = now

	// Check if we have tokens
	if bucket.tokens >= 1 {
		bucket.tokens--
		return true
	}

	return false
}

// Reset resets the rate limiter for an event type
func (l *TokenBucketLimiter) Reset(eventType EventType) {
	delete(l.tokens, eventType)
}

// CircuitBreakerMiddleware creates a middleware that implements circuit breaker pattern
func CircuitBreakerMiddleware(breaker CircuitBreaker, logger *zap.Logger) HookMiddleware {
	return func(next HookExecutor) HookExecutor {
		return func(ctx context.Context, event *Event) *HookResult {
			if !breaker.Allow(event.Type) {
				logger.Warn("circuit breaker open",
					zap.String("event_id", event.ID),
					zap.String("event_type", string(event.Type)),
				)

				return &HookResult{
					Proceed: true,
					Error:   fmt.Errorf("circuit breaker open for event type %s", event.Type),
					Metadata: map[string]interface{}{
						"circuit_breaker_open": true,
					},
				}
			}

			result := next(ctx, event)

			if result.Error != nil {
				breaker.RecordFailure(event.Type)
			} else {
				breaker.RecordSuccess(event.Type)
			}

			return result
		}
	}
}

// CircuitBreaker is the interface for circuit breaker
type CircuitBreaker interface {
	Allow(eventType EventType) bool
	RecordSuccess(eventType EventType)
	RecordFailure(eventType EventType)
	State(eventType EventType) CircuitState
}

// CircuitState represents the state of a circuit breaker
type CircuitState int

const (
	CircuitStateClosed CircuitState = iota
	CircuitStateOpen
	CircuitStateHalfOpen
)

func (s CircuitState) String() string {
	switch s {
	case CircuitStateClosed:
		return "closed"
	case CircuitStateOpen:
		return "open"
	case CircuitStateHalfOpen:
		return "half-open"
	default:
		return "unknown"
	}
}

// DefaultCircuitBreaker implements a basic circuit breaker
type DefaultCircuitBreaker struct {
	circuits        map[EventType]*circuit
	failureThreshold  int
	successThreshold  int
	timeout           time.Duration
}

type circuit struct {
	state           CircuitState
	failures        int
	successes       int
	lastFailureTime time.Time
}

// NewDefaultCircuitBreaker creates a new circuit breaker
func NewDefaultCircuitBreaker(failureThreshold, successThreshold int, timeout time.Duration) *DefaultCircuitBreaker {
	return &DefaultCircuitBreaker{
		circuits:        make(map[EventType]*circuit),
		failureThreshold: failureThreshold,
		successThreshold: successThreshold,
		timeout:          timeout,
	}
}

// Allow checks if requests are allowed
func (cb *DefaultCircuitBreaker) Allow(eventType EventType) bool {
	c, ok := cb.circuits[eventType]
	if !ok {
		cb.circuits[eventType] = &circuit{state: CircuitStateClosed}
		return true
	}

	switch c.state {
	case CircuitStateClosed:
		return true
	case CircuitStateOpen:
		// Check if timeout has passed
		if time.Since(c.lastFailureTime) > cb.timeout {
			c.state = CircuitStateHalfOpen
			c.failures = 0
			c.successes = 0
			return true
		}
		return false
	case CircuitStateHalfOpen:
		return true
	}

	return false
}

// RecordSuccess records a successful execution
func (cb *DefaultCircuitBreaker) RecordSuccess(eventType EventType) {
	c, ok := cb.circuits[eventType]
	if !ok {
		return
	}

	c.failures = 0
	c.successes++

	if c.state == CircuitStateHalfOpen && c.successes >= cb.successThreshold {
		c.state = CircuitStateClosed
		c.successes = 0
	}
}

// RecordFailure records a failed execution
func (cb *DefaultCircuitBreaker) RecordFailure(eventType EventType) {
	c, ok := cb.circuits[eventType]
	if !ok {
		return
	}

	c.successes = 0
	c.failures++
	c.lastFailureTime = time.Now()

	if c.failures >= cb.failureThreshold {
		c.state = CircuitStateOpen
	}
}

// State returns the current state
func (cb *DefaultCircuitBreaker) State(eventType EventType) CircuitState {
	if c, ok := cb.circuits[eventType]; ok {
		return c.state
	}
	return CircuitStateClosed
}

// ValidationMiddleware creates a middleware that validates events
func ValidationMiddleware(logger *zap.Logger) HookMiddleware {
	return func(next HookExecutor) HookExecutor {
		return func(ctx context.Context, event *Event) *HookResult {
			if event == nil {
				return &HookResult{
					Proceed: false,
					Error:   fmt.Errorf("event cannot be nil"),
				}
			}

			if event.Type == "" {
				return &HookResult{
					Proceed: false,
					Error:   fmt.Errorf("event type cannot be empty"),
				}
			}

			if event.Payload != nil {
				if err := event.Payload.Validate(); err != nil {
					return &HookResult{
						Proceed: false,
						Error:   fmt.Errorf("payload validation failed: %w", err),
					}
				}
			}

			return next(ctx, event)
		}
	}
}

// TracingMiddleware creates a middleware that adds tracing
func TracingMiddleware(tracer Tracer) HookMiddleware {
	return func(next HookExecutor) HookExecutor {
		return func(ctx context.Context, event *Event) *HookResult {
			span := tracer.StartSpan(ctx, string(event.Type))
			defer span.Finish()

			span.SetTag("event.id", event.ID)
			span.SetTag("event.source", event.Source)
			span.SetTag("event.category", string(event.Category))

			result := next(ctx, event)

			if result.Error != nil {
				span.SetTag("error", true)
				span.SetTag("error.message", result.Error.Error())
			}

			return result
		}
	}
}

// Tracer is the interface for tracing
type Tracer interface {
	StartSpan(ctx context.Context, name string) Span
}

// Span is the interface for a trace span
type Span interface {
	Finish()
	SetTag(key string, value interface{})
	SetError(err error)
}

// CancellationMiddleware creates a middleware that checks for cancellation
func CancellationMiddleware(logger *zap.Logger) HookMiddleware {
	return func(next HookExecutor) HookExecutor {
		return func(ctx context.Context, event *Event) *HookResult {
			select {
			case <-ctx.Done():
				logger.Debug("hook execution cancelled",
					zap.String("event_id", event.ID),
					zap.Error(ctx.Err()),
				)

				return &HookResult{
					Proceed: false,
					Error:   ctx.Err(),
					Metadata: map[string]interface{}{
						"cancelled": true,
					},
				}
			default:
				return next(ctx, event)
			}
		}
	}
}

// AuditingMiddleware creates a middleware that audits hook executions
func AuditingMiddleware(auditor Auditor, logger *zap.Logger) HookMiddleware {
	return func(next HookExecutor) HookExecutor {
		return func(ctx context.Context, event *Event) *HookResult {
			start := time.Now()

			result := next(ctx, event)

			// Create audit entry
			entry := AuditEntry{
				EventID:    event.ID,
				EventType:  string(event.Type),
				Source:     event.Source,
				Timestamp:  start,
				Duration:   time.Since(start),
				Success:    result.Error == nil,
				Error:      "",
				Proceed:    result.Proceed,
			}

			if result.Error != nil {
				entry.Error = result.Error.Error()
			}

			if err := auditor.Record(entry); err != nil {
				logger.Error("failed to record audit entry",
					zap.String("event_id", event.ID),
					zap.Error(err),
				)
			}

			return result
		}
	}
}

// Auditor is the interface for auditing
type Auditor interface {
	Record(entry AuditEntry) error
}

// AuditEntry represents an audit log entry
type AuditEntry struct {
	EventID   string        `json:"event_id"`
	EventType string        `json:"event_type"`
	Source    string        `json:"source"`
	Timestamp time.Time     `json:"timestamp"`
	Duration  time.Duration `json:"duration"`
	Success   bool          `json:"success"`
	Error     string        `json:"error,omitempty"`
	Proceed   bool          `json:"proceed"`
}

// CachingMiddleware creates a middleware that caches hook results
func CachingMiddleware(cache HookCache, ttl time.Duration, logger *zap.Logger) HookMiddleware {
	return func(next HookExecutor) HookExecutor {
		return func(ctx context.Context, event *Event) *HookResult {
			// Generate cache key
			key := cacheKey(event)

			// Try to get from cache
			if cached, ok := cache.Get(key); ok {
				logger.Debug("hook result cache hit",
					zap.String("event_id", event.ID),
					zap.String("cache_key", key),
				)
				return cached
			}

			// Execute hook
			result := next(ctx, event)

			// Cache result if successful
			if result.Error == nil && result.Proceed {
				cache.Set(key, result, ttl)
			}

			return result
		}
	}
}

// HookCache is the interface for hook result caching
type HookCache interface {
	Get(key string) (*HookResult, bool)
	Set(key string, result *HookResult, ttl time.Duration)
	Delete(key string)
	Clear()
}

// cacheKey generates a cache key for an event
func cacheKey(event *Event) string {
	return fmt.Sprintf("%s:%s:%s", event.Type, event.Source, event.ID)
}

// Chain creates a middleware chain from multiple middlewares
func Chain(middlewares ...HookMiddleware) HookMiddleware {
	return func(final HookExecutor) HookExecutor {
		// Apply middlewares in reverse order
		for i := len(middlewares) - 1; i >= 0; i-- {
			final = middlewares[i](final)
		}
		return final
	}
}

// DefaultMiddlewares returns the default set of middlewares for OmniTrade
func DefaultMiddlewares(logger *zap.Logger, collector MetricsCollector) []HookMiddleware {
	return []HookMiddleware{
		ValidationMiddleware(logger),
		PanicRecoveryMiddleware(logger, nil),
		CancellationMiddleware(logger),
		LoggingMiddleware(logger),
		MetricsMiddleware(collector),
	}
}

// ProductionMiddlewares returns production-ready middlewares with circuit breaking
func ProductionMiddlewares(logger *zap.Logger, collector MetricsCollector) []HookMiddleware {
	breaker := NewDefaultCircuitBreaker(5, 3, 30*time.Second)
	limiter := NewTokenBucketLimiter(100, 20)

	return []HookMiddleware{
		ValidationMiddleware(logger),
		PanicRecoveryMiddleware(logger, nil),
		RateLimitMiddleware(limiter, logger),
		CircuitBreakerMiddleware(breaker, logger),
		CancellationMiddleware(logger),
		LoggingMiddleware(logger),
		MetricsMiddleware(collector),
		RetryMiddleware(2, NewExponentialBackoff(100*time.Millisecond, 5*time.Second), logger),
	}
}
