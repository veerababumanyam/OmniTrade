// Package example_tools demonstrates how to create tools for the OmniTrade agent system.
// This example shows different tool patterns including:
// - Basic tool implementation
// - Tool with complex parameters
// - Streaming tool
// - Batch tool
// - Tool with caching
package example_tools

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/omnitrade/backend/internal/agent/tools"
)

// =============================================================================
// Example 1: Basic Market Data Tool
// =============================================================================

// GetQuoteTool retrieves a stock quote
type GetQuoteTool struct {
	tools.BaseTool
}

// NewGetQuoteTool creates a new quote tool
func NewGetQuoteTool() *GetQuoteTool {
	return &GetQuoteTool{}
}

// Definition returns the tool definition
func (t *GetQuoteTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "example.get_quote",
		Name:        "Get Stock Quote",
		Version:     "1.0.0",
		Description: "Retrieves current stock quote including price, volume, and daily change",
		Category:    tools.CategoryMarketData,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "symbol",
				Type:        "string",
				Description: "Stock symbol (e.g., AAPL, MSFT)",
				Required:    true,
				Pattern:     "^[A-Z]{1,5}$",
			},
		},
		Result: tools.ResultDefinition{
			Type:        "object",
			Description: "Current stock quote",
			Schema: map[string]tools.ParameterDefinition{
				"symbol":     {Type: "string", Description: "Stock symbol"},
				"price":      {Type: "number", Description: "Current price"},
				"change":     {Type: "number", Description: "Price change"},
				"change_pct": {Type: "number", Description: "Percentage change"},
				"volume":     {Type: "integer", Description: "Trading volume"},
				"timestamp":  {Type: "string", Description: "Quote timestamp"},
			},
		},
		ExecutionMode:     tools.ExecutionSync,
		PermissionLevel:   tools.PermissionRead,
		RiskLevel:         tools.RiskLow,
		Tags:             []string{"realtime", "quote", "price"},
		Timeout:          10 * time.Second,
		RateLimitRequests: 100,
		RateLimitWindow:   time.Minute,
	}
}

// Execute runs the tool
func (t *GetQuoteTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	symbol, _ := input.Arguments["symbol"].(string)

	// In production, this would query a real data source
	quote := map[string]interface{}{
		"symbol":     symbol,
		"price":      150.25,
		"change":     2.50,
		"change_pct": 1.69,
		"volume":     50000000,
		"timestamp":  time.Now().UTC().Format(time.RFC3339),
	}

	jsonData, _ := json.Marshal(quote)

	return &tools.ExecutionResult{
		ToolID:    input.ToolID,
		RequestID: input.Context.RequestID,
		Success:   true,
		Data:      jsonData,
		Metadata: tools.ResultMetadata{
			CacheHit:   false,
			Confidence: 0.95,
			Sources:    []string{"market_data_api"},
		},
	}, nil
}

// =============================================================================
// Example 2: Tool with Complex Parameters
// =============================================================================

// AnalyzeOptionsTool analyzes options chain data
type AnalyzeOptionsTool struct {
	tools.BaseTool
}

// NewAnalyzeOptionsTool creates a new options analysis tool
func NewAnalyzeOptionsTool() *AnalyzeOptionsTool {
	return &AnalyzeOptionsTool{}
}

// Definition returns the tool definition
func (t *AnalyzeOptionsTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "example.analyze_options",
		Name:        "Analyze Options Chain",
		Version:     "1.0.0",
		Description: "Analyzes options chain data for a stock symbol",
		Category:    tools.CategoryAnalysis,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "symbol",
				Type:        "string",
				Description: "Stock symbol",
				Required:    true,
				Pattern:     "^[A-Z]{1,5}$",
			},
			{
				Name:        "expiration_date",
				Type:        "string",
				Description: "Options expiration date (YYYY-MM-DD)",
				Required:    true,
				Pattern:     "^\\d{4}-\\d{2}-\\d{2}$",
			},
			{
				Name:        "option_type",
				Type:        "string",
				Description: "Type of options to analyze",
				Required:    false,
				Default:     "all",
				Enum:        []string{"call", "put", "all"},
			},
			{
				Name:        "strike_range",
				Type:        "object",
				Description: "Strike price range to analyze",
				Required:    false,
			},
			{
				Name:        "include_greeks",
				Type:        "boolean",
				Description: "Include Greeks in analysis",
				Required:    false,
				Default:     true,
			},
			{
				Name:        "min_volume",
				Type:        "integer",
				Description: "Minimum option volume to include",
				Required:    false,
				Default:     100,
				Min:         func() *float64 { v := 0.0; return &v }(),
				Max:         func() *float64 { v := 100000.0; return &v }(),
			},
		},
		Result: tools.ResultDefinition{
			Type:        "object",
			Description: "Options chain analysis results",
		},
		ExecutionMode:    tools.ExecutionSync,
		PermissionLevel:  tools.PermissionAnalyze,
		RiskLevel:        tools.RiskMedium,
		Tags:            []string{"options", "derivatives", "analysis"},
		Timeout:         30 * time.Second,
	}
}

