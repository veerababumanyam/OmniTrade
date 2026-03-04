// Package agent provides multi-agent orchestration for the OmniTrade Intelligence Plane.
// This file defines system constants for hooks, tools, permissions, and configuration.
package agent

import "time"

// ============================================================
// HOOK EVENT NAMES
// ============================================================

// Hook event names define the points in the agent lifecycle where hooks can be attached.
// Event names follow a hierarchical pattern: <phase>.<action>
const (
	// PreAgentExecute is triggered before an agent begins execution.
	// Hooks can modify input or abort execution by returning an error.
	HookPreAgentExecute = "agent.pre_execute"

	// PostAgentExecute is triggered after an agent completes execution.
	// Hooks receive the output and can modify or log results.
	HookPostAgentExecute = "agent.post_execute"

	// OnAgentError is triggered when an agent encounters an error.
	// Hooks can implement error handling, logging, or recovery logic.
	HookOnAgentError = "agent.on_error"

	// OnAgentRetry is triggered before an agent execution is retried.
	// Hooks can implement custom retry logic or logging.
	HookOnAgentRetry = "agent.on_retry"

	// PreToolInvoke is triggered before a tool is invoked.
	// Hooks can validate inputs, implement caching, or add tracing.
	HookPreToolInvoke = "tool.pre_invoke"

	// PostToolInvoke is triggered after a tool completes.
	// Hooks can process outputs, update caches, or record metrics.
	HookPostToolInvoke = "tool.post_invoke"

	// OnToolError is triggered when a tool invocation fails.
	// Hooks can implement fallback logic or error reporting.
	HookOnToolError = "tool.on_error"

	// OnToolRetry is triggered before a tool invocation is retried.
	// Hooks can implement custom retry delay or logging.
	HookOnToolRetry = "tool.on_retry"

	// PreFlowExecute is triggered before a Genkit flow starts.
	// Flow-level hooks are specific to Genkit orchestration.
	HookPreFlowExecute = "flow.pre_execute"

	// PostFlowExecute is triggered after a Genkit flow completes.
	// Hooks receive the flow output and can perform post-processing.
	HookPostFlowExecute = "flow.post_execute"

	// OnFlowError is triggered when a Genkit flow encounters an error.
	// Hooks can implement flow-level error handling.
	HookOnFlowError = "flow.on_error"

	// OnPluginLoad is triggered when a plugin is loaded.
	// Hooks can perform plugin validation or initialization.
	HookOnPluginLoad = "plugin.on_load"

	// OnPluginUnload is triggered when a plugin is unloaded.
	// Hooks can perform cleanup or state persistence.
	HookOnPluginUnload = "plugin.on_unload"

	// PreTradeProposal is triggered before a trade proposal is generated.
	// This is a domain-specific hook for the trading workflow.
	HookPreTradeProposal = "trade.pre_proposal"

	// PostTradeProposal is triggered after a trade proposal is generated.
	// Hooks can implement compliance checks or risk validation.
	HookPostTradeProposal = "trade.post_proposal"

	// PreDataIngestion is triggered before market data is ingested.
	// Hooks can implement data validation or preprocessing.
	HookPreDataIngestion = "data.pre_ingestion"

	// PostDataIngestion is triggered after market data is ingested.
	// Hooks can implement data quality checks or indexing.
	HookPostDataIngestion = "data.post_ingestion"

	// OnDataAnomaly is triggered when a data anomaly is detected.
	// Hooks can implement alerting or anomaly handling.
	HookOnDataAnomaly = "data.on_anomaly"
)

// ============================================================
// HOOK PRIORITY RANGES
// ============================================================

