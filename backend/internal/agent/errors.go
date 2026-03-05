// Package agent provides multi-agent orchestration for the OmniTrade Intelligence Plane.
// This file defines structured error types for the hooks, plugins, and tools systems.
package agent

import (
	"context"
	"fmt"
	"runtime"
	"strings"
	"time"
)

// ============================================================
// BASE ERROR TYPE
// ============================================================

// OmniTradeError is the base error type for all agent system errors.
// It provides structured error information with codes, metadata, and stack traces.
type OmniTradeError struct {
	// Code is a machine-readable error code (see constants.go).
	Code string

	// Message is a human-readable error message.
	Message string

	// Cause is the underlying error that caused this error.
	Cause error

	// Details contains additional error context.
	Details map[string]interface{}

	// Retryable indicates if the operation can be retried.
	Retryable bool

	// Stack contains the stack trace at the point of error creation.
	Stack string

	// Timestamp is when the error occurred.
	Timestamp time.Time
}

// Error implements the error interface.
func (e *OmniTradeError) Error() string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("[%s] %s", e.Code, e.Message))
	if e.Cause != nil {
		sb.WriteString(fmt.Sprintf(": %v", e.Cause))
	}
	return sb.String()
}

// Unwrap returns the underlying cause for errors.Is/As support.
func (e *OmniTradeError) Unwrap() error {
	return e.Cause
}

// WithDetails adds additional details to the error.
func (e *OmniTradeError) WithDetails(details map[string]interface{}) *OmniTradeError {
	if e.Details == nil {
		e.Details = make(map[string]interface{})
	}
	for k, v := range details {
		e.Details[k] = v
	}
	return e
}

// WithDetail adds a single detail to the error.
func (e *OmniTradeError) WithDetail(key string, value interface{}) *OmniTradeError {
	if e.Details == nil {
		e.Details = make(map[string]interface{})
	}
	e.Details[key] = value
	return e
}

// IsRetryable marks the error as retryable.
func (e *OmniTradeError) IsRetryable() *OmniTradeError {
	e.Retryable = true
	return e
}

// NewError creates a new OmniTradeError with the given code and message.
func NewError(code, message string) *OmniTradeError {
	return &OmniTradeError{
		Code:      code,
		Message:   message,
		Timestamp: time.Now(),
		Stack:     captureStack(2),
	}
}

// WrapError wraps an existing error with additional context.
func WrapError(code, message string, cause error) *OmniTradeError {
	return &OmniTradeError{
		Code:      code,
		Message:   message,
		Cause:     cause,
		Timestamp: time.Now(),
		Stack:     captureStack(2),
	}
}

// ============================================================
// TOOL ERROR TYPE
// ============================================================

// ToolError represents an error that occurred during tool execution.
// It includes tool-specific metadata for debugging and monitoring.
type ToolError struct {
	*OmniTradeError

	// ToolName is the name of the tool that failed.
	ToolName string

	// ToolCategory is the category of the tool.
	ToolCategory ToolCategory

	// Input is the input that was passed to the tool (may be redacted).
	Input interface{}

	// Attempt is the attempt number when the error occurred.
	Attempt int

	// MaxAttempts is the maximum number of attempts.
	MaxAttempts int

	// Duration is how long the tool ran before failing.
	Duration time.Duration

	// Timeout indicates if the error was due to a timeout.
	Timeout bool

	// CircuitBreakerOpen indicates if the circuit breaker was open.
	CircuitBreakerOpen bool
}

// Error implements the error interface with tool-specific context.
func (e *ToolError) Error() string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("[%s] tool '%s' failed: %s", e.Code, e.ToolName, e.Message))
	if e.Cause != nil {
		sb.WriteString(fmt.Sprintf(": %v", e.Cause))
	}
	if e.Attempt > 1 {
		sb.WriteString(fmt.Sprintf(" (attempt %d/%d)", e.Attempt, e.MaxAttempts))
	}
	if e.Timeout {
		sb.WriteString(" [TIMEOUT]")
	}
	if e.CircuitBreakerOpen {
		sb.WriteString(" [CIRCUIT_OPEN]")
	}
	return sb.String()
}

