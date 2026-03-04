// Package example_hooks demonstrates how to create hooks for the OmniTrade agent system.
// This example shows different hook patterns including:
// - Validation hooks
// - Audit hooks
// - Rate limiting hooks
// - Transformation hooks
// - Notification hooks
package example_hooks

import (
	"context"
	"fmt"
	"regexp"
	"time"

	"github.com/omnitrade/backend/internal/agent/hooks"
	"go.uber.org/zap"
)

// =============================================================================
// Example 1: Trade Proposal Validation Hook
// =============================================================================

// TradeProposalValidationHook validates trade proposals before they are submitted
type TradeProposalValidationHook struct {
	hooks.BaseHook
	minConfidence float64
	maxRiskLevel  RiskLevel
	logger        *zap.Logger
}

// RiskLevel represents risk levels
type RiskLevel int

const (
	RiskLow RiskLevel = iota
	RiskMedium
	RiskHigh
	RiskCritical
)

// NewTradeProposalValidationHook creates a new validation hook
func NewTradeProposalValidationHook(minConfidence float64, maxRiskLevel RiskLevel, logger *zap.Logger) *TradeProposalValidationHook {
	return &TradeProposalValidationHook{
		BaseHook: hooks.BaseHook{
			Config: hooks.HookConfig{
				ID:          "trade_proposal_validation",
				Name:        "Trade Proposal Validation",
				Description: "Validates trade proposals before submission",
				EventTypes: []hooks.EventType{
					hooks.EventBeforeTradeProposal,
				},
				Priority: hooks.PriorityHigh,
				Timeout:  5 * time.Second,
				Enabled:  true,
			},
		},
		minConfidence: minConfidence,
		maxRiskLevel:  maxRiskLevel,
		logger:        logger,
	}
}

// Execute validates the trade proposal
func (h *TradeProposalValidationHook) Execute(ctx context.Context, event *hooks.Event) *hooks.HookResult {
	// Extract trade proposal from payload
	proposal, ok := event.Payload.(*TradeProposalPayload)
	if !ok {
		return hooks.ErrorResult(fmt.Errorf("expected TradeProposalPayload"))
	}

	// Validate confidence
	if proposal.Confidence < h.minConfidence {
		h.logger.Warn("trade proposal rejected: confidence below threshold",
			zap.String("symbol", proposal.Symbol),
			zap.Float64("confidence", proposal.Confidence),
			zap.Float64("min_required", h.minConfidence),
		)

		return &hooks.HookResult{
			Proceed: false,
			Error:   fmt.Errorf("confidence %.2f below minimum %.2f", proposal.Confidence, h.minConfidence),
			Metadata: map[string]interface{}{
				"rejection_reason": "low_confidence",
			},
		}
	}

	// Validate risk level
	if proposal.RiskLevel > h.maxRiskLevel {
		h.logger.Warn("trade proposal rejected: risk level exceeded",
			zap.String("symbol", proposal.Symbol),
			zap.Int("risk_level", int(proposal.RiskLevel)),
			zap.Int("max_allowed", int(h.maxRiskLevel)),
		)

		return &hooks.HookResult{
			Proceed: false,
			Error:   fmt.Errorf("risk level %d exceeds maximum %d", proposal.RiskLevel, h.maxRiskLevel),
			Metadata: map[string]interface{}{
				"rejection_reason": "high_risk",
			},
		}
	}

	// Validate symbol format
	matched, _ := regexp.MatchString(`^[A-Z]{1,5}$`, proposal.Symbol)
	if !matched {
		return &hooks.HookResult{
			Proceed: false,
			Error:   fmt.Errorf("invalid symbol format: %s", proposal.Symbol),
			Metadata: map[string]interface{}{
				"rejection_reason": "invalid_symbol",
			},
		}
	}

	// Validate side
	if proposal.Side != "buy" && proposal.Side != "sell" {
		return &hooks.HookResult{
			Proceed: false,
			Error:   fmt.Errorf("side must be 'buy' or 'sell', got: %s", proposal.Side),
			Metadata: map[string]interface{}{
				"rejection_reason": "invalid_side",
			},
		}
	}

	// Validate quantity
	if proposal.Quantity <= 0 {
		return &hooks.HookResult{
			Proceed: false,
			Error:   fmt.Errorf("quantity must be positive, got: %f", proposal.Quantity),
			Metadata: map[string]interface{}{
				"rejection_reason": "invalid_quantity",
			},
		}
	}

	h.logger.Info("trade proposal validated successfully",
		zap.String("symbol", proposal.Symbol),
		zap.String("side", proposal.Side),
		zap.Float64("quantity", proposal.Quantity),
		zap.Float64("confidence", proposal.Confidence),
	)

	return hooks.NewHookResult()
}