// Hook priority ranges define standard priority bands for different hook types.
// Lower numbers execute first. Hooks within the same priority band execute in
// registration order (undefined for concurrent registration).
const (
	// PrioritySystemMin is the minimum priority for system hooks.
	PrioritySystemMin = 0

	// PrioritySystemMax is the maximum priority for system hooks.
	PrioritySystemMax = 99

	// PriorityLoggingMin is the minimum priority for logging hooks.
	PriorityLoggingMin = 100

	// PriorityLoggingMax is the maximum priority for logging hooks.
	PriorityLoggingMax = 149

	// PriorityMetricsMin is the minimum priority for metrics hooks.
	PriorityMetricsMin = 150

	// PriorityMetricsMax is the maximum priority for metrics hooks.
	PriorityMetricsMax = 199

	// PriorityBusinessMin is the minimum priority for business logic hooks.
	PriorityBusinessMin = 200

	// PriorityBusinessMax is the maximum priority for business logic hooks.
	PriorityBusinessMax = 299

	// PriorityExtensionMin is the minimum priority for custom extension hooks.
	PriorityExtensionMin = 300

	// PriorityExtensionMax is the maximum priority for custom extension hooks.
	PriorityExtensionMax = 399

	// PriorityDefault is the default priority assigned when not specified.
	PriorityDefault = PriorityBusinessMin
)

// ============================================================
// TOOL CATEGORY GROUPS
// ============================================================

// Tool category groups allow filtering tools by high-level category.
const (
	// ToolGroupData includes all data fetching tools.
	ToolGroupData = "data"

	// ToolGroupAnalysis includes all analysis tools.
	ToolGroupAnalysis = "analysis"

	// ToolGroupAction includes all action/execution tools.
	ToolGroupAction = "action"

	// ToolGroupUtility includes utility tools.
	ToolGroupUtility = "utility"

	// ToolGroupSystem includes system-level tools.
	ToolGroupSystem = "system"
)

// ToolCategoriesByGroup maps category groups to their constituent categories.
var ToolCategoriesByGroup = map[string][]ToolCategory{
	ToolGroupData: {
		CategoryDataMarket,
		CategoryDataFundamental,
		CategoryDataNews,
		CategoryDataAlternative,
	},
	ToolGroupAnalysis: {
		CategoryAnalysisTechnical,
		CategoryAnalysisFundamental,
		CategoryAnalysisSentiment,
		CategoryAnalysisRisk,
		CategoryAnalysisPortfolio,
	},
	ToolGroupAction: {
		CategoryActionTrade,
		CategoryActionAlert,
		CategoryActionReport,
	},
	ToolGroupUtility: {
		CategoryUtility,
	},
	ToolGroupSystem: {
		CategorySystem,
	},
}

// ============================================================
// PERMISSION GROUPS
// ============================================================

// Permission groups bundle related permissions for easier role assignment.
const (
	// RoleReadOnly provides read access to all data types.
	RoleReadOnly = "role:readonly"

	// RoleAnalyst provides analysis capabilities plus read access.
	RoleAnalyst = "role:analyst"

	// RoleTrader provides trade proposal capabilities plus analyst permissions.
	RoleTrader = "role:trader"

	// RoleAdmin provides full administrative access.
	RoleAdmin = "role:admin"
)

// PermissionsByRole maps roles to their constituent permissions.
var PermissionsByRole = map[string][]Permission{
	RoleReadOnly: {
		PermissionReadMarketData,
		PermissionReadFundamentalData,
		PermissionReadNewsData,
		PermissionReadAlternativeData,
		PermissionViewReports,
	},
	RoleAnalyst: {
		PermissionReadMarketData,
		PermissionReadFundamentalData,
		PermissionReadNewsData,
		PermissionReadAlternativeData,
		PermissionAnalyzeTechnical,
		PermissionAnalyzeFundamental,
		PermissionAnalyzeSentiment,
		PermissionAnalyzeRisk,
		PermissionAnalyzePortfolio,
		PermissionViewReports,
	},
	RoleTrader: {
		PermissionReadMarketData,
		PermissionReadFundamentalData,
		PermissionReadNewsData,
		PermissionReadAlternativeData,
		PermissionAnalyzeTechnical,
		PermissionAnalyzeFundamental,
		PermissionAnalyzeSentiment,
		PermissionAnalyzeRisk,
		PermissionAnalyzePortfolio,
		PermissionProposeTrade,
		PermissionManageAlerts,
		PermissionViewReports,
		PermissionExportData,
	},
	RoleAdmin: {
		PermissionReadMarketData,
		PermissionReadFundamentalData,
		PermissionReadNewsData,
		PermissionReadAlternativeData,
		PermissionAnalyzeTechnical,
		PermissionAnalyzeFundamental,
		PermissionAnalyzeSentiment,
		PermissionAnalyzeRisk,
		PermissionAnalyzePortfolio,
		PermissionProposeTrade,
		PermissionExecuteTrade,
		PermissionManageAlerts,
		PermissionViewReports,
		PermissionExportData,
		PermissionAdmin,
		PermissionPluginManage,
		PermissionSystemMonitor,
	},
}