// NewToolError creates a new ToolError for the given tool.
func NewToolError(toolName string, code, message string) *ToolError {
	return &ToolError{
		OmniTradeError: &OmniTradeError{
			Code:      code,
			Message:   message,
			Timestamp: time.Now(),
			Stack:     captureStack(2),
		},
		ToolName: toolName,
	}
}

// WrapToolError wraps an existing error with tool context.
func WrapToolError(toolName string, code, message string, cause error) *ToolError {
	return &ToolError{
		OmniTradeError: &OmniTradeError{
			Code:      code,
			Message:   message,
			Cause:     cause,
			Timestamp: time.Now(),
			Stack:     captureStack(2),
		},
		ToolName: toolName,
	}
}

// WithCategory adds category information to the error.
func (e *ToolError) WithCategory(category ToolCategory) *ToolError {
	e.ToolCategory = category
	return e
}

// WithInput adds input information to the error (sensitive data should be redacted).
func (e *ToolError) WithInput(input interface{}) *ToolError {
	e.Input = input
	return e
}

// WithAttempt adds attempt information to the error.
func (e *ToolError) WithAttempt(attempt, maxAttempts int) *ToolError {
	e.Attempt = attempt
	e.MaxAttempts = maxAttempts
	return e
}

// WithDuration adds duration information to the error.
func (e *ToolError) WithDuration(duration time.Duration) *ToolError {
	e.Duration = duration
	return e
}

// IsTimeout marks the error as a timeout error.
func (e *ToolError) IsTimeout() *ToolError {
	e.Timeout = true
	e.Retryable = true
	return e
}

// IsCircuitBreakerOpen marks the error as a circuit breaker error.
func (e *ToolError) IsCircuitBreakerOpen() *ToolError {
	e.CircuitBreakerOpen = true
	e.Retryable = false
	return e
}

// ============================================================
// AGENT ERROR TYPE
// ============================================================

// AgentError represents an error that occurred during agent execution.
// It includes agent-specific context for the Intelligence Plane.
type AgentError struct {
	*OmniTradeError

	// AgentID is the identifier of the agent that failed.
	AgentID string

	// AgentName is the human-readable name of the agent.
	AgentName string

	// FlowName is the orchestration flow that was executing (if applicable).
	FlowName string

	// ExecutionPhase indicates where in the lifecycle the error occurred.
	ExecutionPhase ExecutionPhase

	// HookName is the hook that was executing when the error occurred (if applicable).
	HookName string

	// PartialOutput is any output that was generated before the error.
	PartialOutput interface{}

	// Duration is how long the agent ran before failing.
	Duration time.Duration

	// RetryCount is how many retries have been attempted.
	RetryCount int

	// ContextSnapshot is a snapshot of the execution context when the error occurred.
	ContextSnapshot *ExecutionContext
}

// ExecutionPhase indicates where in the agent lifecycle an error occurred.
type ExecutionPhase string

const (
	// PhaseInitialization indicates an error during initialization.
	PhaseInitialization ExecutionPhase = "initialization"

	// PhasePreHooks indicates an error during pre-execution hooks.
	PhasePreHooks ExecutionPhase = "pre_hooks"

	// PhaseExecution indicates an error during main execution.
	PhaseExecution ExecutionPhase = "execution"

	// PhaseToolInvocation indicates an error during tool invocation.
	PhaseToolInvocation ExecutionPhase = "tool_invocation"

	// PhasePostHooks indicates an error during post-execution hooks.
	PhasePostHooks ExecutionPhase = "post_hooks"

	// PhaseCleanup indicates an error during cleanup.
	PhaseCleanup ExecutionPhase = "cleanup"
)

// Error implements the error interface with agent-specific context.
func (e *AgentError) Error() string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("[%s] agent '%s' failed", e.Code, e.AgentID))
	if e.AgentName != "" {
		sb.WriteString(fmt.Sprintf(" (%s)", e.AgentName))
	}
	sb.WriteString(fmt.Sprintf(": %s", e.Message))
	if e.Cause != nil {
		sb.WriteString(fmt.Sprintf(": %v", e.Cause))
	}
	if e.FlowName != "" {
		sb.WriteString(fmt.Sprintf(" [flow=%s]", e.FlowName))
	}
	sb.WriteString(fmt.Sprintf(" [phase=%s]", e.ExecutionPhase))
	if e.Duration > 0 {
		sb.WriteString(fmt.Sprintf(" [duration=%v]", e.Duration))
	}
	return sb.String()
}