// Execute runs the tool
func (t *AnalyzeOptionsTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	symbol, _ := input.Arguments["symbol"].(string)
	expirationDate, _ := input.Arguments["expiration_date"].(string)
	optionType, _ := input.Arguments["option_type"].(string)
	if optionType == "" {
		optionType = "all"
	}
	includeGreeks, _ := input.Arguments["include_greeks"].(bool)
	if !includeGreeks {
		includeGreeks = true // Default
	}

	// Perform analysis
	result := map[string]interface{}{
		"symbol":          symbol,
		"expiration_date": expirationDate,
		"option_type":     optionType,
		"analysis": map[string]interface{}{
			"put_call_ratio":     0.85,
			"implied_volatility": 0.32,
			"max_pain":           150.00,
			"unusual_activity":   true,
		},
	}

	if includeGreeks {
		result["greeks"] = map[string]interface{}{
			"delta": 0.45,
			"gamma": 0.08,
			"theta": -0.02,
			"vega":  0.15,
		}
	}

	jsonData, _ := json.Marshal(result)

	return &tools.ExecutionResult{
		ToolID:    input.ToolID,
		RequestID: input.Context.RequestID,
		Success:   true,
		Data:      jsonData,
		Metadata: tools.ResultMetadata{
			Confidence: 0.88,
			Sources:    []string{"options_chain_api"},
		},
	}, nil
}

// =============================================================================
// Example 3: Streaming Tool
// =============================================================================

// StreamTickDataTool streams tick data for a symbol
type StreamTickDataTool struct {
	tools.BaseTool
}

// NewStreamTickDataTool creates a new streaming tick data tool
func NewStreamTickDataTool() *StreamTickDataTool {
	return &StreamTickDataTool{}
}

// Definition returns the tool definition
func (t *StreamTickDataTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "example.stream_ticks",
		Name:        "Stream Tick Data",
		Version:     "1.0.0",
		Description: "Streams real-time tick data for a stock symbol",
		Category:    tools.CategoryMarketData,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "symbol",
				Type:        "string",
				Description: "Stock symbol",
				Required:    true,
			},
			{
				Name:        "duration",
				Type:        "integer",
				Description: "Streaming duration in seconds",
				Required:    false,
				Default:     60,
				Min:         func() *float64 { v := 10.0; return &v }(),
				Max:         func() *float64 { v := 300.0; return &v }(),
			},
		},
		Result: tools.ResultDefinition{
			Type:        "array",
			Description: "Array of tick data",
		},
		ExecutionMode:    tools.ExecutionStreaming,
		PermissionLevel:  tools.PermissionRead,
		RiskLevel:        tools.RiskLow,
		Tags:            []string{"streaming", "realtime", "ticks"},
		Timeout:         5 * time.Minute,
	}
}

// Execute runs the tool
func (t *StreamTickDataTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	symbol, _ := input.Arguments["symbol"].(string)

	// Generate mock tick data
	ticks := []map[string]interface{}{}
	baseTime := time.Now().Add(-time.Minute)

	for i := 0; i < 10; i++ {
		ticks = append(ticks, map[string]interface{}{
			"timestamp": baseTime.Add(time.Duration(i*100) * time.Millisecond).Format(time.RFC3339Nano),
			"price":     150.00 + float64(i)*0.01,
			"size":      100 * (i + 1),
			"exchange":  "NASDAQ",
		})
	}

	result := map[string]interface{}{
		"symbol": symbol,
		"ticks":  ticks,
	}

	jsonData, _ := json.Marshal(result)

	return &tools.ExecutionResult{
		ToolID:    input.ToolID,
		RequestID: input.Context.RequestID,
		Success:   true,
		Data:      jsonData,
		Metadata: tools.ResultMetadata{
			Confidence: 1.0,
			Sources:    []string{"tick_feed"},
		},
	}, nil
}

