// Package example_plugin demonstrates how to create a complete OmniTrade plugin.
// This example shows all the key components of a plugin including:
// - Plugin interface implementation
// - Configuration handling
// - Error handling
// - Health checks
// - Lifecycle management
package example_plugin

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/omnitrade/backend/internal/agent/plugins"
	"go.uber.org/zap"
)

// ExamplePlugin demonstrates a complete plugin implementation
type ExamplePlugin struct {
	plugins.BasePlugin

	// Configuration
	config ExamplePluginConfig

	// Internal state
	mu           sync.RWMutex
	startTime    time.Time
	requestCount int64
	errorCount   int64

	// Dependencies
	logger *zap.Logger
}

// ExamplePluginConfig contains plugin-specific configuration
type ExamplePluginConfig struct {
	// APIKey for external service authentication
	APIKey string `json:"api_key" yaml:"api_key"`

	// MaxRetries for transient failures
	MaxRetries int `json:"max_retries" yaml:"max_retries"`

	// Timeout for operations
	Timeout time.Duration `json:"timeout" yaml:"timeout"`

	// EnableCaching for results
	EnableCaching bool `json:"enable_caching" yaml:"enable_caching"`

	// CacheTTL for cached results
	CacheTTL time.Duration `json:"cache_ttl" yaml:"cache_ttl"`

	// LogLevel for this plugin
	LogLevel string `json:"log_level" yaml:"log_level"`
}

// DefaultExamplePluginConfig returns default configuration
func DefaultExamplePluginConfig() ExamplePluginConfig {
	return ExamplePluginConfig{
		MaxRetries:    3,
		Timeout:       30 * time.Second,
		EnableCaching: true,
		CacheTTL:      5 * time.Minute,
		LogLevel:      "info",
	}
}

// New creates a new instance of the ExamplePlugin
func New() *ExamplePlugin {
	return &ExamplePlugin{
		BasePlugin: *plugins.NewBasePlugin(&plugins.PluginMetadata{
			ID:          "example_plugin",
			Name:        "Example Plugin",
			Version:     "1.0.0",
			Description: "A complete example plugin demonstrating all plugin features",
			Author:      "OmniTrade Team",
			Priority:    plugins.PriorityNormal,
			Capabilities: []plugins.PluginCapability{
				plugins.CapabilityAnalysis,
				plugins.CapabilitySignalGeneration,
			},
			Dependencies: []string{}, // No dependencies
			Tags:         []string{"example", "demo", "analysis"},
		}),
		config: DefaultExamplePluginConfig(),
	}
}

// Initialize sets up the plugin with configuration
func (p *ExamplePlugin) Initialize(ctx *plugins.PluginContext, config plugins.PluginConfig) error {
	p.logger = ctx.Logger
	p.startTime = time.Now()

	// Parse configuration
	if apiKey, ok := config.Settings["api_key"].(string); ok {
		p.config.APIKey = apiKey
	}

	if maxRetries, ok := config.Settings["max_retries"].(int); ok {
		p.config.MaxRetries = maxRetries
	}

	if timeoutStr, ok := config.Settings["timeout"].(string); ok {
		if timeout, err := time.ParseDuration(timeoutStr); err == nil {
			p.config.Timeout = timeout
		}
	}

	if enableCaching, ok := config.Settings["enable_caching"].(bool); ok {
		p.config.EnableCaching = enableCaching
	}

	if cacheTTLStr, ok := config.Settings["cache_ttl"].(string); ok {
		if cacheTTL, err := time.ParseDuration(cacheTTLStr); err == nil {
			p.config.CacheTTL = cacheTTL
		}
	}

	if logLevel, ok := config.Settings["log_level"].(string); ok {
		p.config.LogLevel = logLevel
	}

	// Validate required configuration
	if p.config.APIKey == "" {
		return fmt.Errorf("api_key is required for ExamplePlugin")
	}

	// Validate ranges
	if p.config.MaxRetries < 0 || p.config.MaxRetries > 10 {
		return fmt.Errorf("max_retries must be between 0 and 10")
	}

	if p.config.Timeout < time.Second || p.config.Timeout > 5*time.Minute {
		return fmt.Errorf("timeout must be between 1s and 5m")
	}

	p.logger.Info("plugin initialized",
		zap.String("plugin_id", p.Metadata().ID),
		zap.Duration("timeout", p.config.Timeout),
		zap.Int("max_retries", p.config.MaxRetries),
		zap.Bool("caching_enabled", p.config.EnableCaching),
	)

	return nil
}

// Start begins plugin operation
func (p *ExamplePlugin) Start(ctx *plugins.PluginContext) error {
	p.logger.Info("plugin starting",
		zap.String("plugin_id", p.Metadata().ID),
	)

	// Perform startup tasks
	// - Connect to external services
	// - Initialize caches
	// - Start background goroutines

	p.logger.Info("plugin started successfully",
		zap.String("plugin_id", p.Metadata().ID),
	)

	return nil
}

