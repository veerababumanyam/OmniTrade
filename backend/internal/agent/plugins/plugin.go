// Package plugins provides a plugin architecture for OmniTrade agents.
// It defines interfaces for plugin lifecycle management, execution hooks,
// and inter-plugin communication.
package plugins

import (
	"context"
	"time"
)

// PluginState represents the current state of a plugin
type PluginState string

const (
	// StateUnloaded indicates the plugin is not loaded
	StateUnloaded PluginState = "unloaded"
	// StateLoaded indicates the plugin is loaded but not initialized
	StateLoaded PluginState = "loaded"
	// StateInitializing indicates the plugin is being initialized
	StateInitializing PluginState = "initializing"
	// StateActive indicates the plugin is fully operational
	StateActive PluginState = "active"
	// StateDegraded indicates the plugin is operational but with reduced functionality
	StateDegraded PluginState = "degraded"
	// StateStopping indicates the plugin is being stopped
	StateStopping PluginState = "stopping"
	// StateError indicates the plugin encountered an error
	StateError PluginState = "error"
)

// PluginPriority defines execution order for plugins
type PluginPriority int

const (
	// PriorityCritical plugins execute first (e.g., security, auth)
	PriorityCritical PluginPriority = 100
	// PriorityHigh plugins execute before normal plugins
	PriorityHigh PluginPriority = 75
	// PriorityNormal is the default priority
	PriorityNormal PluginPriority = 50
	// PriorityLow plugins execute after normal plugins
	PriorityLow PluginPriority = 25
	// PriorityBackground plugins execute last (e.g., logging, metrics)
	PriorityBackground PluginPriority = 10
)

// PluginCapability describes what a plugin can do
type PluginCapability string

const (
	// CapabilityDataIngestion indicates the plugin can ingest market data
	CapabilityDataIngestion PluginCapability = "data_ingestion"
	// CapabilityAnalysis indicates the plugin can analyze data
	CapabilityAnalysis PluginCapability = "analysis"
	// CapabilitySignalGeneration indicates the plugin generates trading signals
	CapabilitySignalGeneration PluginCapability = "signal_generation"
	// CapabilityRiskAssessment indicates the plugin assesses risk
	CapabilityRiskAssessment PluginCapability = "risk_assessment"
	// CapabilityExecution indicates the plugin can execute trades
	CapabilityExecution PluginCapability = "execution"
	// CapabilityNotification indicates the plugin can send notifications
	CapabilityNotification PluginCapability = "notification"
)

// PluginMetadata contains descriptive information about a plugin
type PluginMetadata struct {
	// ID is the unique identifier for the plugin
	ID string `json:"id"`
	// Name is the human-readable name
	Name string `json:"name"`
	// Version follows semantic versioning
	Version string `json:"version"`
	// Description explains the plugin's purpose
	Description string `json:"description"`
	// Author identifies the plugin creator
	Author string `json:"author"`
	// Priority determines execution order
	Priority PluginPriority `json:"priority"`
	// Capabilities lists what the plugin can do
	Capabilities []PluginCapability `json:"capabilities"`
	// Dependencies lists required plugin IDs
	Dependencies []string `json:"dependencies"`
	// Tags for categorization and filtering
	Tags []string `json:"tags"`
	// ConfigSchema defines the configuration structure
	ConfigSchema interface{} `json:"config_schema,omitempty"`
}

// PluginConfig holds configuration for a plugin instance
type PluginConfig struct {
	// Enabled determines if the plugin is active
	Enabled bool `json:"enabled"`
	// Settings contains plugin-specific configuration
	Settings map[string]interface{} `json:"settings"`
	// Timeout for plugin operations
	Timeout time.Duration `json:"timeout"`
	// MaxRetries for failed operations
	MaxRetries int `json:"max_retries"`
	// CircuitBreaker configuration
	CircuitBreaker CircuitBreakerConfig `json:"circuit_breaker"`
}

// CircuitBreakerConfig holds circuit breaker settings
type CircuitBreakerConfig struct {
	// Enabled determines if circuit breaker is active
	Enabled bool `json:"enabled"`
	// FailureThreshold is the number of failures before opening
	FailureThreshold int `json:"failure_threshold"`
	// SuccessThreshold is the number of successes before closing
	SuccessThreshold int `json:"success_threshold"`
	// Timeout before attempting to close
	Timeout time.Duration `json:"timeout"`
}

// PluginContext provides execution context to plugins
type PluginContext struct {
	// Context is the standard Go context
	Context context.Context
	// CorrelationID for tracing requests across plugins
	CorrelationID string
	// Actor identifies who initiated the operation
	Actor string
	// Timestamp of the operation
	Timestamp time.Time
	// Metadata for passing data between plugins
	Metadata map[string]interface{}
	// Logger for structured logging
	Logger PluginLogger
}

// PluginLogger provides structured logging for plugins
type PluginLogger interface {
	// Debug logs a debug message
	Debug(msg string, fields ...interface{})
	// Info logs an informational message
	Info(msg string, fields ...interface{})
	// Warn logs a warning message
	Warn(msg string, fields ...interface{})
	// Error logs an error message
	Error(msg string, fields ...interface{})
}