// ============================================================
// TIMEOUT DEFAULTS
// ============================================================

// Timeout constants define default durations for various operations.
// These can be overridden per-operation using context deadlines.
const (
	// DefaultToolTimeout is the default timeout for tool invocations.
	DefaultToolTimeout = 30 * time.Second

	// DefaultAgentTimeout is the default timeout for agent execution.
	DefaultAgentTimeout = 2 * time.Minute

	// DefaultFlowTimeout is the default timeout for Genkit flows.
	DefaultFlowTimeout = 5 * time.Minute

	// DefaultPluginInitTimeout is the timeout for plugin initialization.
	DefaultPluginInitTimeout = 30 * time.Second

	// DefaultPluginStopTimeout is the timeout for graceful plugin shutdown.
	DefaultPluginStopTimeout = 10 * time.Second

	// DefaultHookTimeout is the timeout for individual hook execution.
	DefaultHookTimeout = 5 * time.Second

	// DefaultDatabaseQueryTimeout is the timeout for database queries.
	DefaultDatabaseQueryTimeout = 10 * time.Second

	// DefaultHTTPRequestTimeout is the timeout for external HTTP requests.
	DefaultHTTPRequestTimeout = 15 * time.Second

	// DefaultCacheTTL is the default TTL for cached results.
	DefaultCacheTTL = 5 * time.Minute

	// DefaultHealthCheckInterval is the interval between health checks.
	DefaultHealthCheckInterval = 30 * time.Second

	// MaxTradeProposalTimeout is the maximum timeout for trade proposals.
	MaxTradeProposalTimeout = 30 * time.Second
)

// ============================================================
// CIRCUIT BREAKER THRESHOLDS
// ============================================================

// Circuit breaker constants define thresholds for fault tolerance.
// Circuit breakers prevent cascading failures by failing fast when
// a service is experiencing problems.
const (
	// CircuitBreakerDefaultThreshold is the number of failures before opening.
	CircuitBreakerDefaultThreshold = 5

	// CircuitBreakerDefaultTimeout is how long to wait before attempting reset.
	CircuitBreakerDefaultTimeout = 30 * time.Second

	// CircuitBreakerDefaultSuccessThreshold is successes needed to close.
	CircuitBreakerDefaultSuccessThreshold = 2

	// CircuitBreakerHalfOpenRequests is the number of test requests in half-open state.
	CircuitBreakerHalfOpenRequests = 3

	// CircuitBreakerMinTimeout is the minimum circuit breaker timeout.
	CircuitBreakerMinTimeout = 5 * time.Second

	// CircuitBreakerMaxTimeout is the maximum circuit breaker timeout.
	CircuitBreakerMaxTimeout = 5 * time.Minute
)

// CircuitBreakerState represents the state of a circuit breaker.
type CircuitBreakerState string

const (
	// CircuitBreakerStateClosed means requests flow normally.
	CircuitBreakerStateClosed CircuitBreakerState = "closed"

	// CircuitBreakerStateOpen means requests fail immediately.
	CircuitBreakerStateOpen CircuitBreakerState = "open"

	// CircuitBreakerStateHalfOpen means limited requests are allowed to test.
	CircuitBreakerStateHalfOpen CircuitBreakerState = "half_open"
)

// ============================================================
// RETRY DEFAULTS
// ============================================================

// Retry constants define default retry behavior for transient failures.
const (
	// RetryDefaultMaxAttempts is the default maximum retry attempts.
	RetryDefaultMaxAttempts = 3

	// RetryDefaultInitialDelay is the initial delay before first retry.
	RetryDefaultInitialDelay = 100 * time.Millisecond

	// RetryDefaultMaxDelay is the maximum delay between retries.
	RetryDefaultMaxDelay = 5 * time.Second

	// RetryDefaultMultiplier is the exponential backoff multiplier.
	RetryDefaultMultiplier = 2.0

	// RetryJitterMaxPercent is the maximum jitter percentage (0-100).
	RetryJitterMaxPercent = 20
)

// ============================================================
// RATE LIMIT DEFAULTS
// ============================================================