// NewAgentError creates a new AgentError for the given agent.
func NewAgentError(agentID, code, message string) *AgentError {
	return &AgentError{
		OmniTradeError: &OmniTradeError{
			Code:      code,
			Message:   message,
			Timestamp: time.Now(),
			Stack:     captureStack(2),
		},
		AgentID: agentID,
	}
}

// WrapAgentError wraps an existing error with agent context.
func WrapAgentError(agentID, code, message string, cause error) *AgentError {
	return &AgentError{
		OmniTradeError: &OmniTradeError{
			Code:      code,
			Message:   message,
			Cause:     cause,
			Timestamp: time.Now(),
			Stack:     captureStack(2),
		},
		AgentID: agentID,
	}
}

// WithAgentName adds agent name to the error.
func (e *AgentError) WithAgentName(name string) *AgentError {
	e.AgentName = name
	return e
}

// WithFlow adds flow information to the error.
func (e *AgentError) WithFlow(flowName string) *AgentError {
	e.FlowName = flowName
	return e
}

// WithPhase adds execution phase to the error.
func (e *AgentError) WithPhase(phase ExecutionPhase) *AgentError {
	e.ExecutionPhase = phase
	return e
}

// WithHook adds hook information to the error.
func (e *AgentError) WithHook(hookName string) *AgentError {
	e.HookName = hookName
	return e
}

// WithPartialOutput adds partial output to the error.
func (e *AgentError) WithPartialOutput(output interface{}) *AgentError {
	e.PartialOutput = output
	return e
}

// WithDuration adds duration to the error.
func (e *AgentError) WithDuration(duration time.Duration) *AgentError {
	e.Duration = duration
	return e
}

// WithRetryCount adds retry count to the error.
func (e *AgentError) WithRetryCount(count int) *AgentError {
	e.RetryCount = count
	return e
}

// WithContext adds execution context snapshot to the error.
func (e *AgentError) WithContext(ctx *ExecutionContext) *AgentError {
	e.ContextSnapshot = ctx
	return e
}

// ============================================================
// PLUGIN ERROR TYPE
// ============================================================

// PluginError represents an error that occurred during plugin lifecycle.
// It includes plugin-specific metadata for debugging plugin issues.
type PluginError struct {
	*OmniTradeError

	// PluginID is the identifier of the plugin that failed.
	PluginID string

	// PluginName is the human-readable name of the plugin.
	PluginName string

	// PluginVersion is the version of the plugin.
	PluginVersion string

	// LifecycleStage indicates which lifecycle method failed.
	LifecycleStage LifecycleStage

	// DependencyID is the ID of a dependency that caused the error (if applicable).
	DependencyID string

	// HealthStatus is the plugin's health status when the error occurred.
	HealthStatus HealthStatus
}

// LifecycleStage indicates which plugin lifecycle method failed.
type LifecycleStage string

const (
	// StageLoad indicates an error during plugin loading.
	StageLoad LifecycleStage = "load"

	// StageInitialize indicates an error during plugin initialization.
	StageInitialize LifecycleStage = "initialize"

	// StageStart indicates an error during plugin start.
	StageStart LifecycleStage = "start"

	// StageExecute indicates an error during plugin execution.
	StageExecute LifecycleStage = "execute"

	// StageStop indicates an error during plugin stop.
	StageStop LifecycleStage = "stop"

	// StageUnload indicates an error during plugin unloading.
	StageUnload LifecycleStage = "unload"
)

// Error implements the error interface with plugin-specific context.
func (e *PluginError) Error() string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("[%s] plugin '%s' failed", e.Code, e.PluginID))
	if e.PluginName != "" {
		sb.WriteString(fmt.Sprintf(" (%s)", e.PluginName))
	}
	if e.PluginVersion != "" {
		sb.WriteString(fmt.Sprintf(" v%s", e.PluginVersion))
	}
	sb.WriteString(fmt.Sprintf(": %s", e.Message))
	if e.Cause != nil {
		sb.WriteString(fmt.Sprintf(": %v", e.Cause))
	}
	sb.WriteString(fmt.Sprintf(" [stage=%s]", e.LifecycleStage))
	if e.DependencyID != "" {
		sb.WriteString(fmt.Sprintf(" [dependency=%s]", e.DependencyID))
	}
	return sb.String()
}

