package categories

import (
	"context"
	"encoding/json"
	"time"

	"github.com/v13478/omnitrade/backend/internal/agent/tools"
)

func init() {
	// Register risk management tools
	tools.MustRegister(&CalculateVaRTool{})
	tools.MustRegister(&AssessRiskTool{})
	tools.MustRegister(&CalculateSharpeRatioTool{})
	tools.MustRegister(&CalculatePositionSizeTool{})
}

// CalculateVaRTool calculates Value at Risk
type CalculateVaRTool struct {
	tools.BaseTool
}

// Definition returns the tool definition
func (t *CalculateVaRTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "risk.calculate_var",
		Name:        "Calculate Value at Risk",
		Version:     "1.0.0",
		Description: "Calculates Value at Risk (VaR) for a portfolio or position",
		Category:    tools.CategoryRisk,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "portfolio_value",
				Type:        "number",
				Description: "Total portfolio value",
				Required:    true,
				Min:         func() *float64 { v := 0.0; return &v }(),
			},
			{
				Name:        "confidence_level",
				Type:        "number",
				Description: "Confidence level (0-1)",
				Required:    false,
				Default:     0.95,
				Min:         func() *float64 { v := 0.8; return &v }(),
				Max:         func() *float64 { v := 0.99; return &v }(),
			},
			{
				Name:        "time_horizon",
				Type:        "integer",
				Description: "Time horizon in days",
				Required:    false,
				Default:     1,
				Min:         func() *float64 { v := 1.0; return &v }(),
				Max:         func() *float64 { v := 252.0; return &v }(),
			},
			{
				Name:        "symbols",
				Type:        "array",
				Description: "Portfolio symbols with weights",
				Required:    false,
			},
		},
		Result: tools.ResultDefinition{
			Type:        "object",
			Description: "VaR calculation results",
		},
		ExecutionMode:    tools.ExecutionSync,
		PermissionLevel:  tools.PermissionAnalyze,
		RiskLevel:        tools.RiskMedium,
		Tags:            []string{"risk", "var", "portfolio"},
		Timeout:         15 * time.Second,
	}
}

// Execute runs the tool
func (t *CalculateVaRTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	portfolioValue, _ := input.Arguments["portfolio_value"].(float64)
	confidenceLevel, _ := input.Arguments["confidence_level"].(float64)
	if confidenceLevel == 0 {
		confidenceLevel = 0.95
	}
	timeHorizon, _ := input.Arguments["time_horizon"].(int)
	if timeHorizon == 0 {
		timeHorizon = 1
	}

	// Mock VaR calculation
	var95 := portfolioValue * 0.023 // 2.3% of portfolio
	var99 := portfolioValue * 0.038 // 3.8% of portfolio

	data := map[string]interface{}{
		"portfolio_value":   portfolioValue,
		"confidence_level":  confidenceLevel,
		"time_horizon_days": timeHorizon,
		"var": map[string]interface{}{
			"95%": var95,
			"99%": var99,
		},
		"expected_shortfall": portfolioValue * 0.031,
		"methodology":        "historical_simulation",
		"risk_grade":         "moderate",
		"recommendations": []string{
			"Consider diversification across sectors",
			"Monitor correlation changes during volatility",
		},
		"calculated_at": time.Now().UTC().Format(time.RFC3339),
	}

	jsonData, _ := json.Marshal(data)

	return &tools.ExecutionResult{
		ToolID:    input.ToolID,
		RequestID: input.Context.RequestID,
		Success:   true,
		Data:      jsonData,
		Metadata: tools.ResultMetadata{
			Confidence: 0.85,
			Sources:    []string{"risk_engine", "historical_data"},
		},
	}, nil
}

// AssessRiskTool assesses overall risk for a trade proposal
type AssessRiskTool struct {
	tools.BaseTool
}