// Rate limit constants define default rate limiting behavior.
const (
	// RateLimitDefaultRPS is the default requests per second per tool.
	RateLimitDefaultRPS = 10.0

	// RateLimitDefaultBurst is the default burst capacity.
	RateLimitDefaultBurst = 20

	// RateLimitGlobalRPS is the global requests per second limit.
	RateLimitGlobalRPS = 100.0

	// RateLimitGlobalBurst is the global burst capacity.
	RateLimitGlobalBurst = 200

	// RateLimitUserRPS is the per-user requests per second limit.
	RateLimitUserRPS = 20.0

	// RateLimitUserBurst is the per-user burst capacity.
	RateLimitUserBurst = 40

	// RateLimitAgentRPS is the per-agent requests per second limit.
	RateLimitAgentRPS = 50.0

	// RateLimitAgentBurst is the per-agent burst capacity.
	RateLimitAgentBurst = 100
)

// ============================================================
// METRIC NAMES
// ============================================================

// Metric name constants for monitoring and observability.
const (
	// MetricToolInvocations counts tool invocations.
	MetricToolInvocations = "omnitrade.tool.invocations"

	// MetricToolDuration records tool execution duration.
	MetricToolDuration = "omnitrade.tool.duration"

	// MetricToolErrors counts tool errors.
	MetricToolErrors = "omnitrade.tool.errors"

	// MetricAgentInvocations counts agent invocations.
	MetricAgentInvocations = "omnitrade.agent.invocations"

	// MetricAgentDuration records agent execution duration.
	MetricAgentDuration = "omnitrade.agent.duration"

	// MetricAgentErrors counts agent errors.
	MetricAgentErrors = "omnitrade.agent.errors"

	// MetricHookDuration records hook execution duration.
	MetricHookDuration = "omnitrade.hook.duration"

	// MetricHookErrors counts hook errors.
	MetricHookErrors = "omnitrade.hook.errors"

	// MetricFlowInvocations counts Genkit flow invocations.
	MetricFlowInvocations = "omnitrade.flow.invocations"

	// MetricFlowDuration records Genkit flow duration.
	MetricFlowDuration = "omnitrade.flow.duration"

	// MetricPluginHealth records plugin health status.
	MetricPluginHealth = "omnitrade.plugin.health"

	// MetricTradeProposals counts trade proposals generated.
	MetricTradeProposals = "omnitrade.trade.proposals"

	// MetricTradeConfidence records trade confidence scores.
	MetricTradeConfidence = "omnitrade.trade.confidence"

	// MetricCircuitBreakerState records circuit breaker state changes.
	MetricCircuitBreakerState = "omnitrade.circuit_breaker.state"

	// MetricCacheHits counts cache hits.
	MetricCacheHits = "omnitrade.cache.hits"

	// MetricCacheMisses counts cache misses.
	MetricCacheMisses = "omnitrade.cache.misses"

	// MetricDatabaseQueries counts database queries.
	MetricDatabaseQueries = "omnitrade.database.queries"

	// MetricDatabaseDuration records database query duration.
	MetricDatabaseDuration = "omnitrade.database.duration"
)

// ============================================================
// ERROR CODES
// ============================================================