// TradeProposalPayload represents a trade proposal
type TradeProposalPayload struct {
	Symbol     string    `json:"symbol"`
	Side       string    `json:"side"`
	Quantity   float64   `json:"quantity"`
	Price      float64   `json:"price"`
	Confidence float64   `json:"confidence"`
	RiskLevel  RiskLevel `json:"risk_level"`
	Reasoning  string    `json:"reasoning"`
}

// =============================================================================
// Example 2: Audit Logging Hook
// =============================================================================

// AuditLoggingHook logs all events for audit purposes
type AuditLoggingHook struct {
	hooks.BaseHook
	auditLogger *AuditLogger
	logger      *zap.Logger
}

// AuditLogger handles audit log persistence
type AuditLogger struct {
	entries []AuditEntry
}

// AuditEntry represents an audit log entry
type AuditEntry struct {
	Timestamp   time.Time              `json:"timestamp"`
	EventType   hooks.EventType         `json:"event_type"`
	EventID     string                 `json:"event_id"`
	Source      string                 `json:"source"`
	UserID      string                 `json:"user_id,omitempty"`
	CorrelationID string               `json:"correlation_id,omitempty"`
	Success     bool                   `json:"success"`
	Duration    time.Duration          `json:"duration,omitempty"`
	Details     map[string]interface{} `json:"details,omitempty"`
}

// NewAuditLoggingHook creates a new audit logging hook
func NewAuditLoggingHook(auditLogger *AuditLogger, logger *zap.Logger) *AuditLoggingHook {
	return &AuditLoggingHook{
		BaseHook: hooks.BaseHook{
			Config: hooks.HookConfig{
				ID:          "audit_logging",
				Name:        "Audit Logging",
				Description: "Logs all events for audit purposes",
				EventTypes: []hooks.EventType{
					hooks.EventAfterAgentRun,
					hooks.EventAfterTradeProposal,
					hooks.EventAfterOrderSubmit,
					hooks.EventOnApprovalGranted,
					hooks.EventOnApprovalDenied,
				},
				Priority: hooks.PriorityMonitors, // Run first for observability
				Timeout:  2 * time.Second,
				Enabled:  true,
			},
		},
		auditLogger: auditLogger,
		logger:      logger,
	}
}

// Execute logs the event
func (h *AuditLoggingHook) Execute(ctx context.Context, event *hooks.Event) *hooks.HookResult {
	entry := AuditEntry{
		Timestamp:     time.Now().UTC(),
		EventType:     event.Type,
		EventID:       event.ID,
		Source:        event.Source,
		UserID:        event.UserID,
		CorrelationID: event.CorrelationID,
		Details:       make(map[string]interface{}),
	}

	// Extract relevant details based on event type
	switch event.Type {
	case hooks.EventAfterAgentRun:
		if payload, ok := event.Payload.(*AgentRunPayload); ok {
			entry.Success = payload.Success
			entry.Duration = payload.Duration
			entry.Details["agent_type"] = payload.AgentType
			entry.Details["confidence"] = payload.Confidence
		}

	case hooks.EventAfterTradeProposal:
		if payload, ok := event.Payload.(*TradeProposalPayload); ok {
			entry.Success = true
			entry.Details["symbol"] = payload.Symbol
			entry.Details["side"] = payload.Side
			entry.Details["quantity"] = payload.Quantity
		}

	case hooks.EventOnApprovalGranted:
		entry.Success = true
		entry.Details["approved"] = true

	case hooks.EventOnApprovalDenied:
		entry.Success = false
		entry.Details["approved"] = false
	}

	// Log to audit logger
	h.auditLogger.Log(entry)

	h.logger.Debug("audit entry logged",
		zap.String("event_type", string(event.Type)),
		zap.String("event_id", event.ID),
	)

	return hooks.NewHookResult()
}

// Log adds an entry to the audit log
func (al *AuditLogger) Log(entry AuditEntry) {
	al.entries = append(al.entries, entry)
}

// GetEntries returns all audit entries
func (al *AuditLogger) GetEntries() []AuditEntry {
	return al.entries
}

// AgentRunPayload represents agent run results
type AgentRunPayload struct {
	AgentType  string        `json:"agent_type"`
	Success    bool          `json:"success"`
	Duration   time.Duration `json:"duration"`
	Confidence float64       `json:"confidence"`
	Output     interface{}   `json:"output,omitempty"`
}

