// Package agent provides multi-agent orchestration for the OmniTrade Intelligence Plane.
// This file defines core type definitions for the hooks, plugins, and tools registry systems.
package agent

import (
	"context"
	"time"
)

// ============================================================
// HOOK SYSTEM TYPES
// ============================================================

// Hook defines the interface for lifecycle event handlers.
// Hooks are executed at specific points during agent execution flow
// and can modify behavior, add logging, or implement cross-cutting concerns.
type Hook interface {
	// Name returns the unique identifier for this hook.
	// Names should be descriptive and follow a namespace pattern
	// (e.g., "logging.pre-execute", "metrics.post-execute").
	Name() string

	// Priority returns the execution priority of this hook.
	// Lower numbers execute first. Standard priority ranges:
	// - 0-99: System hooks (authentication, authorization)
	// - 100-199: Logging and metrics hooks
	// - 200-299: Business logic hooks
	// - 300-399: Custom extension hooks
	Priority() int

	// Execute runs the hook logic with the given event context.
	// Returns an error to halt execution chain, or nil to continue.
	// Hooks can modify the event data to affect downstream behavior.
	Execute(ctx context.Context, event *HookEvent) error
}

// HookEvent contains all contextual information passed to hooks during execution.
// Hooks can read and modify event data to affect agent behavior.
type HookEvent struct {
	// Name identifies the type of hook event being triggered.
	// See constants.go for predefined event names.
	Name string

	// Timestamp when the event was created.
	Timestamp time.Time

	// AgentID is the unique identifier of the agent triggering this event.
	AgentID string

	// AgentName is the human-readable name of the agent.
	AgentName string

	// FlowName is the orchestration flow being executed (if applicable).
	FlowName string

	// Input contains the original input data for the agent execution.
	// Type depends on the specific agent/flow being executed.
	Input interface{}

	// Output contains the result of agent execution (populated for post-execution hooks).
	// Type depends on the specific agent/flow being executed.
	Output interface{}

	// Error contains any error that occurred during execution (for error hooks).
	Error error

	// Metadata provides additional context-specific information.
	// Keys should follow a namespace pattern (e.g., "tracing.trace_id").
	Metadata map[string]interface{}

	// Context carries deadlines, cancellation signals, and other request-scoped values.
	Context context.Context

	// Elapsed is the duration since the operation started (for post-execution hooks).
	Elapsed time.Duration

	// Attempt is the current retry attempt number (1-indexed).
	Attempt int

	// MaxAttempts is the maximum number of retry attempts allowed.
	MaxAttempts int
}

// ============================================================
// PLUGIN SYSTEM TYPES
// ============================================================

// AgentPlugin defines the interface for extending agent capabilities.
// Plugins can register hooks, tools, and participate in agent lifecycle events.
// This follows a dependency injection pattern for testability and modularity.
type AgentPlugin interface {
	// ID returns the unique identifier for this plugin.
	// IDs should be lowercase, hyphen-separated, and globally unique
	// (e.g., "omnitrade-rag-plugin", "sentiment-analyzer").
	ID() string

	// Name returns the human-readable name of the plugin.
	Name() string

	// Version returns the semantic version of the plugin.
	Version() string

	// Description provides a brief explanation of plugin functionality.
	Description() string

	// Initialize sets up the plugin with required dependencies.
	// Called once during plugin registration before any other methods.
	// Returns an error if initialization fails (plugin will not be loaded).
	Initialize(ctx context.Context, deps *Dependencies) error

	// Start begins plugin operation after initialization.
	// Called after all plugins have been initialized.
	// Used for starting background goroutines, connections, etc.
	Start(ctx context.Context) error

	// Stop gracefully shuts down the plugin.
	// Called during application shutdown in reverse initialization order.
	// Should complete within the provided context deadline.
	Stop(ctx context.Context) error

	// Hooks returns the list of hooks this plugin provides.
	// Hooks are registered after all plugins have started.
	Hooks() []Hook

	// Tools returns the list of tools this plugin provides.
	// Tools are registered after hooks are registered.
	Tools() []ToolDefinition

	// Dependencies returns the list of plugin IDs this plugin depends on.
	// Dependencies are initialized before this plugin.
	Dependencies() []string

	// Health returns the current health status of the plugin.
	// Used for health checks and monitoring.
	Health() PluginHealth
}