// Error code constants for structured error handling.
// Error codes follow a pattern: <domain>.<type>.<detail>
const (
	// ErrCodeInternal indicates an internal system error.
	ErrCodeInternal = "internal.error"

	// ErrCodeTimeout indicates an operation timed out.
	ErrCodeTimeout = "internal.timeout"

	// ErrCodeCancelled indicates an operation was cancelled.
	ErrCodeCancelled = "internal.cancelled"

	// ErrCodeInvalidInput indicates invalid input was provided.
	ErrCodeInvalidInput = "input.invalid"

	// ErrCodeMissingInput indicates required input is missing.
	ErrCodeMissingInput = "input.missing"

	// ErrCodeUnauthorized indicates authentication is required.
	ErrCodeUnauthorized = "auth.unauthorized"

	// ErrCodeForbidden indicates the action is not permitted.
	ErrCodeForbidden = "auth.forbidden"

	// ErrCodeNotFound indicates the requested resource was not found.
	ErrCodeNotFound = "resource.not_found"

	// ErrCodeAlreadyExists indicates the resource already exists.
	ErrCodeAlreadyExists = "resource.already_exists"

	// ErrCodeConflict indicates a resource conflict.
	ErrCodeConflict = "resource.conflict"

	// ErrCodeRateLimited indicates rate limit was exceeded.
	ErrCodeRateLimited = "rate_limit.exceeded"

	// ErrCodeCircuitOpen indicates the circuit breaker is open.
	ErrCodeCircuitOpen = "circuit_breaker.open"

	// ErrCodeToolNotFound indicates the requested tool was not found.
	ErrCodeToolNotFound = "tool.not_found"

	// ErrCodeToolTimeout indicates a tool execution timed out.
	ErrCodeToolTimeout = "tool.timeout"

	// ErrCodeToolError indicates a tool execution failed.
	ErrCodeToolError = "tool.error"

	// ErrCodePluginInit indicates a plugin initialization failed.
	ErrCodePluginInit = "plugin.init_failed"

	// ErrCodePluginNotFound indicates a plugin was not found.
	ErrCodePluginNotFound = "plugin.not_found"

	// ErrCodePluginDependency indicates a plugin dependency error.
	ErrCodePluginDependency = "plugin.dependency_error"

	// ErrCodeDatabaseError indicates a database operation failed.
	ErrCodeDatabaseError = "database.error"

	// ErrCodeDatabaseTimeout indicates a database query timed out.
	ErrCodeDatabaseTimeout = "database.timeout"

	// ErrCodeExternalAPI indicates an external API call failed.
	ErrCodeExternalAPI = "external.api_error"

	// ErrCodeExternalTimeout indicates an external API call timed out.
	ErrCodeExternalTimeout = "external.timeout"

	// ErrCodeTradeValidation indicates trade validation failed.
	ErrCodeTradeValidation = "trade.validation_failed"

	// ErrCodeTradeRiskLimit indicates a risk limit was exceeded.
	ErrCodeTradeRiskLimit = "trade.risk_limit_exceeded"

	// ErrCodeDataValidation indicates data validation failed.
	ErrCodeDataValidation = "data.validation_failed"

	// ErrCodeDataStale indicates data is too old to be useful.
	ErrCodeDataStale = "data.stale"
)

// ============================================================
// CONFIGURATION KEYS
// ============================================================

// Configuration key constants for plugin and system configuration.
const (
	// ConfigLogLevel is the key for log level configuration.
	ConfigLogLevel = "log.level"

	// ConfigLogFormat is the key for log format configuration.
	ConfigLogFormat = "log.format"

	// ConfigDatabaseMaxConnections is the key for max database connections.
	ConfigDatabaseMaxConnections = "database.max_connections"

	// ConfigCacheEnabled is the key for cache enable/disable.
	ConfigCacheEnabled = "cache.enabled"

	// ConfigCacheDefaultTTL is the key for default cache TTL.
	ConfigCacheDefaultTTL = "cache.default_ttl"

	// ConfigCircuitBreakerEnabled is the key for circuit breaker enable/disable.
	ConfigCircuitBreakerEnabled = "circuit_breaker.enabled"

	// ConfigCircuitBreakerThreshold is the key for circuit breaker threshold.
	ConfigCircuitBreakerThreshold = "circuit_breaker.threshold"

	// ConfigRateLimitEnabled is the key for rate limiting enable/disable.
	ConfigRateLimitEnabled = "rate_limit.enabled"

	// ConfigRateLimitDefaultRPS is the key for default rate limit.
	ConfigRateLimitDefaultRPS = "rate_limit.default_rps"

	// ConfigPluginDirectory is the key for plugin directory path.
	ConfigPluginDirectory = "plugin.directory"

	// ConfigPluginAutoLoad is the key for plugin auto-loading.
	ConfigPluginAutoLoad = "plugin.auto_load"

	// ConfigAgentDefaultTimeout is the key for default agent timeout.
	ConfigAgentDefaultTimeout = "agent.default_timeout"

	// ConfigToolDefaultTimeout is the key for default tool timeout.
	ConfigToolDefaultTimeout = "tool.default_timeout"

	// ConfigTracingEnabled is the key for tracing enable/disable.
	ConfigTracingEnabled = "tracing.enabled"

	// ConfigTracingSamplingRate is the key for tracing sampling rate.
	ConfigTracingSamplingRate = "tracing.sampling_rate"

	// ConfigMetricsEnabled is the key for metrics enable/disable.
	ConfigMetricsEnabled = "metrics.enabled"

	// ConfigMetricsReportingInterval is the key for metrics reporting interval.
	ConfigMetricsReportingInterval = "metrics.reporting_interval"
)