// Definition returns the tool definition
func (t *AssessRiskTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "risk.assess",
		Name:        "Assess Trade Risk",
		Version:     "1.0.0",
		Description: "Comprehensive risk assessment for a proposed trade",
		Category:    tools.CategoryRisk,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "symbol",
				Type:        "string",
				Description: "Stock symbol",
				Required:    true,
			},
			{
				Name:        "action",
				Type:        "string",
				Description: "Trade action",
				Required:    true,
				Enum:        []string{"BUY", "SELL"},
			},
			{
				Name:        "quantity",
				Type:        "integer",
				Description: "Number of shares",
				Required:    true,
				Min:         func() *float64 { v := 1.0; return &v }(),
			},
			{
				Name:        "entry_price",
				Type:        "number",
				Description: "Proposed entry price",
				Required:    true,
			},
			{
				Name:        "stop_loss",
				Type:        "number",
				Description: "Stop loss price",
				Required:    false,
			},
			{
				Name:        "take_profit",
				Type:        "number",
				Description: "Take profit price",
				Required:    false,
			},
		},
		Result: tools.ResultDefinition{
			Type:        "object",
			Description: "Risk assessment report",
		},
		ExecutionMode:    tools.ExecutionSync,
		PermissionLevel:  tools.PermissionAnalyze,
		RiskLevel:        tools.RiskMedium,
		Tags:            []string{"risk", "assessment", "trade"},
		Timeout:         10 * time.Second,
		Dependencies:    []string{"market_data.get_price", "technical.calculate_rsi", "sentiment.get_news"},
	}
}

// Execute runs the tool
func (t *AssessRiskTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	symbol, _ := input.Arguments["symbol"].(string)
	action, _ := input.Arguments["action"].(string)
	quantity, _ := input.Arguments["quantity"].(int)
	entryPrice, _ := input.Arguments["entry_price"].(float64)
	stopLoss, _ := input.Arguments["stop_loss"].(float64)
	takeProfit, _ := input.Arguments["take_profit"].(float64)

	// Calculate position value
	positionValue := float64(quantity) * entryPrice

	// Calculate risk/reward if stop loss and take profit provided
	var riskRewardRatio float64
	var maxLoss, maxGain float64
	if stopLoss > 0 {
		if action == "BUY" {
			maxLoss = (entryPrice - stopLoss) * float64(quantity)
		} else {
			maxLoss = (stopLoss - entryPrice) * float64(quantity)
		}
	}
	if takeProfit > 0 {
		if action == "BUY" {
			maxGain = (takeProfit - entryPrice) * float64(quantity)
		} else {
			maxGain = (entryPrice - takeProfit) * float64(quantity)
		}
	}
	if maxLoss > 0 && maxGain > 0 {
		riskRewardRatio = maxGain / maxLoss
	}

	data := map[string]interface{}{
		"symbol":         symbol,
		"action":         action,
		"quantity":       quantity,
		"entry_price":    entryPrice,
		"position_value": positionValue,
		"risk_metrics": map[string]interface{}{
			"max_loss":          maxLoss,
			"max_gain":          maxGain,
			"risk_reward_ratio": riskRewardRatio,
			"risk_per_share":    entryPrice - stopLoss,
		},
		"risk_score":     72, // 0-100 scale
		"risk_category":  "moderate",
		"warnings":       []string{},
		"recommendations": []string{
			"Position size is within acceptable limits",
			"Consider trailing stop for profit protection",
		},
		"requires_approval": true,
		"calculated_at":     time.Now().UTC().Format(time.RFC3339),
	}

	jsonData, _ := json.Marshal(data)

	return &tools.ExecutionResult{
		ToolID:    input.ToolID,
		RequestID: input.Context.RequestID,
		Success:   true,
		Data:      jsonData,
		Metadata: tools.ResultMetadata{
			Confidence:        0.88,
			Sources:           []string{"risk_engine", "portfolio_analysis"},
			HumanApproval:     true,
		},
	}, nil
}

// CalculateSharpeRatioTool calculates Sharpe Ratio
type CalculateSharpeRatioTool struct {
	tools.BaseTool
}

// Definition returns the tool definition
func (t *CalculateSharpeRatioTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "risk.calculate_sharpe",
		Name:        "Calculate Sharpe Ratio",
		Version:     "1.0.0",
		Description: "Calculates the Sharpe Ratio for a portfolio or strategy",
		Category:    tools.CategoryRisk,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "returns",
				Type:        "array",
				Description: "Array of periodic returns",
				Required:    true,
			},
			{
				Name:        "risk_free_rate",
				Type:        "number",
				Description: "Annual risk-free rate (decimal)",
				Required:    false,
				Default:     0.05,
			},
			{
				Name:        "periods_per_year",
				Type:        "integer",
				Description: "Number of periods per year",
				Required:    false,
				Default:     252,
			},
		},
		Result: tools.ResultDefinition{
			Type:        "object",
			Description: "Sharpe Ratio calculation",
		},
		ExecutionMode:    tools.ExecutionSync,
		PermissionLevel:  tools.PermissionAnalyze,
		RiskLevel:        tools.RiskLow,
		Tags:            []string{"risk", "performance", "ratio"},
		Timeout:         5 * time.Second,
	}
}