// Dependencies provides injected dependencies for plugins.
// All fields are optional - plugins should check for nil before use.
type Dependencies struct {
	// Database provides read-only access to the OmniTrade database.
	// AI agents use the omnitrade_readonly role per security requirements.
	Database DatabaseReader

	// Logger provides structured logging capabilities.
	Logger Logger

	// Config provides access to plugin-specific configuration.
	Config ConfigReader

	// HTTPClient provides a shared HTTP client for external API calls.
	HTTPClient HTTPClient

	// Cache provides a distributed cache for temporary data storage.
	Cache CacheService

	// EventEmitter allows plugins to emit custom events.
	EventEmitter EventEmitter

	// MetricsCollector allows plugins to record custom metrics.
	MetricsCollector MetricsCollector
}

// DatabaseReader defines the read-only database interface for plugins.
// Plugins must not have write access per OmniTrade security model.
type DatabaseReader interface {
	// Query executes a query that returns multiple rows.
	Query(ctx context.Context, query string, args ...interface{}) ([]map[string]interface{}, error)

	// QueryRow executes a query that returns a single row.
	QueryRow(ctx context.Context, query string, args ...interface{}) (map[string]interface{}, error)

	// QueryStruct executes a query and scans results into a slice of structs.
	QueryStruct(ctx context.Context, dest interface{}, query string, args ...interface{}) error
}

// Logger defines the structured logging interface.
type Logger interface {
	// Debug logs a message at debug level.
	Debug(msg string, fields ...interface{})

	// Info logs a message at info level.
	Info(msg string, fields ...interface{})

	// Warn logs a message at warning level.
	Warn(msg string, fields ...interface{})

	// Error logs a message at error level.
	Error(msg string, fields ...interface{})

	// With returns a logger with additional context fields.
	With(fields ...interface{}) Logger
}

// ConfigReader provides access to configuration values.
type ConfigReader interface {
	// GetString retrieves a string configuration value.
	GetString(key string) string

	// GetInt retrieves an integer configuration value.
	GetInt(key string) int

	// GetBool retrieves a boolean configuration value.
	GetBool(key string) bool

	// GetDuration retrieves a duration configuration value.
	GetDuration(key string) time.Duration

	// GetFloat retrieves a float64 configuration value.
	GetFloat(key string) float64
}

// HTTPClient defines the HTTP client interface for external API calls.
type HTTPClient interface {
	// Do executes an HTTP request.
	Do(req interface{}) (interface{}, error)
}

// CacheService defines the distributed cache interface.
type CacheService interface {
	// Get retrieves a value from the cache.
	Get(ctx context.Context, key string) (interface{}, error)

	// Set stores a value in the cache with an expiration.
	Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error

	// Delete removes a value from the cache.
	Delete(ctx context.Context, key string) error
}

// EventEmitter defines the interface for emitting custom events.
type EventEmitter interface {
	// Emit publishes an event to the event bus.
	Emit(ctx context.Context, eventType string, payload interface{}) error
}

// MetricsCollector defines the interface for recording custom metrics.
type MetricsCollector interface {
	// Counter increments a counter metric.
	Counter(name string, value float64, tags ...string)

	// Gauge records a gauge metric.
	Gauge(name string, value float64, tags ...string)

	// Histogram records a histogram metric.
	Histogram(name string, value float64, tags ...string)

	// Timing records a timing metric.
	Timing(name string, duration time.Duration, tags ...string)
}

// PluginHealth represents the health status of a plugin.
type PluginHealth struct {
	// Status indicates the current health state.
	Status HealthStatus

	// Message provides additional context about the health status.
	Message string

	// LastChecked is when the health was last evaluated.
	LastChecked time.Time

	// Details contains additional health check details.
	Details map[string]interface{}
}