// =============================================================================
// Example 3: Rate Limiting Hook
// =============================================================================

// RateLimitingHook enforces rate limits on events
type RateLimitingHook struct {
	hooks.BaseHook
	limiter *RateLimiter
	logger  *zap.Logger
}

// RateLimiter implements token bucket rate limiting
type RateLimiter struct {
	tokens     map[hooks.EventType]*tokenBucket
	defaultRPS int
	burstSize  int
}

type tokenBucket struct {
	tokens     float64
	maxTokens  float64
	refillRate float64
	lastRefill time.Time
}

// NewRateLimitingHook creates a new rate limiting hook
func NewRateLimitingHook(limiter *RateLimiter, logger *zap.Logger) *RateLimitingHook {
	return &RateLimitingHook{
		BaseHook: hooks.BaseHook{
			Config: hooks.HookConfig{
				ID:          "rate_limiting",
				Name:        "Rate Limiting",
				Description: "Enforces rate limits on events",
				EventTypes: []hooks.EventType{
					hooks.EventBeforeDataFetch,
					hooks.EventBeforeAnalysis,
					hooks.EventBeforeAgentRun,
				},
				Priority: hooks.PriorityCritical, // Run before everything else
				Timeout:  1 * time.Second,
				Enabled:  true,
			},
		},
		limiter: limiter,
		logger:  logger,
	}
}

// Execute checks rate limits
func (h *RateLimitingHook) Execute(ctx context.Context, event *hooks.Event) *hooks.HookResult {
	if !h.limiter.Allow(event.Type) {
		h.logger.Warn("rate limit exceeded",
			zap.String("event_type", string(event.Type)),
			zap.String("event_id", event.ID),
		)

		return &hooks.HookResult{
			Proceed: true, // Allow but log
			Error:   fmt.Errorf("rate limit exceeded for event type %s", event.Type),
			Metadata: map[string]interface{}{
				"rate_limited": true,
			},
		}
	}

	return hooks.NewHookResult()
}

