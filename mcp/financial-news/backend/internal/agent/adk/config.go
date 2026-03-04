// Package adk provides Google Agent Development Kit integration for OmniTrade.
// It wraps tools as ADK FunctionTool instances and creates agents for the
// multi-agent trading system.
package adk

import (
	"context"
	"fmt"
	"time"

	"go.uber.org/zap"
)

// ModelProvider represents the LLM provider type
type ModelProvider string

const (
	// ModelProviderGemini uses Google Gemini models
	ModelProviderGemini ModelProvider = "gemini"
	// ModelProviderClaude uses Anthropic Claude models
	ModelProviderClaude ModelProvider = "claude"
)

// ModelConfig contains configuration for a specific model
type ModelConfig struct {
	// Provider is the LLM provider (gemini or claude)
	Provider ModelProvider `json:"provider"`

	// ModelID is the specific model identifier
	ModelID string `json:"model_id"`

	// Temperature controls randomness (0.0 - 1.0)
	Temperature float64 `json:"temperature"`

	// MaxTokens is the maximum tokens in response
	MaxTokens int `json:"max_tokens"`

	// TopP controls diversity via nucleus sampling
	TopP float64 `json:"top_p"`

	// TopK controls diversity via top-k sampling
	TopK int `json:"top_k"`
}

// DefaultGeminiConfig returns the default Gemini model configuration
func DefaultGeminiConfig() *ModelConfig {
	return &ModelConfig{
		Provider:    ModelProviderGemini,
		ModelID:     "gemini-1.5-pro",
		Temperature: 0.7,
		MaxTokens:   4096,
		TopP:        0.95,
		TopK:        40,
	}
}

// DefaultClaudeConfig returns the default Claude model configuration
func DefaultClaudeConfig() *ModelConfig {
	return &ModelConfig{
		Provider:    ModelProviderClaude,
		ModelID:     "claude-3-5-sonnet-20241022",
		Temperature: 0.7,
		MaxTokens:   4096,
		TopP:        0.95,
		TopK:        0, // Claude doesn't use TopK
	}
}

// AgentType represents the type of trading agent
type AgentType string

const (
	// AgentTypeFundamentalAnalyst analyzes fundamental data
	AgentTypeFundamentalAnalyst AgentType = "fundamental_analyst"
	// AgentTypeTechnicalAnalyst analyzes technical indicators
	AgentTypeTechnicalAnalyst AgentType = "technical_analyst"
	// AgentTypeSentimentAnalyst analyzes market sentiment
	AgentTypeSentimentAnalyst AgentType = "sentiment_analyst"
	// AgentTypeRiskManager assesses and manages risk
	AgentTypeRiskManager AgentType = "risk_manager"
	// AgentTypePortfolioManager makes portfolio decisions
	AgentTypePortfolioManager AgentType = "portfolio_manager"
)

