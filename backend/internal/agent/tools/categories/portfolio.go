package categories

import (
	"context"
	"encoding/json"
	"time"

	"github.com/v13478/omnitrade/backend/internal/agent/tools"
)

func init() {
	// Register portfolio management tools
	tools.MustRegister(&GetPortfolioTool{})
	tools.MustRegister(&AnalyzePortfolioTool{})
	tools.MustRegister(&GenerateTradeProposalTool{})
	tools.MustRegister(&GetTradeHistoryTool{})
}

// GetPortfolioTool retrieves current portfolio state
type GetPortfolioTool struct {
	tools.BaseTool
}

// Definition returns the tool definition
func (t *GetPortfolioTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "portfolio.get",
		Name:        "Get Portfolio",
		Version:     "1.0.0",
		Description: "Retrieves the current portfolio holdings and values",
		Category:    tools.CategoryPortfolio,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "portfolio_id",
				Type:        "string",
				Description: "Portfolio identifier",
				Required:    false,
			},
			{
				Name:        "include_history",
				Type:        "boolean",
				Description: "Include historical performance",
				Required:    false,
				Default:     false,
			},
		},
		Result: tools.ResultDefinition{
			Type:        "object",
			Description: "Portfolio holdings and summary",
		},
		ExecutionMode:    tools.ExecutionSync,
		PermissionLevel:  tools.PermissionRead,
		RiskLevel:        tools.RiskLow,
		Tags:            []string{"portfolio", "holdings", "positions"},
		Timeout:         10 * time.Second,
	}
}

// Execute runs the tool
func (t *GetPortfolioTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	portfolioID, _ := input.Arguments["portfolio_id"].(string)
	if portfolioID == "" {
		portfolioID = "default"
	}

	data := map[string]interface{}{
		"portfolio_id":   portfolioID,
		"total_value":    125000.00,
		"cash_balance":   25000.00,
		"invested_value": 100000.00,
		"day_pnl":        1250.00,
		"day_pnl_pct":    0.01,
		"total_pnl":      15000.00,
		"total_pnl_pct":  0.12,
		"positions": []map[string]interface{}{
			{
				"symbol":       "AAPL",
				"quantity":     100,
				"avg_cost":     145.00,
				"current_price": 150.25,
				"market_value": 15025.00,
				"pnl":          525.00,
				"pnl_pct":      0.036,
				"weight":       0.15,
			},
			{
				"symbol":       "MSFT",
				"quantity":     50,
				"avg_cost":     380.00,
				"current_price": 395.50,
				"market_value": 19775.00,
				"pnl":          775.00,
				"pnl_pct":      0.041,
				"weight":       0.20,
			},
		},
		"asset_allocation": map[string]float64{
			"equities":   0.80,
			"cash":       0.20,
		},
		"sector_breakdown": map[string]float64{
			"Technology": 0.60,
			"Healthcare": 0.15,
			"Finance":    0.05,
		},
		"last_updated": time.Now().UTC().Format(time.RFC3339),
	}

	jsonData, _ := json.Marshal(data)

	return &tools.ExecutionResult{
		ToolID:    input.ToolID,
		RequestID: input.Context.RequestID,
		Success:   true,
		Data:      jsonData,
		Metadata: tools.ResultMetadata{
			CacheHit:   false,
			Confidence: 1.0,
			Sources:    []string{"portfolio_db"},
		},
	}, nil
}

// AnalyzePortfolioTool performs portfolio analysis
type AnalyzePortfolioTool struct {
	tools.BaseTool
}

// Definition returns the tool definition
func (t *AnalyzePortfolioTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "portfolio.analyze",
		Name:        "Analyze Portfolio",
		Version:     "1.0.0",
		Description: "Performs comprehensive portfolio analysis including diversification, risk, and performance",
		Category:    tools.CategoryPortfolio,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "portfolio_id",
				Type:        "string",
				Description: "Portfolio identifier",
				Required:    false,
			},
			{
				Name:        "analysis_type",
				Type:        "string",
				Description: "Type of analysis to perform",
				Required:    false,
				Default:     "full",
				Enum:        []string{"full", "risk", "performance", "diversification"},
			},
		},
		Result: tools.ResultDefinition{
			Type:        "object",
			Description: "Portfolio analysis report",
		},
		ExecutionMode:    tools.ExecutionSync,
		PermissionLevel:  tools.PermissionAnalyze,
		RiskLevel:        tools.RiskLow,
		Tags:            []string{"portfolio", "analysis", "diversification"},
		Timeout:         20 * time.Second,
		Dependencies:    []string{"portfolio.get", "risk.calculate_var"},
	}
}