// Stop gracefully stops the plugin
func (p *ExamplePlugin) Stop(ctx *plugins.PluginContext) error {
	p.logger.Info("plugin stopping",
		zap.String("plugin_id", p.Metadata().ID),
	)

	// Perform graceful shutdown
	// - Stop accepting new requests
	// - Complete in-flight requests
	// - Close connections

	p.logger.Info("plugin stopped",
		zap.String("plugin_id", p.Metadata().ID),
		zap.Int64("total_requests", p.requestCount),
		zap.Int64("total_errors", p.errorCount),
	)

	return nil
}

// Shutdown performs final cleanup
func (p *ExamplePlugin) Shutdown(ctx *plugins.PluginContext) error {
	p.logger.Info("plugin shutting down",
		zap.String("plugin_id", p.Metadata().ID),
	)

	// Release all resources
	// - Flush caches
	// - Close all connections
	// - Persist state if needed

	return nil
}

// State returns the current plugin state
func (p *ExamplePlugin) State() plugins.PluginState {
	return p.BasePlugin.State()
}

// Health checks if the plugin is healthy
func (p *ExamplePlugin) Health(ctx *plugins.PluginContext) (*plugins.PluginResult, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()

	uptime := time.Since(p.startTime)
	errorRate := float64(0)
	if p.requestCount > 0 {
		errorRate = float64(p.errorCount) / float64(p.requestCount)
	}

	// Determine health status
	healthy := errorRate < 0.1 // Less than 10% error rate

	status := "healthy"
	if !healthy {
		status = "degraded"
	}

	return &plugins.PluginResult{
		Success: healthy,
		Data: map[string]interface{}{
			"status":           status,
			"uptime_seconds":   uptime.Seconds(),
			"total_requests":   p.requestCount,
			"total_errors":     p.errorCount,
			"error_rate":       errorRate,
			"caching_enabled":  p.config.EnableCaching,
		},
	}, nil
}

// ExamplePluginInput defines the input structure for this plugin
type ExamplePluginInput struct {
	Symbol    string                 `json:"symbol"`
	Operation string                 `json:"operation"`
	Params    map[string]interface{} `json:"params,omitempty"`
}