// PluginResult represents the result of a plugin operation
type PluginResult struct {
	// Success indicates if the operation succeeded
	Success bool `json:"success"`
	// Data contains the result payload
	Data interface{} `json:"data,omitempty"`
	// Error contains error information if failed
	Error *PluginError `json:"error,omitempty"`
	// Metadata contains additional result information
	Metadata map[string]interface{} `json:"metadata,omitempty"`
	// Duration of the operation
	Duration time.Duration `json:"duration"`
	// FromPluginID identifies the source plugin
	FromPluginID string `json:"from_plugin_id"`
}

// PluginError represents an error from a plugin
type PluginError struct {
	// Code is a machine-readable error code
	Code string `json:"code"`
	// Message is a human-readable error message
	Message string `json:"message"`
	// Details contains additional error context
	Details map[string]interface{} `json:"details,omitempty"`
	// Retryable indicates if the operation can be retried
	Retryable bool `json:"retryable"`
	// Cause is the underlying error
	Cause error `json:"-"`
}

// Error implements the error interface
func (e *PluginError) Error() string {
	if e.Cause != nil {
		return e.Message + ": " + e.Cause.Error()
	}
	return e.Message
}

// Unwrap returns the underlying error
func (e *PluginError) Unwrap() error {
	return e.Cause
}

// NewPluginError creates a new plugin error
func NewPluginError(code, message string, retryable bool) *PluginError {
	return &PluginError{
		Code:      code,
		Message:   message,
		Retryable: retryable,
		Details:   make(map[string]interface{}),
	}
}

// WithCause adds a cause to the error
func (e *PluginError) WithCause(cause error) *PluginError {
	e.Cause = cause
	return e
}

// WithDetail adds a detail to the error
func (e *PluginError) WithDetail(key string, value interface{}) *PluginError {
	if e.Details == nil {
		e.Details = make(map[string]interface{})
	}
	e.Details[key] = value
	return e
}

// Common error codes
const (
	ErrCodeTimeout       = "TIMEOUT"
	ErrCodeCanceled      = "CANCELED"
	ErrCodeInvalidInput  = "INVALID_INPUT"
	ErrCodeInternal      = "INTERNAL_ERROR"
	ErrCodeDependency    = "DEPENDENCY_ERROR"
	ErrCodeCircuitOpen   = "CIRCUIT_OPEN"
	ErrCodeRateLimited   = "RATE_LIMITED"
	ErrCodeUnauthorized  = "UNAUTHORIZED"
	ErrCodeNotAvailable  = "NOT_AVAILABLE"
)

// Plugin is the main interface that all plugins must implement
type Plugin interface {
	// Metadata returns plugin information
	Metadata() PluginMetadata

	// Initialize sets up the plugin with configuration
	Initialize(ctx *PluginContext, config PluginConfig) error

	// Start begins plugin operation
	Start(ctx *PluginContext) error

	// Stop gracefully stops the plugin
	Stop(ctx *PluginContext) error

	// Shutdown performs cleanup
	Shutdown(ctx *PluginContext) error

	// State returns the current plugin state
	State() PluginState

	// Health checks if the plugin is healthy
	Health(ctx *PluginContext) (*PluginResult, error)

	// Execute runs the plugin's main operation
	Execute(ctx *PluginContext, input interface{}) (*PluginResult, error)
}

// HookPlugin extends Plugin with hook capabilities
type HookPlugin interface {
	Plugin

	// BeforeExecute is called before the main execution
	BeforeExecute(ctx *PluginContext, input interface{}) (interface{}, error)

	// AfterExecute is called after the main execution
	AfterExecute(ctx *PluginContext, input interface{}, result *PluginResult) (*PluginResult, error)

	// OnError is called when an error occurs
	OnError(ctx *PluginContext, input interface{}, err error) error
}

// ConfigurablePlugin allows runtime configuration updates
type ConfigurablePlugin interface {
	Plugin

	// UpdateConfig updates the plugin configuration
	UpdateConfig(ctx *PluginContext, config PluginConfig) error

	// GetConfig returns the current configuration
	GetConfig() PluginConfig
}

// DependablePlugin declares dependencies on other plugins
type DependablePlugin interface {
	Plugin

	// Requires returns list of required plugin IDs
	Requires() []string

	// Provides returns list of capabilities this plugin provides
	Provides() []PluginCapability
}

// ObservablePlugin provides metrics and observability
type ObservablePlugin interface {
	Plugin

	// Metrics returns plugin metrics
	Metrics(ctx *PluginContext) (map[string]interface{}, error)

	// Diagnostics returns diagnostic information
	Diagnostics(ctx *PluginContext) (map[string]interface{}, error)
}

// PluginFactory creates plugin instances
type PluginFactory func() Plugin

// PluginConstructor creates a plugin with dependencies
type PluginConstructor func(deps map[string]Plugin) Plugin