// Execute runs the tool
func (t *AnalyzePortfolioTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	analysisType, _ := input.Arguments["analysis_type"].(string)
	if analysisType == "" {
		analysisType = "full"
	}

	data := map[string]interface{}{
		"analysis_type": analysisType,
		"diversification": map[string]interface{}{
			"score":           72,
			"rating":          "good",
			"concentration_risk": "moderate",
			"top_10_weight":   0.45,
			"num_holdings":    15,
			"recommendations": []string{
				"Consider adding international exposure",
				"Increase bond allocation for stability",
			},
		},
		"risk_analysis": map[string]interface{}{
			"portfolio_beta":      1.15,
			"volatility_annual":   0.18,
			"max_drawdown":        -0.12,
			"sharpe_ratio":        1.25,
			"var_95":              2500.00,
		},
		"performance": map[string]interface{}{
			"ytd_return":        0.15,
			"1y_return":         0.22,
			"3y_annualized":     0.18,
			"benchmark_return":  0.12,
			"alpha":             0.06,
		},
		"correlation_matrix": map[string]interface{}{
			"AAPL_MSFT": 0.72,
			"AAPL_GOOGL": 0.58,
		},
		"analyzed_at": time.Now().UTC().Format(time.RFC3339),
	}

	jsonData, _ := json.Marshal(data)

	return &tools.ExecutionResult{
		ToolID:    input.ToolID,
		RequestID: input.Context.RequestID,
		Success:   true,
		Data:      jsonData,
		Metadata: tools.ResultMetadata{
			Confidence: 0.90,
			Sources:    []string{"portfolio_analytics", "market_data"},
		},
	}, nil
}

// GenerateTradeProposalTool generates a trade proposal for HITL review
type GenerateTradeProposalTool struct {
	tools.BaseTool
}

// Definition returns the tool definition
func (t *GenerateTradeProposalTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "portfolio.generate_proposal",
		Name:        "Generate Trade Proposal",
		Version:     "1.0.0",
		Description: "Generates a trade proposal for human-in-the-loop review and approval",
		Category:    tools.CategoryPortfolio,
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
				Required:    false,
				Min:         func() *float64 { v := 1.0; return &v }(),
			},
			{
				Name:        "strategy",
				Type:        "string",
				Description: "Trading strategy rationale",
				Required:    true,
				Enum:        []string{"momentum", "mean_reversion", "breakout", "value", "sentiment", "technical"},
			},
			{
				Name:        "stop_loss_pct",
				Type:        "number",
				Description: "Stop loss percentage",
				Required:    false,
				Default:     0.05,
				Min:         func() *float64 { v := 0.01; return &v }(),
				Max:         func() *float64 { v := 0.20; return &v }(),
			},
			{
				Name:        "take_profit_pct",
				Type:        "number",
				Description: "Take profit percentage",
				Required:    false,
				Default:     0.10,
				Min:         func() *float64 { v := 0.01; return &v }(),
			},
		},
		Result: tools.ResultDefinition{
			Type:        "object",
			Description: "Trade proposal for HITL approval",
		},
		ExecutionMode:    tools.ExecutionSync,
		PermissionLevel:  tools.PermissionTrade,
		RiskLevel:        tools.RiskHigh,
		Tags:            []string{"portfolio", "trade", "proposal", "hitl"},
		Timeout:         30 * time.Second,
		Dependencies:    []string{"market_data.get_price", "risk.assess", "sentiment.get_news", "technical.calculate_rsi"},
	}
}

// Execute runs the tool
func (t *GenerateTradeProposalTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	symbol, _ := input.Arguments["symbol"].(string)
	action, _ := input.Arguments["action"].(string)
	strategy, _ := input.Arguments["strategy"].(string)
	stopLossPct, _ := input.Arguments["stop_loss_pct"].(float64)
	if stopLossPct == 0 {
		stopLossPct = 0.05
	}
	takeProfitPct, _ := input.Arguments["take_profit_pct"].(float64)
	if takeProfitPct == 0 {
		takeProfitPct = 0.10
	}

	// Mock current price
	currentPrice := 150.25

	// Calculate stop loss and take profit
	var stopLoss, takeProfit float64
	if action == "BUY" {
		stopLoss = currentPrice * (1 - stopLossPct)
		takeProfit = currentPrice * (1 + takeProfitPct)
	} else {
		stopLoss = currentPrice * (1 + stopLossPct)
		takeProfit = currentPrice * (1 - takeProfitPct)
	}

	data := map[string]interface{}{
		"proposal_id":      "TP-2024-001234",
		"symbol":           symbol,
		"action":           action,
		"strategy":         strategy,
		"current_price":    currentPrice,
		"proposed_entry":   currentPrice,
		"stop_loss":        stopLoss,
		"take_profit":      takeProfit,
		"risk_reward_ratio": takeProfitPct / stopLossPct,
		"confidence_score": 0.85,
		"reasoning":        "Based on momentum strategy with positive news sentiment and bullish technical indicators.",
		"supporting_data": map[string]interface{}{
			"rsi":               58.5,
			"macd_signal":       "bullish_crossover",
			"sentiment_score":   0.72,
			"analyst_rating":    "BUY",
			"volume_trend":      "increasing",
		},
		"risk_assessment": map[string]interface{}{
			"risk_score":    65,
			"risk_category": "moderate",
			"max_loss_pct":  stopLossPct,
		},
		"status":           "PENDING_APPROVAL",
		"requires_approval": true,
		"expires_at":       time.Now().Add(24 * time.Hour).UTC().Format(time.RFC3339),
		"created_at":       time.Now().UTC().Format(time.RFC3339),
	}

	jsonData, _ := json.Marshal(data)

	return &tools.ExecutionResult{
		ToolID:    input.ToolID,
		RequestID: input.Context.RequestID,
		Success:   true,
		Data:      jsonData,
		Metadata: tools.ResultMetadata{
			Confidence:    0.85,
			Sources:       []string{"ai_analysis", "market_data", "sentiment"},
			HumanApproval: true,
			Warnings:      []string{"Trade requires human approval before execution"},
		},
	}, nil
}