// ExamplePluginOutput defines the output structure for this plugin
type ExamplePluginOutput struct {
	Symbol      string                 `json:"symbol"`
	Operation   string                 `json:"operation"`
	Result      interface{}            `json:"result"`
	Confidence  float64                `json:"confidence"`
	ProcessedAt time.Time              `json:"processed_at"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// Execute runs the plugin's main operation
func (p *ExamplePlugin) Execute(ctx *plugins.PluginContext, input interface{}) (*plugins.PluginResult, error) {
	start := time.Now()

	// Update metrics
	p.mu.Lock()
	p.requestCount++
	p.mu.Unlock()

	// Parse input
	pluginInput, ok := input.(ExamplePluginInput)
	if !ok {
		p.mu.Lock()
		p.errorCount++
		p.mu.Unlock()

		return &plugins.PluginResult{
			Success: false,
			Error: plugins.NewPluginError(
				plugins.ErrCodeInvalidInput,
				"invalid input type: expected ExamplePluginInput",
				false, // Not retryable
			),
		}, nil
	}

	// Validate input
	if err := p.validateInput(pluginInput); err != nil {
		p.mu.Lock()
		p.errorCount++
		p.mu.Unlock()

		return &plugins.PluginResult{
			Success: false,
			Error: plugins.NewPluginError(
				plugins.ErrCodeValidation,
				err.Error(),
				false,
			),
		}, nil
	}

	// Create timeout context
	timeoutCtx, cancel := context.WithTimeout(ctx.Context, p.config.Timeout)
	defer cancel()

	// Execute the operation with retries
	var result *ExamplePluginOutput
	var err error

	for attempt := 0; attempt <= p.config.MaxRetries; attempt++ {
		result, err = p.executeOperation(timeoutCtx, pluginInput)
		if err == nil {
			break
		}

		// Check if error is retryable
		if !p.isRetryableError(err) {
			break
		}

		// Check if context is still valid
		if timeoutCtx.Err() != nil {
			break
		}

		// Wait before retry
		if attempt < p.config.MaxRetries {
			delay := p.calculateRetryDelay(attempt)
			p.logger.Debug("retrying operation",
				zap.Int("attempt", attempt+1),
				zap.Duration("delay", delay),
				zap.Error(err),
			)

			select {
			case <-time.After(delay):
			case <-timeoutCtx.Done():
				break
			}
		}
	}

	if err != nil {
		p.mu.Lock()
		p.errorCount++
		p.mu.Unlock()

		return &plugins.PluginResult{
			Success: false,
			Error: plugins.NewPluginError(
				plugins.ErrCodeExecution,
				err.Error(),
				p.isRetryableError(err),
			),
		}, nil
	}

	duration := time.Since(start)

	p.logger.Info("operation completed",
		zap.String("symbol", pluginInput.Symbol),
		zap.String("operation", pluginInput.Operation),
		zap.Duration("duration", duration),
		zap.Float64("confidence", result.Confidence),
	)

	return &plugins.PluginResult{
		Success: true,
		Data:    result,
		Metadata: map[string]interface{}{
			"duration_ms": duration.Milliseconds(),
			"cached":      false,
		},
	}, nil
}

// validateInput validates the plugin input
func (p *ExamplePlugin) validateInput(input ExamplePluginInput) error {
	if input.Symbol == "" {
		return fmt.Errorf("symbol is required")
	}

	if input.Operation == "" {
		return fmt.Errorf("operation is required")
	}

	// Validate symbol format
	if len(input.Symbol) > 5 {
		return fmt.Errorf("symbol must be 1-5 characters")
	}

	// Validate operation
	validOperations := map[string]bool{
		"analyze":    true,
		"score":      true,
		"predict":    true,
		"validate":   true,
	}

	if !validOperations[input.Operation] {
		return fmt.Errorf("invalid operation: %s", input.Operation)
	}

	return nil
}

// executeOperation performs the actual operation
func (p *ExamplePlugin) executeOperation(ctx context.Context, input ExamplePluginInput) (*ExamplePluginOutput, error) {
	// This is where you would implement the actual business logic
	// For this example, we'll return a mock result

	switch input.Operation {
	case "analyze":
		return p.analyzeSymbol(ctx, input)
	case "score":
		return p.scoreSymbol(ctx, input)
	case "predict":
		return p.predictSymbol(ctx, input)
	case "validate":
		return p.validateSymbol(ctx, input)
	default:
		return nil, fmt.Errorf("unknown operation: %s", input.Operation)
	}
}

// analyzeSymbol performs analysis on a symbol
func (p *ExamplePlugin) analyzeSymbol(ctx context.Context, input ExamplePluginInput) (*ExamplePluginOutput, error) {
	return &ExamplePluginOutput{
		Symbol:     input.Symbol,
		Operation:  "analyze",
		Confidence: 0.85,
		ProcessedAt: time.Now(),
		Result: map[string]interface{}{
			"trend":         "bullish",
			"strength":      0.75,
			"support_level": 145.00,
			"resistance_level": 155.00,
		},
		Metadata: map[string]interface{}{
			"analysis_type": "technical",
			"indicators":    []string{"RSI", "MACD", "Bollinger"},
		},
	}, nil
}

// scoreSymbol scores a symbol
func (p *ExamplePlugin) scoreSymbol(ctx context.Context, input ExamplePluginInput) (*ExamplePluginOutput, error) {
	return &ExamplePluginOutput{
		Symbol:     input.Symbol,
		Operation:  "score",
		Confidence: 0.90,
		ProcessedAt: time.Now(),
		Result: map[string]interface{}{
			"overall_score":  8.5,
			"fundamental":    9.0,
			"technical":      8.0,
			"sentiment":      8.5,
		},
	}, nil
}

// predictSymbol makes predictions for a symbol
func (p *ExamplePlugin) predictSymbol(ctx context.Context, input ExamplePluginInput) (*ExamplePluginOutput, error) {
	return &ExamplePluginOutput{
		Symbol:     input.Symbol,
		Operation:  "predict",
		Confidence: 0.72,
		ProcessedAt: time.Now(),
		Result: map[string]interface{}{
			"direction":      "up",
			"probability":    0.72,
			"target_price":   160.00,
			"time_horizon":   "30d",
		},
	}, nil
}

// validateSymbol validates a symbol
func (p *ExamplePlugin) validateSymbol(ctx context.Context, input ExamplePluginInput) (*ExamplePluginOutput, error) {
	return &ExamplePluginOutput{
		Symbol:     input.Symbol,
		Operation:  "validate",
		Confidence: 1.0,
		ProcessedAt: time.Now(),
		Result: map[string]interface{}{
			"valid":          true,
			"exchange":       "NASDAQ",
			"currency":       "USD",
			"trading_hours":  "09:30-16:00 EST",
		},
	}, nil
}

// isRetryableError determines if an error should trigger a retry
func (p *ExamplePlugin) isRetryableError(err error) bool {
	if err == nil {
		return false
	}

	// Context errors are not retryable
	if err == context.Canceled || err == context.DeadlineExceeded {
		return false
	}

	// Check for specific error types
	// This would be customized based on your plugin's error types

	return true
}

// calculateRetryDelay calculates the delay before retry
func (p *ExamplePlugin) calculateRetryDelay(attempt int) time.Duration {
	// Exponential backoff
	delay := time.Duration(100*(1<<attempt)) * time.Millisecond
	maxDelay := 5 * time.Second
	if delay > maxDelay {
		delay = maxDelay
	}
	return delay
}

// init registers the plugin automatically when the package is imported
func init() {
	err := plugins.RegisterPlugin(func() plugins.Plugin {
		return New()
	})
	if err != nil {
		panic(fmt.Sprintf("failed to register example plugin: %v", err))
	}
}

// Ensure interface compliance
var _ plugins.Plugin = (*ExamplePlugin)(nil)