// NewPluginError creates a new PluginError for the given plugin.
func NewPluginError(pluginID, code, message string) *PluginError {
	return &PluginError{
		OmniTradeError: &OmniTradeError{
			Code:      code,
			Message:   message,
			Timestamp: time.Now(),
			Stack:     captureStack(2),
		},
		PluginID: pluginID,
	}
}

// WrapPluginError wraps an existing error with plugin context.
func WrapPluginError(pluginID, code, message string, cause error) *PluginError {
	return &PluginError{
		OmniTradeError: &OmniTradeError{
			Code:      code,
			Message:   message,
			Cause:     cause,
			Timestamp: time.Now(),
			Stack:     captureStack(2),
		},
		PluginID: pluginID,
	}
}

// WithPluginName adds plugin name to the error.
func (e *PluginError) WithPluginName(name string) *PluginError {
	e.PluginName = name
	return e
}

// WithVersion adds plugin version to the error.
func (e *PluginError) WithVersion(version string) *PluginError {
	e.PluginVersion = version
	return e
}

// WithStage adds lifecycle stage to the error.
func (e *PluginError) WithStage(stage LifecycleStage) *PluginError {
	e.LifecycleStage = stage
	return e
}

// WithDependency adds dependency information to the error.
func (e *PluginError) WithDependency(depID string) *PluginError {
	e.DependencyID = depID
	return e
}

// WithHealthStatus adds health status to the error.
func (e *PluginError) WithHealthStatus(status HealthStatus) *PluginError {
	e.HealthStatus = status
	return e
}

// ============================================================
// HOOK ERROR TYPE
// ============================================================

// HookError represents an error that occurred during hook execution.
type HookError struct {
	*OmniTradeError

	// HookName is the name of the hook that failed.
	HookName string

	// HookPriority is the priority of the hook.
	HookPriority int

	// EventName is the name of the event being processed.
	EventName string

	// AgentID is the agent that triggered the hook (if applicable).
	AgentID string

	// Duration is how long the hook ran before failing.
	Duration time.Duration
}

// Error implements the error interface with hook-specific context.
func (e *HookError) Error() string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("[%s] hook '%s' failed", e.Code, e.HookName))
	sb.WriteString(fmt.Sprintf(": %s", e.Message))
	if e.Cause != nil {
		sb.WriteString(fmt.Sprintf(": %v", e.Cause))
	}
	sb.WriteString(fmt.Sprintf(" [event=%s, priority=%d]", e.EventName, e.HookPriority))
	if e.Duration > 0 {
		sb.WriteString(fmt.Sprintf(" [duration=%v]", e.Duration))
	}
	return sb.String()
}

// NewHookError creates a new HookError for the given hook.
func NewHookError(hookName, code, message string) *HookError {
	return &HookError{
		OmniTradeError: &OmniTradeError{
			Code:      code,
			Message:   message,
			Timestamp: time.Now(),
			Stack:     captureStack(2),
		},
		HookName: hookName,
	}
}

// WrapHookError wraps an existing error with hook context.
func WrapHookError(hookName, code, message string, cause error) *HookError {
	return &HookError{
		OmniTradeError: &OmniTradeError{
			Code:      code,
			Message:   message,
			Cause:     cause,
			Timestamp: time.Now(),
			Stack:     captureStack(2),
		},
		HookName: hookName,
	}
}

// WithPriority adds priority to the error.
func (e *HookError) WithPriority(priority int) *HookError {
	e.HookPriority = priority
	return e
}

// WithEvent adds event name to the error.
func (e *HookError) WithEvent(eventName string) *HookError {
	e.EventName = eventName
	return e
}

// WithAgent adds agent ID to the error.
func (e *HookError) WithAgent(agentID string) *HookError {
	e.AgentID = agentID
	return e
}

// WithDuration adds duration to the error.
func (e *HookError) WithDuration(duration time.Duration) *HookError {
	e.Duration = duration
	return e
}

// ============================================================
// VALIDATION ERROR TYPE
// ============================================================

// ValidationError represents an input validation failure.
type ValidationError struct {
	*OmniTradeError

	// Field is the field that failed validation.
	Field string

	// Value is the value that failed validation (may be redacted).
	Value interface{}

	// Constraint is the validation constraint that was violated.
	Constraint string
}