// =============================================================================
// Example 4: Risk Assessment Tool
// =============================================================================

// AssessPortfolioRiskTool assesses portfolio risk
type AssessPortfolioRiskTool struct {
	tools.BaseTool
}

// NewAssessPortfolioRiskTool creates a new risk assessment tool
func NewAssessPortfolioRiskTool() *AssessPortfolioRiskTool {
	return &AssessPortfolioRiskTool{}
}

// Definition returns the tool definition
func (t *AssessPortfolioRiskTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "example.assess_portfolio_risk",
		Name:        "Assess Portfolio Risk",
		Version:     "1.0.0",
		Description: "Performs comprehensive portfolio risk assessment",
		Category:    tools.CategoryRisk,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "portfolio_id",
				Type:        "string",
				Description: "Portfolio identifier",
				Required:    true,
			},
			{
				Name:        "confidence_level",
				Type:        "number",
				Description: "Confidence level for VaR calculation",
				Required:    false,
				Default:     0.95,
				Min:         func() *float64 { v := 0.90; return &v }(),
				Max:         func() *float64 { v := 0.99; return &v }(),
			},
			{
				Name:        "time_horizon",
				Type:        "integer",
				Description: "Time horizon in days",
				Required:    false,
				Default:     1,
				Min:         func() *float64 { v := 1.0; return &v }(),
				Max:         func() *float64 { v := 10.0; return &v }(),
			},
			{
				Name:        "include_stress_test",
				Type:        "boolean",
				Description: "Include stress test scenarios",
				Required:    false,
				Default:     true,
			},
		},
		Result: tools.ResultDefinition{
			Type:        "object",
			Description: "Risk assessment results",
		},
		ExecutionMode:    tools.ExecutionSync,
		PermissionLevel:  tools.PermissionAnalyze,
		RiskLevel:        tools.RiskMedium,
		Tags:            []string{"risk", "portfolio", "var"},
		Timeout:         60 * time.Second,
	}
}

// Execute runs the tool
func (t *AssessPortfolioRiskTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	portfolioID, _ := input.Arguments["portfolio_id"].(string)
	confidenceLevel, _ := input.Arguments["confidence_level"].(float64)
	if confidenceLevel == 0 {
		confidenceLevel = 0.95
	}
	timeHorizon, _ := input.Arguments["time_horizon"].(int)
	if timeHorizon == 0 {
		timeHorizon = 1
	}
	includeStressTest, _ := input.Arguments["include_stress_test"].(bool)

	// Perform risk assessment
	result := map[string]interface{}{
		"portfolio_id":     portfolioID,
		"confidence_level": confidenceLevel,
		"time_horizon":     timeHorizon,
		"risk_metrics": map[string]interface{}{
			"var":           15000.00,
			"expected_loss": 8500.00,
			"max_drawdown":  0.15,
			"sharpe_ratio":  1.25,
			"beta":          1.10,
		},
		"risk_level": "medium",
		"warnings":   []string{"High concentration in tech sector"},
	}

	if includeStressTest {
		result["stress_tests"] = map[string]interface{}{
			"market_crash": map[string]interface{}{
				"impact":     -0.25,
				"recovery_days": 45,
			},
			"rate_hike": map[string]interface{}{
				"impact":     -0.08,
				"recovery_days": 15,
			},
		}
	}

	jsonData, _ := json.Marshal(result)

	return &tools.ExecutionResult{
		ToolID:    input.ToolID,
		RequestID: input.Context.RequestID,
		Success:   true,
		Data:      jsonData,
		Metadata: tools.ResultMetadata{
			Confidence: 0.92,
			Sources:    []string{"risk_engine"},
			Warnings:   []string{"Risk calculations are estimates"},
		},
	}, nil
}

// =============================================================================
// Example 5: Trade Proposal Tool (HITL Required)
// =============================================================================

// ProposeTradeTool generates a trade proposal
type ProposeTradeTool struct {
	tools.BaseTool
}

// NewProposeTradeTool creates a new trade proposal tool
func NewProposeTradeTool() *ProposeTradeTool {
	return &ProposeTradeTool{}
}