// Allow checks if a request is allowed
func (rl *RateLimiter) Allow(eventType hooks.EventType) bool {
	bucket, ok := rl.tokens[eventType]
	if !ok {
		return true // No limit configured
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

// =============================================================================
// Example 4: Event Transformation Hook
// =============================================================================

// EventTransformationHook transforms events before processing
type EventTransformationHook struct {
	hooks.BaseHook
	logger *zap.Logger
}

// NewEventTransformationHook creates a new transformation hook
func NewEventTransformationHook(logger *zap.Logger) *EventTransformationHook {
	return &EventTransformationHook{
		BaseHook: hooks.BaseHook{
			Config: hooks.HookConfig{
				ID:          "event_transformation",
				Name:        "Event Transformation",
				Description: "Transforms events before processing",
				EventTypes: []hooks.EventType{
					hooks.EventBeforeAnalysis,
					hooks.EventBeforeAgentRun,
				},
				Priority: hooks.PriorityNormal,
				Timeout:  2 * time.Second,
				Enabled:  true,
			},
		},
		logger: logger,
	}
}

// Execute transforms the event
func (h *EventTransformationHook) Execute(ctx context.Context, event *hooks.Event) *hooks.HookResult {
	// Add metadata to the event
	if event.Metadata == nil {
		event.Metadata = make(map[string]interface{})
	}

	event.Metadata["transformed_at"] = time.Now().UTC().Format(time.RFC3339)
	event.Metadata["transformation_version"] = "1.0"

	// Transform based on event type
	switch event.Type {
	case hooks.EventBeforeAnalysis:
		// Add analysis-specific metadata
		event.Metadata["analysis_timestamp"] = time.Now().Unix()
		event.Metadata["analysis_id"] = fmt.Sprintf("anal-%d", time.Now().UnixNano())

	case hooks.EventBeforeAgentRun:
		// Add agent-specific metadata
		event.Metadata["agent_timestamp"] = time.Now().Unix()
		event.Metadata["run_id"] = fmt.Sprintf("run-%d", time.Now().UnixNano())
	}

	h.logger.Debug("event transformed",
		zap.String("event_type", string(event.Type)),
		zap.String("event_id", event.ID),
	)

	// Return the modified event
	return &hooks.HookResult{
		Proceed:        true,
		ModifiedEvent:  event,
	}
}

// =============================================================================
// Example 5: Notification Hook
// =============================================================================

// NotificationHook sends notifications for specific events
type NotificationHook struct {
	hooks.BaseHook
	notifier *Notifier
	logger   *zap.Logger
}

// Notifier handles sending notifications
type Notifier struct {
	channels []NotificationChannel
}

// NotificationChannel represents a notification destination
type NotificationChannel interface {
	Send(ctx context.Context, notification *Notification) error
	Name() string
}

// Notification represents a notification message
type Notification struct {
	Severity  string                 `json:"severity"`
	Title     string                 `json:"title"`
	Message   string                 `json:"message"`
	Timestamp time.Time              `json:"timestamp"`
	Details   map[string]interface{} `json:"details,omitempty"`
}

// NewNotificationHook creates a new notification hook
func NewNotificationHook(notifier *Notifier, logger *zap.Logger) *NotificationHook {
	return &NotificationHook{
		BaseHook: hooks.BaseHook{
			Config: hooks.HookConfig{
				ID:          "notification",
				Name:        "Notification",
				Description: "Sends notifications for specific events",
				EventTypes: []hooks.EventType{
					hooks.EventOnAlert,
					hooks.EventOnApprovalRequired,
					hooks.EventOnPluginError,
					hooks.EventAfterOrderSubmit,
				},
				Priority: hooks.PriorityBackground, // Run after everything else
				Timeout:  10 * time.Second,
				Enabled:  true,
			},
		},
		notifier: notifier,
		logger:   logger,
	}
}

// Execute sends notifications
func (h *NotificationHook) Execute(ctx context.Context, event *hooks.Event) *hooks.HookResult {
	notification := &Notification{
		Timestamp: time.Now().UTC(),
		Details:   make(map[string]interface{}),
	}

	// Build notification based on event type
	switch event.Type {
	case hooks.EventOnAlert:
		notification.Severity = "warning"
		notification.Title = "System Alert"
		if payload, ok := event.Payload.(map[string]interface{}); ok {
			if msg, ok := payload["message"].(string); ok {
				notification.Message = msg
			}
		}

	case hooks.EventOnApprovalRequired:
		notification.Severity = "info"
		notification.Title = "Approval Required"
		notification.Message = "A trade proposal requires your approval"
		if payload, ok := event.Payload.(*TradeProposalPayload); ok {
			notification.Details["symbol"] = payload.Symbol
			notification.Details["side"] = payload.Side
			notification.Details["quantity"] = payload.Quantity
		}

	case hooks.EventOnPluginError:
		notification.Severity = "error"
		notification.Title = "Plugin Error"
		if payload, ok := event.Payload.(map[string]interface{}); ok {
			if pluginID, ok := payload["plugin_id"].(string); ok {
				notification.Message = fmt.Sprintf("Plugin %s encountered an error", pluginID)
			}
		}

	case hooks.EventAfterOrderSubmit:
		notification.Severity = "info"
		notification.Title = "Order Submitted"
		notification.Message = "An order has been submitted"
		if payload, ok := event.Payload.(*TradeProposalPayload); ok {
			notification.Details["symbol"] = payload.Symbol
			notification.Details["side"] = payload.Side
			notification.Details["quantity"] = payload.Quantity
		}
	}

	// Send to all channels
	for _, channel := range h.notifier.channels {
		if err := channel.Send(ctx, notification); err != nil {
			h.logger.Error("failed to send notification",
				zap.String("channel", channel.Name()),
				zap.Error(err),
			)
		}
	}

	return hooks.NewHookResult()
}

// =============================================================================
// Example 6: Circuit Breaker Hook
// =============================================================================

// CircuitBreakerHook implements circuit breaker pattern
type CircuitBreakerHook struct {
	hooks.BaseHook
	breaker *CircuitBreaker
	logger  *zap.Logger
}

// CircuitBreaker implements the circuit breaker pattern
type CircuitBreaker struct {
	circuits         map[hooks.EventType]*circuit
	failureThreshold int
	successThreshold int
	timeout          time.Duration
}

type circuit struct {
	state           CircuitState
	failures        int
	successes       int
	lastFailureTime time.Time
}

// CircuitState represents the state of a circuit breaker
type CircuitState int

const (
	CircuitClosed CircuitState = iota
	CircuitOpen
	CircuitHalfOpen
)

// NewCircuitBreakerHook creates a new circuit breaker hook
func NewCircuitBreakerHook(breaker *CircuitBreaker, logger *zap.Logger) *CircuitBreakerHook {
	return &CircuitBreakerHook{
		BaseHook: hooks.BaseHook{
			Config: hooks.HookConfig{
				ID:          "circuit_breaker",
				Name:        "Circuit Breaker",
				Description: "Implements circuit breaker pattern for resilience",
				EventTypes: []hooks.EventType{
					hooks.EventBeforeDataFetch,
					hooks.EventBeforeAnalysis,
					hooks.EventBeforeAgentRun,
					hooks.EventAfterDataFetch,
					hooks.EventAfterAnalysis,
					hooks.EventAfterAgentRun,
				},
				Priority: hooks.PriorityCritical,
				Timeout:  1 * time.Second,
				Enabled:  true,
			},
		},
		breaker: breaker,
		logger:  logger,
	}
}

// Execute implements circuit breaker logic
func (h *CircuitBreakerHook) Execute(ctx context.Context, event *hooks.Event) *hooks.HookResult {
	// Before events: check if circuit is open
	if isBeforeEvent(event.Type) {
		if !h.breaker.Allow(event.Type) {
			h.logger.Warn("circuit breaker open",
				zap.String("event_type", string(event.Type)),
			)

			return &hooks.HookResult{
				Proceed: true,
				Error:   fmt.Errorf("circuit breaker open for event type %s", event.Type),
				Metadata: map[string]interface{}{
					"circuit_breaker_open": true,
				},
			}
		}
	}

	// After events: record success/failure
	if isAfterEvent(event.Type) {
		success := isSuccessfulEvent(event)
		if success {
			h.breaker.RecordSuccess(event.Type)
		} else {
			h.breaker.RecordFailure(event.Type)
		}
	}

	return hooks.NewHookResult()
}

// Allow checks if requests are allowed
func (cb *CircuitBreaker) Allow(eventType hooks.EventType) bool {
	// Map after events to before events for circuit tracking
	baseEventType := getBaseEventType(eventType)

	c, ok := cb.circuits[baseEventType]
	if !ok {
		return true
	}

	switch c.state {
	case CircuitClosed:
		return true
	case CircuitOpen:
		// Check if timeout has passed
		if time.Since(c.lastFailureTime) > cb.timeout {
			c.state = CircuitHalfOpen
			c.failures = 0
			c.successes = 0
			return true
		}
		return false
	case CircuitHalfOpen:
		return true
	}

	return false
}

// RecordSuccess records a successful execution
func (cb *CircuitBreaker) RecordSuccess(eventType hooks.EventType) {
	baseEventType := getBaseEventType(eventType)
	c, ok := cb.circuits[baseEventType]
	if !ok {
		return
	}

	c.failures = 0
	c.successes++

	if c.state == CircuitHalfOpen && c.successes >= cb.successThreshold {
		c.state = CircuitClosed
		c.successes = 0
	}
}

// RecordFailure records a failed execution
func (cb *CircuitBreaker) RecordFailure(eventType hooks.EventType) {
	baseEventType := getBaseEventType(eventType)
	c, ok := cb.circuits[baseEventType]
	if !ok {
		return
	}

	c.successes = 0
	c.failures++
	c.lastFailureTime = time.Now()

	if c.failures >= cb.failureThreshold {
		c.state = CircuitOpen
	}
}

func isBeforeEvent(eventType hooks.EventType) bool {
	return eventType == hooks.EventBeforeDataFetch ||
		eventType == hooks.EventBeforeAnalysis ||
		eventType == hooks.EventBeforeAgentRun
}

func isAfterEvent(eventType hooks.EventType) bool {
	return eventType == hooks.EventAfterDataFetch ||
		eventType == hooks.EventAfterAnalysis ||
		eventType == hooks.EventAfterAgentRun
}

func isSuccessfulEvent(event *hooks.Event) bool {
	if payload, ok := event.Payload.(map[string]interface{}); ok {
		if success, ok := payload["success"].(bool); ok {
			return success
		}
	}
	return true
}

func getBaseEventType(eventType hooks.EventType) hooks.EventType {
	switch eventType {
	case hooks.EventAfterDataFetch:
		return hooks.EventBeforeDataFetch
	case hooks.EventAfterAnalysis:
		return hooks.EventBeforeAnalysis
	case hooks.EventAfterAgentRun:
		return hooks.EventBeforeAgentRun
	default:
		return eventType
	}
}

// =============================================================================
// Registration
// =============================================================================

func init() {
	// These would typically be registered with the global registry
	// registry := hooks.GetGlobalRegistry()
	// registry.Register(NewTradeProposalValidationHook(0.70, RiskHigh, logger))
	// registry.Register(NewAuditLoggingHook(auditLogger, logger))
	// etc.
}