// Error implements the error interface with validation context.
func (e *ValidationError) Error() string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("[%s] validation failed", e.Code))
	if e.Field != "" {
		sb.WriteString(fmt.Sprintf(" for field '%s'", e.Field))
	}
	sb.WriteString(fmt.Sprintf(": %s", e.Message))
	if e.Constraint != "" {
		sb.WriteString(fmt.Sprintf(" [constraint=%s]", e.Constraint))
	}
	return sb.String()
}

// NewValidationError creates a new ValidationError.
func NewValidationError(code, message string) *ValidationError {
	return &ValidationError{
		OmniTradeError: &OmniTradeError{
			Code:      code,
			Message:   message,
			Timestamp: time.Now(),
			Stack:     captureStack(2),
		},
	}
}

// WithField adds field information to the error.
func (e *ValidationError) WithField(field string) *ValidationError {
	e.Field = field
	return e
}

// WithValue adds value information to the error.
func (e *ValidationError) WithValue(value interface{}) *ValidationError {
	e.Value = value
	return e
}

// WithConstraint adds constraint information to the error.
func (e *ValidationError) WithConstraint(constraint string) *ValidationError {
	e.Constraint = constraint
	return e
}

// ============================================================
// TRADE ERROR TYPE
// ============================================================

// TradeError represents an error in trade-related operations.
type TradeError struct {
	*OmniTradeError

	// Symbol is the trading symbol involved in the error.
	Symbol string

	// Action is the trade action (BUY, SELL, HOLD).
	Action TradeAction

	// ConfidenceScore is the confidence score of the failed proposal.
	ConfidenceScore float64

	// ProposalID is the ID of the failed proposal (if applicable).
	ProposalID string

	// RiskLimit is the risk limit that was exceeded (if applicable).
	RiskLimit string

	// Reasoning is the reasoning behind the failed trade.
	Reasoning string
}

// Error implements the error interface with trade-specific context.
func (e *TradeError) Error() string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("[%s] trade error", e.Code))
	if e.Symbol != "" {
		sb.WriteString(fmt.Sprintf(" for %s", e.Symbol))
	}
	if e.Action != "" {
		sb.WriteString(fmt.Sprintf(" (%s)", e.Action))
	}
	sb.WriteString(fmt.Sprintf(": %s", e.Message))
	if e.Cause != nil {
		sb.WriteString(fmt.Sprintf(": %v", e.Cause))
	}
	if e.ConfidenceScore > 0 {
		sb.WriteString(fmt.Sprintf(" [confidence=%.2f]", e.ConfidenceScore))
	}
	if e.ProposalID != "" {
		sb.WriteString(fmt.Sprintf(" [proposal=%s]", e.ProposalID))
	}
	return sb.String()
}

// NewTradeError creates a new TradeError.
func NewTradeError(code, message string) *TradeError {
	return &TradeError{
		OmniTradeError: &OmniTradeError{
			Code:      code,
			Message:   message,
			Timestamp: time.Now(),
			Stack:     captureStack(2),
		},
	}
}

// WrapTradeError wraps an existing error with trade context.
func WrapTradeError(code, message string, cause error) *TradeError {
	return &TradeError{
		OmniTradeError: &OmniTradeError{
			Code:      code,
			Message:   message,
			Cause:     cause,
			Timestamp: time.Now(),
			Stack:     captureStack(2),
		},
	}
}

// WithSymbol adds symbol information to the error.
func (e *TradeError) WithSymbol(symbol string) *TradeError {
	e.Symbol = symbol
	return e
}

// WithAction adds action information to the error.
func (e *TradeError) WithAction(action TradeAction) *TradeError {
	e.Action = action
	return e
}

// WithConfidence adds confidence score to the error.
func (e *TradeError) WithConfidence(score float64) *TradeError {
	e.ConfidenceScore = score
	return e
}

// WithProposal adds proposal ID to the error.
func (e *TradeError) WithProposal(proposalID string) *TradeError {
	e.ProposalID = proposalID
	return e
}

// WithRiskLimit adds risk limit information to the error.
func (e *TradeError) WithRiskLimit(limit string) *TradeError {
	e.RiskLimit = limit
	return e
}

// WithReasoning adds reasoning to the error.
func (e *TradeError) WithReasoning(reasoning string) *TradeError {
	e.Reasoning = reasoning
	return e
}