// Definition returns the tool definition
func (t *ProposeTradeTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "example.propose_trade",
		Name:        "Propose Trade",
		Version:     "1.0.0",
		Description: "Generates a trade proposal for human approval",
		Category:    tools.CategoryPortfolio,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "symbol",
				Type:        "string",
				Description: "Stock symbol",
				Required:    true,
			},
			{
				Name:        "side",
				Type:        "string",
				Description: "Trade side",
				Required:    true,
				Enum:        []string{"buy", "sell"},
			},
			{
				Name:        "quantity",
				Type:        "number",
				Description: "Number of shares",
				Required:    true,
				Min:         func() *float64 { v := 1.0; return &v }(),
			},
			{
				Name:        "order_type",
				Type:        "string",
				Description: "Order type",
				Required:    false,
				Default:     "market",
				Enum:        []string{"market", "limit", "stop"},
			},
			{
				Name:        "limit_price",
				Type:        "number",
				Description: "Limit price (for limit orders)",
				Required:    false,
			},
			{
				Name:        "reasoning",
				Type:        "string",
				Description: "AI reasoning for the trade",
				Required:    true,
			},
			{
				Name:        "confidence",
				Type:        "number",
				Description: "AI confidence score",
				Required:    true,
				Min:         func() *float64 { v := 0.0; return &v }(),
				Max:         func() *float64 { v := 1.0; return &v }(),
			},
		},
		Result: tools.ResultDefinition{
			Type:        "object",
			Description: "Trade proposal with approval status",
		},
		ExecutionMode:      tools.ExecutionSync,
		PermissionLevel:    tools.PermissionTrade,
		RiskLevel:          tools.RiskHigh,
		Tags:              []string{"trade", "proposal", "hitl"},
		Timeout:           30 * time.Second,
		Dependencies:      []string{"example.assess_portfolio_risk"},
	}
}

// Execute runs the tool
func (t *ProposeTradeTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	symbol, _ := input.Arguments["symbol"].(string)
	side, _ := input.Arguments["side"].(string)
	quantity, _ := input.Arguments["quantity"].(float64)
	orderType, _ := input.Arguments["order_type"].(string)
	if orderType == "" {
		orderType = "market"
	}
	reasoning, _ := input.Arguments["reasoning"].(string)
	confidence, _ := input.Arguments["confidence"].(float64)

	// Validate minimum confidence
	if confidence < 0.70 {
		return &tools.ExecutionResult{
			ToolID:    input.ToolID,
			RequestID: input.Context.RequestID,
			Success:   false,
			Error: &tools.ExecutionError{
				Code:    "CONFIDENCE_TOO_LOW",
				Message: fmt.Sprintf("confidence %.2f is below minimum threshold of 0.70", confidence),
				Type:    "validation",
			},
		}, nil
	}

	// Create proposal
	proposal := map[string]interface{}{
		"proposal_id":     fmt.Sprintf("prop-%d", time.Now().UnixNano()),
		"symbol":          symbol,
		"side":            side,
		"quantity":        quantity,
		"order_type":      orderType,
		"reasoning":       reasoning,
		"confidence":      confidence,
		"status":          "pending_approval",
		"created_at":      time.Now().UTC().Format(time.RFC3339),
		"expires_at":      time.Now().Add(24 * time.Hour).UTC().Format(time.RFC3339),
		"estimated_value": quantity * 150.00, // Mock price
	}

	jsonData, _ := json.Marshal(proposal)

	return &tools.ExecutionResult{
		ToolID:    input.ToolID,
		RequestID: input.Context.RequestID,
		Success:   true,
		Data:      jsonData,
		Metadata: tools.ResultMetadata{
			Confidence:         confidence,
			HumanApproval:      true,
			Warnings:           []string{"This proposal requires human approval before execution"},
		},
	}, nil
}

// =============================================================================
// Registration
// =============================================================================

func init() {
	// Register all example tools
	tools.MustRegister(NewGetQuoteTool())
	tools.MustRegister(NewAnalyzeOptionsTool())
	tools.MustRegister(NewStreamTickDataTool())
	tools.MustRegister(NewAssessPortfolioRiskTool())
	tools.MustRegister(NewProposeTradeTool())
}

// Ensure interface compliance
var _ tools.ToolExecutor = (*GetQuoteTool)(nil)
var _ tools.ToolExecutor = (*AnalyzeOptionsTool)(nil)
var _ tools.ToolExecutor = (*StreamTickDataTool)(nil)
var _ tools.ToolExecutor = (*AssessPortfolioRiskTool)(nil)
var _ tools.ToolExecutor = (*ProposeTradeTool)(nil)