// ============================================================
// TRADE-SPECIFIC CONSTANTS
// ============================================================

// Trade-specific constants for the OmniTrade platform.
const (
	// MinConfidenceThreshold is the minimum confidence score for trade proposals.
	// Proposals below this threshold will not be submitted for human review.
	MinConfidenceThreshold = 0.7

	// MaxPositionSizePercent is the maximum position size as a percentage of portfolio.
	MaxPositionSizePercent = 5.0

	// MaxDailyTrades is the maximum number of trades per day per asset.
	MaxDailyTrades = 10

	// MaxConcurrentProposals is the maximum number of pending trade proposals.
	MaxConcurrentProposals = 100

	// DefaultRiskFreeRate is the default risk-free rate for calculations.
	DefaultRiskFreeRate = 0.05

	// MaxDrawdownPercent is the maximum allowed portfolio drawdown percentage.
	MaxDrawdownPercent = 20.0
)

// TradeAction represents the type of trade action.
type TradeAction string

const (
	// TradeActionBuy represents a buy order.
	TradeActionBuy TradeAction = "BUY"

	// TradeActionSell represents a sell order.
	TradeActionSell TradeAction = "SELL"

	// TradeActionHold represents no action (hold position).
	TradeActionHold TradeAction = "HOLD"
)

// ProposalStatus represents the status of a trade proposal.
type ProposalStatus string

const (
	// ProposalStatusPending indicates the proposal is awaiting review.
	ProposalStatusPending ProposalStatus = "PENDING"

	// ProposalStatusApproved indicates the proposal has been approved.
	ProposalStatusApproved ProposalStatus = "APPROVED"

	// ProposalStatusRejected indicates the proposal has been rejected.
	ProposalStatusRejected ProposalStatus = "REJECTED"

	// ProposalStatusExecuted indicates the proposal has been executed.
	ProposalStatusExecuted ProposalStatus = "EXECUTED"

	// ProposalStatusExpired indicates the proposal has expired.
	ProposalStatusExpired ProposalStatus = "EXPIRED"

	// ProposalStatusCancelled indicates the proposal has been cancelled.
	ProposalStatusCancelled ProposalStatus = "CANCELLED"
)

// ============================================================
// AGENT IDENTIFIERS
// ============================================================

// Agent identifiers for the multi-agent orchestration system.
const (
	// AgentDataFetcher is the data fetching agent ID.
	AgentDataFetcher = "data-fetcher"

	// AgentRAG is the retrieval-augmented generation agent ID.
	AgentRAG = "rag-retriever"

	// AgentPortfolioManager is the portfolio manager agent ID.
	AgentPortfolioManager = "portfolio-manager"

	// AgentRiskAnalyzer is the risk analysis agent ID.
	AgentRiskAnalyzer = "risk-analyzer"

	// AgentSentimentAnalyzer is the sentiment analysis agent ID.
	AgentSentimentAnalyzer = "sentiment-analyzer"

	// AgentTechnicalAnalyzer is the technical analysis agent ID.
	AgentTechnicalAnalyzer = "technical-analyzer"

	// AgentOrchestrator is the main orchestrator agent ID.
	AgentOrchestrator = "orchestrator"
)

// ============================================================
// GENKIT FLOW NAMES
// ============================================================

// Genkit flow names for the orchestration system.
const (
	// FlowGenerateTradeProposal is the trade proposal generation flow.
	FlowGenerateTradeProposal = "GenerateTradeProposal"

	// FlowAnalyzeMarket is the market analysis flow.
	FlowAnalyzeMarket = "AnalyzeMarket"

	// FlowAnalyzeRisk is the risk analysis flow.
	FlowAnalyzeRisk = "AnalyzeRisk"

	// FlowAnalyzeSentiment is the sentiment analysis flow.
	FlowAnalyzeSentiment = "AnalyzeSentiment"

	// FlowFetchData is the data fetching flow.
	FlowFetchData = "FetchData"
)