// ============================================================
// ERROR PREDICATES AND HELPERS
// ============================================================

// IsRetryable checks if an error is retryable.
func IsRetryable(err error) bool {
	if err == nil {
		return false
	}
	switch e := err.(type) {
	case *OmniTradeError:
		return e.Retryable
	case *ToolError:
		return e.Retryable
	case *AgentError:
		return e.Retryable
	case *PluginError:
		return e.Retryable
	default:
		return false
	}
}

// IsTimeout checks if an error is a timeout error.
func IsTimeout(err error) bool {
	if err == nil {
		return false
	}
	if toolErr, ok := err.(*ToolError); ok {
		return toolErr.Timeout
	}
	if agentErr, ok := err.(*AgentError); ok {
		return agentErr.Code == ErrCodeTimeout
	}
	return false
}

// IsCircuitBreakerOpen checks if an error is a circuit breaker error.
func IsCircuitBreakerOpen(err error) bool {
	if err == nil {
		return false
	}
	if toolErr, ok := err.(*ToolError); ok {
		return toolErr.CircuitBreakerOpen
	}
	return false
}

// GetErrorCode extracts the error code from an error.
func GetErrorCode(err error) string {
	if err == nil {
		return ""
	}
	switch e := err.(type) {
	case *OmniTradeError:
		return e.Code
	case *ToolError:
		return e.Code
	case *AgentError:
		return e.Code
	case *PluginError:
		return e.Code
	case *HookError:
		return e.Code
	case *ValidationError:
		return e.Code
	case *TradeError:
		return e.Code
	default:
		return ErrCodeInternal
	}
}

// GetErrorDetails extracts error details from an error.
func GetErrorDetails(err error) map[string]interface{} {
	if err == nil {
		return nil
	}
	switch e := err.(type) {
	case *OmniTradeError:
		return e.Details
	case *ToolError:
		return e.Details
	case *AgentError:
		return e.Details
	case *PluginError:
		return e.Details
	case *HookError:
		return e.Details
	case *ValidationError:
		return e.Details
	case *TradeError:
		return e.Details
	default:
		return nil
	}
}

// ============================================================
// CONTEXT ERROR HELPERS
// ============================================================

// ContextError wraps context errors with OmniTrade error codes.
func ContextError(ctx context.Context) error {
	if ctx == nil {
		return nil
	}
	select {
	case <-ctx.Done():
		switch ctx.Err() {
		case context.DeadlineExceeded:
			return NewError(ErrCodeTimeout, "operation timed out")
		case context.Canceled:
			return NewError(ErrCodeCancelled, "operation was cancelled")
		default:
			return WrapError(ErrCodeInternal, "context error", ctx.Err())
		}
	default:
		return nil
	}
}

// ============================================================
// STACK TRACE CAPTURE
// ============================================================

// captureStack captures the current stack trace, skipping the specified number of frames.
func captureStack(skip int) string {
	const maxDepth = 32
	var pcs [maxDepth]uintptr
	n := runtime.Callers(skip+2, pcs[:])
	if n == 0 {
		return ""
	}

	frames := runtime.CallersFrames(pcs[:n])
	var sb strings.Builder

	for {
		frame, more := frames.Next()
		// Skip runtime and standard library frames
		if !strings.HasPrefix(frame.Function, "runtime.") &&
			!strings.HasPrefix(frame.File, "runtime/") {
			sb.WriteString(fmt.Sprintf("\n\t%s at %s:%d", frame.Function, frame.File, frame.Line))
		}
		if !more {
			break
		}
	}

	return sb.String()
}

// ============================================================
// ERROR CONVERSION FOR API RESPONSES
// ============================================================

// ToExecutionError converts an error to an ExecutionError for API responses.
func ToExecutionError(err error) *ExecutionError {
	if err == nil {
		return nil
	}

	execErr := &ExecutionError{
		Code:      GetErrorCode(err),
		Message:   err.Error(),
		Retryable: IsRetryable(err),
	}

	// Add details if available
	if details := GetErrorDetails(err); details != nil {
		execErr.Details = details
	}

	// Add stack trace for internal errors (for debugging)
	if baseErr, ok := err.(*OmniTradeError); ok {
		execErr.Stack = baseErr.Stack
	}

	return execErr
}