// GetTradeHistoryTool retrieves trade history
type GetTradeHistoryTool struct {
	tools.BaseTool
}

// Definition returns the tool definition
func (t *GetTradeHistoryTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "portfolio.get_history",
		Name:        "Get Trade History",
		Version:     "1.0.0",
		Description: "Retrieves trade history and execution records",
		Category:    tools.CategoryPortfolio,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "portfolio_id",
				Type:        "string",
				Description: "Portfolio identifier",
				Required:    false,
			},
			{
				Name:        "start_date",
				Type:        "string",
				Description: "Start date (YYYY-MM-DD)",
				Required:    false,
			},
			{
				Name:        "end_date",
				Type:        "string",
				Description: "End date (YYYY-MM-DD)",
				Required:    false,
			},
			{
				Name:        "symbol",
				Type:        "string",
				Description: "Filter by symbol",
				Required:    false,
			},
			{
				Name:        "limit",
				Type:        "integer",
				Description: "Maximum results",
				Required:    false,
				Default:     50,
				Min:         func() *float64 { v := 1.0; return &v }(),
				Max:         func() *float64 { v := 500.0; return &v }(),
			},
		},
		Result: tools.ResultDefinition{
			Type:        "object",
			Description: "Trade history records",
		},
		ExecutionMode:    tools.ExecutionSync,
		PermissionLevel:  tools.PermissionRead,
		RiskLevel:        tools.RiskLow,
		Tags:            []string{"portfolio", "history", "trades"},
		Timeout:         10 * time.Second,
	}
}

// Execute runs the tool
func (t *GetTradeHistoryTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	limit, _ := input.Arguments["limit"].(int)
	if limit == 0 {
		limit = 50
	}

	data := map[string]interface{}{
		"total_trades": 125,
		"total_volume": 50000,
		"win_rate":     0.62,
		"avg_pnl_per_trade": 245.00,
		"trades": []map[string]interface{}{
			{
				"trade_id":     "TRD-2024-001234",
				"symbol":       "AAPL",
				"action":       "BUY",
				"quantity":     100,
				"price":        148.50,
				"total_value":  14850.00,
				"executed_at":  time.Now().Add(-24 * time.Hour).UTC().Format(time.RFC3339),
				"commission":   4.95,
				"status":       "FILLED",
				"strategy":     "momentum",
				"approved_by":  "user_123",
			},
			{
				"trade_id":     "TRD-2024-001233",
				"symbol":       "MSFT",
				"action":       "SELL",
				"quantity":     25,
				"price":        395.00,
				"total_value":  9875.00,
				"executed_at":  time.Now().Add(-48 * time.Hour).UTC().Format(time.RFC3339),
				"commission":   4.95,
				"status":       "FILLED",
				"strategy":     "mean_reversion",
				"approved_by":  "user_123",
			},
		},
		"summary": map[string]interface{}{
			"total_commissions": 618.75,
			"total_pnl":         30625.00,
			"best_trade":        "GOOGL +$2,450",
			"worst_trade":       "TSLA -$890",
		},
		"queried_at": time.Now().UTC().Format(time.RFC3339),
	}

	jsonData, _ := json.Marshal(data)

	return &tools.ExecutionResult{
		ToolID:    input.ToolID,
		RequestID: input.Context.RequestID,
		Success:   true,
		Data:      jsonData,
		Metadata: tools.ResultMetadata{
			Confidence: 1.0,
			Sources:    []string{"trade_history_db"},
		},
	}, nil
}

// Ensure tools implement the interface
var _ tools.ToolExecutor = (*GetPortfolioTool)(nil)
var _ tools.ToolExecutor = (*AnalyzePortfolioTool)(nil)
var _ tools.ToolExecutor = (*GenerateTradeProposalTool)(nil)
var _ tools.ToolExecutor = (*GetTradeHistoryTool)(nil)