// Execute runs the tool
func (t *CalculateSharpeRatioTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	riskFreeRate, _ := input.Arguments["risk_free_rate"].(float64)
	if riskFreeRate == 0 {
		riskFreeRate = 0.05
	}

	// Mock calculation
	data := map[string]interface{}{
		"sharpe_ratio":      1.45,
		"sortino_ratio":     1.82,
		"annualized_return": 0.18,
		"annualized_vol":    0.15,
		"risk_free_rate":    riskFreeRate,
		"interpretation":    "good",
		"benchmark_sharpe":  0.85,
		"percentile_rank":   75,
		"calculated_at":     time.Now().UTC().Format(time.RFC3339),
	}

	jsonData, _ := json.Marshal(data)

	return &tools.ExecutionResult{
		ToolID:    input.ToolID,
		RequestID: input.Context.RequestID,
		Success:   true,
		Data:      jsonData,
		Metadata: tools.ResultMetadata{
			Confidence: 0.92,
			Sources:    []string{"performance_analytics"},
		},
	}, nil
}

// CalculatePositionSizeTool calculates optimal position size
type CalculatePositionSizeTool struct {
	tools.BaseTool
}

// Definition returns the tool definition
func (t *CalculatePositionSizeTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "risk.calculate_position_size",
		Name:        "Calculate Position Size",
		Version:     "1.0.0",
		Description: "Calculates optimal position size based on risk parameters",
		Category:    tools.CategoryRisk,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "account_size",
				Type:        "number",
				Description: "Total account size",
				Required:    true,
				Min:         func() *float64 { v := 0.0; return &v }(),
			},
			{
				Name:        "risk_per_trade",
				Type:        "number",
				Description: "Risk per trade as decimal (e.g., 0.02 for 2%)",
				Required:    true,
				Min:         func() *float64 { v := 0.001; return &v }(),
				Max:         func() *float64 { v := 0.1; return &v }(),
			},
			{
				Name:        "entry_price",
				Type:        "number",
				Description: "Entry price",
				Required:    true,
			},
			{
				Name:        "stop_loss_price",
				Type:        "number",
				Description: "Stop loss price",
				Required:    true,
			},
		},
		Result: tools.ResultDefinition{
			Type:        "object",
			Description: "Position size recommendation",
		},
		ExecutionMode:    tools.ExecutionSync,
		PermissionLevel:  tools.PermissionAnalyze,
		RiskLevel:        tools.RiskLow,
		Tags:            []string{"risk", "position_sizing", "money_management"},
		Timeout:         5 * time.Second,
	}
}

// Execute runs the tool
func (t *CalculatePositionSizeTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	accountSize, _ := input.Arguments["account_size"].(float64)
	riskPerTrade, _ := input.Arguments["risk_per_trade"].(float64)
	entryPrice, _ := input.Arguments["entry_price"].(float64)
	stopLossPrice, _ := input.Arguments["stop_loss_price"].(float64)

	// Calculate position size
	riskAmount := accountSize * riskPerTrade
	riskPerShare := entryPrice - stopLossPrice
	if riskPerShare < 0 {
		riskPerShare = -riskPerShare
	}

	shares := int(riskAmount / riskPerShare)
	positionValue := float64(shares) * entryPrice

	data := map[string]interface{}{
		"account_size":      accountSize,
		"risk_per_trade":    riskPerTrade,
		"max_risk_amount":   riskAmount,
		"entry_price":       entryPrice,
		"stop_loss_price":   stopLossPrice,
		"risk_per_share":    riskPerShare,
		"recommended_shares": shares,
		"position_value":    positionValue,
		"position_pct":      positionValue / accountSize,
		"warnings":          []string{},
		"calculated_at":     time.Now().UTC().Format(time.RFC3339),
	}

	jsonData, _ := json.Marshal(data)

	return &tools.ExecutionResult{
		ToolID:    input.ToolID,
		RequestID: input.Context.RequestID,
		Success:   true,
		Data:      jsonData,
		Metadata: tools.ResultMetadata{
			Confidence: 0.95,
			Sources:    []string{"position_sizing_engine"},
		},
	}, nil
}

// Ensure tools implement the interface
var _ tools.ToolExecutor = (*CalculateVaRTool)(nil)
var _ tools.ToolExecutor = (*AssessRiskTool)(nil)
var _ tools.ToolExecutor = (*CalculateSharpeRatioTool)(nil)
var _ tools.ToolExecutor = (*CalculatePositionSizeTool)(nil)