// HealthStatus represents the possible health states.
type HealthStatus string

const (
	// HealthStatusHealthy indicates the plugin is operating normally.
	HealthStatusHealthy HealthStatus = "healthy"

	// HealthStatusDegraded indicates the plugin is functioning but with issues.
	HealthStatusDegraded HealthStatus = "degraded"

	// HealthStatusUnhealthy indicates the plugin is not functioning properly.
	HealthStatusUnhealthy HealthStatus = "unhealthy"

	// HealthStatusUnknown indicates the health status could not be determined.
	HealthStatusUnknown HealthStatus = "unknown"
)

// ============================================================
// TOOL SYSTEM TYPES
// ============================================================

// ToolHandler defines the function signature for tool execution.
// Tools are atomic operations that agents can invoke during execution.
type ToolHandler func(ctx context.Context, input interface{}) (interface{}, error)

// ToolDefinition describes a tool that can be invoked by agents.
// Tools provide structured capabilities for data fetching, analysis, and actions.
type ToolDefinition struct {
	// Name is the unique identifier for this tool.
	// Names should be lowercase, hyphen-separated, and descriptive
	// (e.g., "fetch-market-data", "calculate-rsi", "analyze-sentiment").
	Name string `json:"name"`

	// Description provides a brief explanation of what the tool does.
	// This is used by AI agents to understand when to use the tool.
	Description string `json:"description"`

	// Category groups related tools together.
	// See constants.go for predefined categories.
	Category ToolCategory `json:"category"`

	// Version is the semantic version of the tool definition.
	Version string `json:"version"`

	// InputSchema defines the expected input structure using JSON Schema.
	// This enables input validation and AI agent understanding.
	InputSchema map[string]interface{} `json:"input_schema"`

	// OutputSchema defines the expected output structure using JSON Schema.
	// This enables output validation and type safety.
	OutputSchema map[string]interface{} `json:"output_schema"`

	// Handler is the function that executes the tool logic.
	// Must not be nil for a valid tool definition.
	Handler ToolHandler `json:"-"`

	// Timeout is the maximum duration the tool can run.
	// Default is used if not specified (see constants.go).
	Timeout time.Duration `json:"timeout"`

	// RetryPolicy defines how failed executions should be retried.
	RetryPolicy RetryPolicy `json:"retry_policy,omitempty"`

	// Permissions lists the permissions required to use this tool.
	// Users/agents must have at least one matching permission.
	Permissions []Permission `json:"permissions"`

	// RateLimit defines the rate limiting configuration for this tool.
	RateLimit *RateLimitConfig `json:"rate_limit,omitempty"`

	// CacheConfig defines caching behavior for tool results.
	CacheConfig *CacheConfig `json:"cache_config,omitempty"`

	// Deprecation indicates if this tool is deprecated.
	Deprecation *DeprecationInfo `json:"deprecation,omitempty"`

	// Examples provides example inputs and outputs for documentation.
	Examples []ToolExample `json:"examples,omitempty"`

	// Tags are arbitrary labels for filtering and discovery.
	Tags []string `json:"tags,omitempty"`

	// Metadata contains additional tool-specific configuration.
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// ToolCategory represents the category of a tool.
type ToolCategory string

const (
	// CategoryDataMarket represents market data tools (prices, volumes, etc.).
	CategoryDataMarket ToolCategory = "data.market"

	// CategoryDataFundamental represents fundamental data tools (earnings, ratios, etc.).
	CategoryDataFundamental ToolCategory = "data.fundamental"

	// CategoryDataNews represents news and sentiment data tools.
	CategoryDataNews ToolCategory = "data.news"

	// CategoryDataAlternative represents alternative data tools (social, satellite, etc.).
	CategoryDataAlternative ToolCategory = "data.alternative"

	// CategoryAnalysisTechnical represents technical analysis tools.
	CategoryAnalysisTechnical ToolCategory = "analysis.technical"

	// CategoryAnalysisFundamental represents fundamental analysis tools.
	CategoryAnalysisFundamental ToolCategory = "analysis.fundamental"

	// CategoryAnalysisSentiment represents sentiment analysis tools.
	CategoryAnalysisSentiment ToolCategory = "analysis.sentiment"

	// CategoryAnalysisRisk represents risk analysis tools.
	CategoryAnalysisRisk ToolCategory = "analysis.risk"

	// CategoryAnalysisPortfolio represents portfolio analysis tools.
	CategoryAnalysisPortfolio ToolCategory = "analysis.portfolio"

	// CategoryActionTrade represents trade execution tools.
	CategoryActionTrade ToolCategory = "action.trade"

	// CategoryActionAlert represents alert and notification tools.
	CategoryActionAlert ToolCategory = "action.alert"

	// CategoryActionReport represents reporting and export tools.
	CategoryActionReport ToolCategory = "action.report"

	// CategoryUtility represents general utility tools.
	CategoryUtility ToolCategory = "utility"

	// CategorySystem represents system-level tools.
	CategorySystem ToolCategory = "system"
)

// RetryPolicy defines how failed tool executions should be retried.
type RetryPolicy struct {
	// MaxAttempts is the maximum number of retry attempts (0 = no retry).
	MaxAttempts int `json:"max_attempts"`

	// InitialDelay is the delay before the first retry.
	InitialDelay time.Duration `json:"initial_delay"`

	// MaxDelay is the maximum delay between retries.
	MaxDelay time.Duration `json:"max_delay"`

	// Multiplier is the factor by which delay increases (exponential backoff).
	Multiplier float64 `json:"multiplier"`

	// RetryableErrors lists error types that should trigger retry.
	// If empty, all errors are retryable.
	RetryableErrors []string `json:"retryable_errors,omitempty"`
}

// RateLimitConfig defines rate limiting for tool invocations.
type RateLimitConfig struct {
	// RequestsPerSecond is the maximum requests per second.
	RequestsPerSecond float64 `json:"requests_per_second"`

	// Burst allows temporary bursting above the rate limit.
	Burst int `json:"burst"`

	// KeyPattern defines how to extract the rate limit key from context.
	// Supports templates like "{user_id}", "{agent_id}", "{ip}".
	KeyPattern string `json:"key_pattern,omitempty"`
}

// CacheConfig defines caching behavior for tool results.
type CacheConfig struct {
	// Enabled determines if caching is enabled for this tool.
	Enabled bool `json:"enabled"`

	// TTL is the time-to-live for cached results.
	TTL time.Duration `json:"ttl"`

	// KeyPattern defines how to generate cache keys.
	// Supports templates like "{tool_name}:{input_hash}".
	KeyPattern string `json:"key_pattern,omitempty"`

	// VaryBy lists input fields that should be included in cache key.
	VaryBy []string `json:"vary_by,omitempty"`
}

// DeprecationInfo provides information about deprecated tools.
type DeprecationInfo struct {
	// Deprecated indicates if the tool is deprecated.
	Deprecated bool `json:"deprecated"`

	// Message explains the deprecation reason.
	Message string `json:"message,omitempty"`

	// RemovalVersion indicates when the tool will be removed.
	RemovalVersion string `json:"removal_version,omitempty"`

	// ReplacementTool suggests an alternative tool.
	ReplacementTool string `json:"replacement_tool,omitempty"`

	// SunsetDate is when the tool will be removed.
	SunsetDate *time.Time `json:"sunset_date,omitempty"`
}

// ToolExample provides an example input/output pair for a tool.
type ToolExample struct {
	// Description explains what this example demonstrates.
	Description string `json:"description"`

	// Input is the example input for the tool.
	Input interface{} `json:"input"`

	// Output is the expected output for the given input.
	Output interface{} `json:"output"`
}

// ============================================================
// PERMISSION SYSTEM TYPES
// ============================================================

// Permission represents a capability that can be granted to users or agents.
type Permission string

const (
	// PermissionReadMarketData allows reading market data.
	PermissionReadMarketData Permission = "read:market_data"

	// PermissionReadFundamentalData allows reading fundamental data.
	PermissionReadFundamentalData Permission = "read:fundamental_data"

	// PermissionReadNewsData allows reading news and sentiment data.
	PermissionReadNewsData Permission = "read:news_data"

	// PermissionReadAlternativeData allows reading alternative data.
	PermissionReadAlternativeData Permission = "read:alternative_data"

	// PermissionAnalyzeTechnical allows technical analysis operations.
	PermissionAnalyzeTechnical Permission = "analyze:technical"

	// PermissionAnalyzeFundamental allows fundamental analysis operations.
	PermissionAnalyzeFundamental Permission = "analyze:fundamental"

	// PermissionAnalyzeSentiment allows sentiment analysis operations.
	PermissionAnalyzeSentiment Permission = "analyze:sentiment"

	// PermissionAnalyzeRisk allows risk analysis operations.
	PermissionAnalyzeRisk Permission = "analyze:risk"

	// PermissionAnalyzePortfolio allows portfolio analysis operations.
	PermissionAnalyzePortfolio Permission = "analyze:portfolio"

	// PermissionProposeTrade allows proposing trades for human review.
	PermissionProposeTrade Permission = "propose:trade"

	// PermissionExecuteTrade allows executing trades (requires HITL approval).
	PermissionExecuteTrade Permission = "execute:trade"

	// PermissionManageAlerts allows creating and managing alerts.
	PermissionManageAlerts Permission = "manage:alerts"

	// PermissionViewReports allows viewing reports.
	PermissionViewReports Permission = "view:reports"

	// PermissionExportData allows exporting data.
	PermissionExportData Permission = "export:data"

	// PermissionAdmin allows administrative operations.
	PermissionAdmin Permission = "admin"

	// PermissionPluginManage allows managing plugins.
	PermissionPluginManage Permission = "plugin:manage"

	// PermissionSystemMonitor allows system monitoring operations.
	PermissionSystemMonitor Permission = "system:monitor"
)

// ============================================================
// EXECUTION CONTEXT TYPES
// ============================================================

// ExecutionContext provides context for agent and tool execution.
type ExecutionContext struct {
	// RequestID is a unique identifier for tracing the request.
	RequestID string `json:"request_id"`

	// UserID is the identifier of the user making the request.
	UserID string `json:"user_id"`

	// AgentID is the identifier of the agent executing the request.
	AgentID string `json:"agent_id"`

	// SessionID is the session identifier for conversation continuity.
	SessionID string `json:"session_id,omitempty"`

	// Permissions are the permissions granted for this execution.
	Permissions []Permission `json:"permissions"`

	// Metadata contains additional execution context.
	Metadata map[string]interface{} `json:"metadata,omitempty"`

	// StartTime is when the execution began.
	StartTime time.Time `json:"start_time"`

	// Deadline is the latest time the execution must complete.
	Deadline time.Time `json:"deadline"`

	// ParentSpanID is the tracing span ID of the parent operation.
	ParentSpanID string `json:"parent_span_id,omitempty"`
}

// ExecutionResult contains the result of an agent or tool execution.
type ExecutionResult struct {
	// Success indicates if the execution completed successfully.
	Success bool `json:"success"`

	// Output contains the execution result (if successful).
	Output interface{} `json:"output,omitempty"`

	// Error contains error details (if failed).
	Error *ExecutionError `json:"error,omitempty"`

	// Duration is the total execution time.
	Duration time.Duration `json:"duration"`

	// Metadata contains additional result metadata.
	Metadata map[string]interface{} `json:"metadata,omitempty"`

	// Warnings contains non-fatal issues encountered during execution.
	Warnings []string `json:"warnings,omitempty"`
}

// ExecutionError contains structured error information.
type ExecutionError struct {
	// Code is a machine-readable error code.
	Code string `json:"code"`

	// Message is a human-readable error message.
	Message string `json:"message"`

	// Details contains additional error context.
	Details map[string]interface{} `json:"details,omitempty"`

	// Retryable indicates if the operation can be retried.
	Retryable bool `json:"retryable"`

	// Stack contains the error stack trace (for debugging).
	Stack string `json:"stack,omitempty"`
}