// AgentConfig contains configuration for an ADK agent
type AgentConfig struct {
	// ID is the unique identifier for this agent
	ID string `json:"id"`

	// Name is the human-readable name
	Name string `json:"name"`

	// Type is the agent type
	Type AgentType `json:"type"`

	// Description explains what the agent does
	Description string `json:"description"`

	// SystemPrompt is the base system prompt for the agent
	SystemPrompt string `json:"system_prompt"`

	// Model is the model configuration
	Model *ModelConfig `json:"model"`

	// Tools is the list of tool names this agent can use
	Tools []string `json:"tools"`

	// MaxIterations is the maximum reasoning iterations
	MaxIterations int `json:"max_iterations"`

	// Timeout is the maximum execution time
	Timeout time.Duration `json:"timeout"`

	// RetryCount is the number of retries on failure
	RetryCount int `json:"retry_count"`

	// Enabled indicates if the agent is active
	Enabled bool `json:"enabled"`

	// Metadata contains additional agent-specific configuration
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// Validate validates the agent configuration
func (c *AgentConfig) Validate() error {
	if c.ID == "" {
		return fmt.Errorf("agent id is required")
	}
	if c.Name == "" {
		return fmt.Errorf("agent name is required")
	}
	if c.Type == "" {
		return fmt.Errorf("agent type is required")
	}
	if c.Model == nil {
		return fmt.Errorf("model configuration is required")
	}
	if c.Timeout <= 0 {
		c.Timeout = 60 * time.Second
	}
	if c.MaxIterations <= 0 {
		c.MaxIterations = 10
	}
	return nil
}

// ADKConfig contains the main configuration for ADK integration
type ADKConfig struct {
	// DefaultModel is the default model configuration
	DefaultModel *ModelConfig `json:"default_model"`

	// Agents is the list of agent configurations
	Agents map[AgentType]*AgentConfig `json:"agents"`

	// GlobalTimeout is the default timeout for all operations
	GlobalTimeout time.Duration `json:"global_timeout"`

	// EnableTracing enables distributed tracing
	EnableTracing bool `json:"enable_tracing"`

	// EnableLogging enables structured logging
	EnableLogging bool `json:"enable_logging"`

	// LogLevel sets the logging level
	LogLevel string `json:"log_level"`

	// MaxConcurrentAgents limits parallel agent execution
	MaxConcurrentAgents int `json:"max_concurrent_agents"`

	// CacheEnabled enables response caching
	CacheEnabled bool `json:"cache_enabled"`

	// CacheTTL is the cache time-to-live
	CacheTTL time.Duration `json:"cache_ttl"`
}

// DefaultADKConfig returns the default ADK configuration
func DefaultADKConfig() *ADKConfig {
	return &ADKConfig{
		DefaultModel:        DefaultGeminiConfig(),
		Agents:              make(map[AgentType]*AgentConfig),
		GlobalTimeout:       120 * time.Second,
		EnableTracing:       true,
		EnableLogging:       true,
		LogLevel:           "info",
		MaxConcurrentAgents: 5,
		CacheEnabled:       true,
		CacheTTL:           5 * time.Minute,
	}
}

// Validate validates the ADK configuration
func (c *ADKConfig) Validate() error {
	if c.DefaultModel == nil {
		c.DefaultModel = DefaultGeminiConfig()
	}
	if c.GlobalTimeout <= 0 {
		c.GlobalTimeout = 120 * time.Second
	}
	if c.MaxConcurrentAgents <= 0 {
		c.MaxConcurrentAgents = 5
	}

	for agentType, agent := range c.Agents {
		if err := agent.Validate(); err != nil {
			return fmt.Errorf("invalid config for agent %s: %w", agentType, err)
		}
	}

	return nil
}

// ConfigBuilder provides a fluent interface for building ADK configurations
type ConfigBuilder struct {
	config *ADKConfig
}

// NewConfigBuilder creates a new configuration builder
func NewConfigBuilder() *ConfigBuilder {
	return &ConfigBuilder{
		config: DefaultADKConfig(),
	}
}

// WithDefaultModel sets the default model
func (b *ConfigBuilder) WithDefaultModel(model *ModelConfig) *ConfigBuilder {
	b.config.DefaultModel = model
	return b
}

// WithGeminiModel sets Gemini as the default model
func (b *ConfigBuilder) WithGeminiModel() *ConfigBuilder {
	b.config.DefaultModel = DefaultGeminiConfig()
	return b
}

// WithClaudeModel sets Claude as the default model
func (b *ConfigBuilder) WithClaudeModel() *ConfigBuilder {
	b.config.DefaultModel = DefaultClaudeConfig()
	return b
}

// WithGlobalTimeout sets the global timeout
func (b *ConfigBuilder) WithGlobalTimeout(timeout time.Duration) *ConfigBuilder {
	b.config.GlobalTimeout = timeout
	return b
}

// WithTracing enables or disables tracing
func (b *ConfigBuilder) WithTracing(enabled bool) *ConfigBuilder {
	b.config.EnableTracing = enabled
	return b
}

// WithLogging enables or disables logging
func (b *ConfigBuilder) WithLogging(enabled bool) *ConfigBuilder {
	b.config.EnableLogging = enabled
	return b
}

// WithLogLevel sets the log level
func (b *ConfigBuilder) WithLogLevel(level string) *ConfigBuilder {
	b.config.LogLevel = level
	return b
}

// WithMaxConcurrentAgents sets the maximum concurrent agents
func (b *ConfigBuilder) WithMaxConcurrentAgents(max int) *ConfigBuilder {
	b.config.MaxConcurrentAgents = max
	return b
}

// WithCaching enables or disables caching
func (b *ConfigBuilder) WithCaching(enabled bool, ttl time.Duration) *ConfigBuilder {
	b.config.CacheEnabled = enabled
	b.config.CacheTTL = ttl
	return b
}

// AddAgent adds an agent configuration
func (b *ConfigBuilder) AddAgent(agent *AgentConfig) *ConfigBuilder {
	b.config.Agents[agent.Type] = agent
	return b
}

// Build returns the built configuration
func (b *ConfigBuilder) Build() (*ADKConfig, error) {
	if err := b.config.Validate(); err != nil {
		return nil, err
	}
	return b.config, nil
}

// MustBuild returns the built configuration or panics
func (b *ConfigBuilder) MustBuild() *ADKConfig {
	config, err := b.Build()
	if err != nil {
		panic(err)
	}
	return config
}

// AgentConfigBuilder provides a fluent interface for building agent configurations
type AgentConfigBuilder struct {
	config *AgentConfig
}

// NewAgentConfigBuilder creates a new agent configuration builder
func NewAgentConfigBuilder(agentType AgentType) *AgentConfigBuilder {
	return &AgentConfigBuilder{
		config: &AgentConfig{
			Type:          agentType,
			Model:         DefaultGeminiConfig(),
			MaxIterations: 10,
			Timeout:       60 * time.Second,
			RetryCount:    2,
			Enabled:       true,
			Metadata:      make(map[string]interface{}),
		},
	}
}

// WithID sets the agent ID
func (b *AgentConfigBuilder) WithID(id string) *AgentConfigBuilder {
	b.config.ID = id
	return b
}

// WithName sets the agent name
func (b *AgentConfigBuilder) WithName(name string) *AgentConfigBuilder {
	b.config.Name = name
	return b
}

// WithDescription sets the agent description
func (b *AgentConfigBuilder) WithDescription(desc string) *AgentConfigBuilder {
	b.config.Description = desc
	return b
}

// WithSystemPrompt sets the system prompt
func (b *AgentConfigBuilder) WithSystemPrompt(prompt string) *AgentConfigBuilder {
	b.config.SystemPrompt = prompt
	return b
}

// WithModel sets the model configuration
func (b *AgentConfigBuilder) WithModel(model *ModelConfig) *AgentConfigBuilder {
	b.config.Model = model
	return b
}

// WithGeminiModel sets Gemini as the model
func (b *AgentConfigBuilder) WithGeminiModel() *AgentConfigBuilder {
	b.config.Model = DefaultGeminiConfig()
	return b
}

// WithClaudeModel sets Claude as the model
func (b *AgentConfigBuilder) WithClaudeModel() *AgentConfigBuilder {
	b.config.Model = DefaultClaudeConfig()
	return b
}

// WithTools sets the available tools
func (b *AgentConfigBuilder) WithTools(tools ...string) *AgentConfigBuilder {
	b.config.Tools = tools
	return b
}

// AddTool adds a tool to the available tools
func (b *AgentConfigBuilder) AddTool(tool string) *AgentConfigBuilder {
	b.config.Tools = append(b.config.Tools, tool)
	return b
}

// WithMaxIterations sets the maximum iterations
func (b *AgentConfigBuilder) WithMaxIterations(max int) *AgentConfigBuilder {
	b.config.MaxIterations = max
	return b
}

// WithTimeout sets the timeout
func (b *AgentConfigBuilder) WithTimeout(timeout time.Duration) *AgentConfigBuilder {
	b.config.Timeout = timeout
	return b
}

// WithRetryCount sets the retry count
func (b *AgentConfigBuilder) WithRetryCount(count int) *AgentConfigBuilder {
	b.config.RetryCount = count
	return b
}

// WithMetadata sets metadata
func (b *AgentConfigBuilder) WithMetadata(key string, value interface{}) *AgentConfigBuilder {
	b.config.Metadata[key] = value
	return b
}

// Enabled sets whether the agent is enabled
func (b *AgentConfigBuilder) Enabled(enabled bool) *AgentConfigBuilder {
	b.config.Enabled = enabled
	return b
}

// Build returns the built agent configuration
func (b *AgentConfigBuilder) Build() (*AgentConfig, error) {
	if b.config.ID == "" {
		b.config.ID = string(b.config.Type)
	}
	if b.config.Name == "" {
		b.config.Name = string(b.config.Type)
	}
	if err := b.config.Validate(); err != nil {
		return nil, err
	}
	return b.config, nil
}

// MustBuild returns the built agent configuration or panics
func (b *AgentConfigBuilder) MustBuild() *AgentConfig {
	config, err := b.Build()
	if err != nil {
		panic(err)
	}
	return config
}

// DefaultAgentConfigs returns the default agent configurations for OmniTrade
func DefaultAgentConfigs() map[AgentType]*AgentConfig {
	return map[AgentType]*AgentConfig{
		AgentTypeFundamentalAnalyst: NewAgentConfigBuilder(AgentTypeFundamentalAnalyst).
			WithID("fundamental-analyst-001").
			WithName("Fundamental Analyst").
			WithDescription("Analyzes company financials, earnings, and fundamental metrics").
			WithSystemPrompt(fundamentalAnalystPrompt).
			WithTools(
				"get_financial_data",
				"get_earnings_data",
				"get_analyst_ratings",
				"get_company_info",
			).
			WithGeminiModel().
			MustBuild(),

		AgentTypeTechnicalAnalyst: NewAgentConfigBuilder(AgentTypeTechnicalAnalyst).
			WithID("technical-analyst-001").
			WithName("Technical Analyst").
			WithDescription("Analyzes price patterns, indicators, and technical signals").
			WithSystemPrompt(technicalAnalystPrompt).
			WithTools(
				"get_price_data",
				"calculate_indicators",
				"detect_patterns",
				"get_support_resistance",
			).
			WithGeminiModel().
			MustBuild(),

		AgentTypeSentimentAnalyst: NewAgentConfigBuilder(AgentTypeSentimentAnalyst).
			WithID("sentiment-analyst-001").
			WithName("Sentiment Analyst").
			WithDescription("Analyzes market sentiment from news and social media").
			WithSystemPrompt(sentimentAnalystPrompt).
			WithTools(
				"get_news_headlines",
				"get_news_sentiment",
				"search_news",
				"analyze_social_sentiment",
			).
			WithClaudeModel().
			MustBuild(),

		AgentTypeRiskManager: NewAgentConfigBuilder(AgentTypeRiskManager).
			WithID("risk-manager-001").
			WithName("Risk Manager").
			WithDescription("Assesses portfolio risk and provides risk management recommendations").
			WithSystemPrompt(riskManagerPrompt).
			WithTools(
				"calculate_var",
				"assess_portfolio_risk",
				"check_position_limits",
				"analyze_correlation",
			).
			WithGeminiModel().
			WithMaxIterations(15).
			MustBuild(),

		AgentTypePortfolioManager: NewAgentConfigBuilder(AgentTypePortfolioManager).
			WithID("portfolio-manager-001").
			WithName("Portfolio Manager").
			WithDescription("Makes final portfolio decisions based on analyst inputs").
			WithSystemPrompt(portfolioManagerPrompt).
			WithTools(
				"get_portfolio_state",
				"create_trade_proposal",
				"calculate_position_size",
				"check_risk_limits",
			).
			WithClaudeModel().
			WithMaxIterations(20).
			WithTimeout(90 * time.Second).
			MustBuild(),
	}
}

// System prompts for each agent type
const (
	fundamentalAnalystPrompt = `You are a Fundamental Analyst for the OmniTrade quantitative trading platform.

Your responsibilities:
1. Analyze company financial statements (income statement, balance sheet, cash flow)
2. Evaluate earnings reports and guidance
3. Assess valuation metrics (P/E, P/B, EV/EBITDA, DCF)
4. Review analyst ratings and price targets
5. Identify fundamental catalysts and risks

Output format:
- Provide a clear fundamental score (0-100)
- List key strengths and weaknesses
- Highlight any red flags or opportunities
- Include confidence level in your analysis

Remember:
- Focus on data-driven analysis
- Consider both current metrics and historical trends
- Flag any accounting irregularities or concerns
- Provide actionable insights for the Portfolio Manager`

	technicalAnalystPrompt = `You are a Technical Analyst for the OmniTrade quantitative trading platform.

Your responsibilities:
1. Analyze price action and chart patterns
2. Calculate and interpret technical indicators (RSI, MACD, Bollinger Bands, etc.)
3. Identify support and resistance levels
4. Detect trend direction and momentum
5. Generate entry and exit signals

Output format:
- Provide a technical score (-100 to +100, negative = bearish, positive = bullish)
- List key support and resistance levels
- Identify active chart patterns
- Provide price targets and stop-loss levels
- Include confidence level in your analysis

Remember:
- Use multiple indicators for confirmation
- Consider multiple timeframes
- Flag any divergences or warning signs
- Provide specific price levels for signals`

	sentimentAnalystPrompt = `You are a Sentiment Analyst for the OmniTrade quantitative trading platform.

Your responsibilities:
1. Analyze financial news headlines and articles
2. Aggregate sentiment from multiple sources
3. Identify market-moving news and events
4. Track sentiment trends over time
5. Assess potential impact on asset prices

Output format:
- Provide an overall sentiment score (-100 to +100)
- Break down by news source and recency
- Highlight key themes and narratives
- Identify potential catalysts or risks
- Include confidence level in your analysis

Remember:
- Consider source credibility and bias
- Weight recent news more heavily
- Distinguish between market noise and significant news
- Flag any contradictory signals`

	riskManagerPrompt = `You are a Risk Manager for the OmniTrade quantitative trading platform.

Your responsibilities:
1. Calculate portfolio risk metrics (VaR, drawdown, volatility)
2. Assess position-level and portfolio-level risk
3. Monitor correlation and concentration risk
4. Ensure compliance with risk limits
5. Recommend risk mitigation strategies

Output format:
- Provide overall risk assessment (low/medium/high/critical)
- List specific risk factors and their severity
- Calculate risk-adjusted returns
- Recommend position sizing adjustments
- Flag any limit breaches or concerns

Remember:
- Prioritize capital preservation
- Consider tail risks and black swan events
- Factor in market regime and volatility environment
- Provide clear go/no-go recommendations`

	portfolioManagerPrompt = `You are the Portfolio Manager for the OmniTrade quantitative trading platform.

Your responsibilities:
1. Synthesize inputs from all analyst agents
2. Make final portfolio allocation decisions
3. Generate trade proposals with clear reasoning
4. Balance risk and return objectives
5. Ensure compliance with investment mandates

Decision framework:
- Fundamental score weight: 30%
- Technical score weight: 25%
- Sentiment score weight: 20%
- Risk assessment weight: 25%

Output format:
- Clear action recommendation (buy/sell/hold)
- Position size and timing
- Entry, target, and stop-loss levels
- Confidence score (minimum 0.7 required for trade proposals)
- Detailed reasoning synthesizing all inputs

Remember:
- You are the final decision maker
- Human approval is required for all trades (HITL)
- Consider portfolio context and existing positions
- Document your reasoning for audit purposes
- Minimum confidence threshold: 0.7 for any trade proposal`
)

// GetAgentConfig retrieves an agent configuration by type
func GetAgentConfig(agentType AgentType) (*AgentConfig, error) {
	configs := DefaultAgentConfigs()
	config, ok := configs[agentType]
	if !ok {
		return nil, fmt.Errorf("unknown agent type: %s", agentType)
	}
	return config, nil
}

// Context keys for ADK configuration
type adkContextKey string

const (
	// ADKConfigContextKey is the context key for ADK configuration
	ADKConfigContextKey adkContextKey = "adk_config"
	// AgentConfigContextKey is the context key for agent configuration
	AgentConfigContextKey adkContextKey = "agent_config"
	// LoggerContextKey is the context key for logger
	LoggerContextKey adkContextKey = "logger"
)

// WithADKConfig adds ADK configuration to context
func WithADKConfig(ctx context.Context, config *ADKConfig) context.Context {
	return context.WithValue(ctx, ADKConfigContextKey, config)
}

// GetADKConfig retrieves ADK configuration from context
func GetADKConfig(ctx context.Context) (*ADKConfig, bool) {
	config, ok := ctx.Value(ADKConfigContextKey).(*ADKConfig)
	return config, ok
}

// WithAgentConfig adds agent configuration to context
func WithAgentConfig(ctx context.Context, config *AgentConfig) context.Context {
	return context.WithValue(ctx, AgentConfigContextKey, config)
}

// GetAgentConfigFromContext retrieves agent configuration from context
func GetAgentConfigFromContext(ctx context.Context) (*AgentConfig, bool) {
	config, ok := ctx.Value(AgentConfigContextKey).(*AgentConfig)
	return config, ok
}

// WithLogger adds logger to context
func WithLogger(ctx context.Context, logger *zap.Logger) context.Context {
	return context.WithValue(ctx, LoggerContextKey, logger)
}

// GetLogger retrieves logger from context
func GetLogger(ctx context.Context) (*zap.Logger, bool) {
	logger, ok := ctx.Value(LoggerContextKey).(*zap.Logger)
	return logger, ok
}
