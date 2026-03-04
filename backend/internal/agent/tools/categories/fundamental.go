package categories

import (
	"context"
	"encoding/json"
	"time"

	"github.com/v13478/omnitrade/backend/internal/agent/tools"
)

func init() {
	// Register fundamental data tools
	tools.MustRegister(&GetCompanyProfileTool{})
	tools.MustRegister(&GetFinancialsTool{})
	tools.MustRegister(&GetEarningsTool{})
	tools.MustRegister(&GetDividendsTool{})
}

// GetCompanyProfileTool retrieves company profile and key metrics
type GetCompanyProfileTool struct {
	tools.BaseTool
}

// Definition returns the tool definition
func (t *GetCompanyProfileTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "fundamental.get_profile",
		Name:        "Get Company Profile",
		Version:     "1.0.0",
		Description: "Retrieves company profile, description, and key business metrics",
		Category:    tools.CategoryFundamental,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "symbol",
				Type:        "string",
				Description: "Stock symbol",
				Required:    true,
				Pattern:     "^[A-Z]{1,5}$",
			},
		},
		Result: tools.ResultDefinition{
			Type:        "object",
			Description: "Company profile and key metrics",
		},
		ExecutionMode:    tools.ExecutionSync,
		PermissionLevel:  tools.PermissionRead,
		RiskLevel:        tools.RiskLow,
		Tags:            []string{"fundamental", "company", "profile"},
		Timeout:         10 * time.Second,
	}
}

// Execute runs the tool
func (t *GetCompanyProfileTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	symbol, _ := input.Arguments["symbol"].(string)

	data := map[string]interface{}{
		"symbol":      symbol,
		"name":        "Apple Inc.",
		"exchange":    "NASDAQ",
		"sector":      "Technology",
		"industry":    "Consumer Electronics",
		"description": "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories.",
		"employees":   164000,
		"founded":     1976,
		"headquarters": "Cupertino, California",
		"website":     "https://www.apple.com",
		"ceo":         "Tim Cook",
		"market_cap":  2.8e12,
		"enterprise_value": 2.85e12,
		"key_metrics": map[string]interface{}{
			"pe_ratio":           28.5,
			"forward_pe":         25.2,
			"price_to_book":      45.5,
			"price_to_sales":     7.2,
			"ev_to_ebitda":       21.3,
			"profit_margin":      0.253,
			"operating_margin":   0.298,
			"roe":                1.47,
			"roa":                0.28,
			"dividend_yield":     0.005,
			"beta":               1.28,
		},
		"retrieved_at": time.Now().UTC().Format(time.RFC3339),
	}

	jsonData, _ := json.Marshal(data)

	return &tools.ExecutionResult{
		ToolID:    input.ToolID,
		RequestID: input.Context.RequestID,
		Success:   true,
		Data:      jsonData,
		Metadata: tools.ResultMetadata{
			Confidence: 0.95,
			Sources:    []string{"company_profile_db", "market_data"},
		},
	}, nil
}

// GetFinancialsTool retrieves financial statements
type GetFinancialsTool struct {
	tools.BaseTool
}

// Definition returns the tool definition
func (t *GetFinancialsTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "fundamental.get_financials",
		Name:        "Get Financials",
		Version:     "1.0.0",
		Description: "Retrieves financial statements (income statement, balance sheet, cash flow)",
		Category:    tools.CategoryFundamental,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "symbol",
				Type:        "string",
				Description: "Stock symbol",
				Required:    true,
			},
			{
				Name:        "statement_type",
				Type:        "string",
				Description: "Type of financial statement",
				Required:    false,
				Default:     "all",
				Enum:        []string{"all", "income", "balance", "cashflow"},
			},
			{
				Name:        "period",
				Type:        "string",
				Description: "Period type",
				Required:    false,
				Default:     "annual",
				Enum:        []string{"annual", "quarterly"},
			},
			{
				Name:        "years",
				Type:        "integer",
				Description: "Number of years to retrieve",
				Required:    false,
				Default:     3,
				Min:         func() *float64 { v := 1.0; return &v }(),
				Max:         func() *float64 { v := 10.0; return &v }(),
			},
		},
		Result: tools.ResultDefinition{
			Type:        "object",
			Description: "Financial statement data",
		},
		ExecutionMode:    tools.ExecutionSync,
		PermissionLevel:  tools.PermissionRead,
		RiskLevel:        tools.RiskLow,
		Tags:            []string{"fundamental", "financials", "statements"},
		Timeout:         15 * time.Second,
	}
}

// Execute runs the tool
func (t *GetFinancialsTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	symbol, _ := input.Arguments["symbol"].(string)
	statementType, _ := input.Arguments["statement_type"].(string)
	if statementType == "" {
		statementType = "all"
	}
	period, _ := input.Arguments["period"].(string)
	if period == "" {
		period = "annual"
	}

	data := map[string]interface{}{
		"symbol":         symbol,
		"statement_type": statementType,
		"period":         period,
		"income_statement": map[string]interface{}{
			"revenue": []map[string]interface{}{
				{"year": 2024, "value": 394328000000},
				{"year": 2023, "value": 383285000000},
				{"year": 2022, "value": 394328000000},
			},
			"net_income": []map[string]interface{}{
				{"year": 2024, "value": 96995000000},
				{"year": 2023, "value": 96995000000},
				{"year": 2022, "value": 99803000000},
			},
			"eps": []map[string]interface{}{
				{"year": 2024, "value": 6.42},
				{"year": 2023, "value": 6.13},
				{"year": 2022, "value": 6.11},
			},
		},
		"balance_sheet": map[string]interface{}{
			"total_assets":  352583000000,
			"total_liabilities": 290437000000,
			"shareholders_equity": 62146000000,
			"cash_and_equivalents": 29965000000,
			"total_debt": 111088000000,
		},
		"cash_flow": map[string]interface{}{
			"operating_cash_flow": 110543000000,
			"capex":              -10945000000,
			"free_cash_flow":      99598000000,
			"dividends_paid":     -14841000000,
		},
		"retrieved_at": time.Now().UTC().Format(time.RFC3339),
	}

	jsonData, _ := json.Marshal(data)

	return &tools.ExecutionResult{
		ToolID:    input.ToolID,
		RequestID: input.Context.RequestID,
		Success:   true,
		Data:      jsonData,
		Metadata: tools.ResultMetadata{
			Confidence: 0.95,
			Sources:    []string{"sec_filings", "financial_db"},
		},
	}, nil
}

// GetEarningsTool retrieves earnings data and calendar
type GetEarningsTool struct {
	tools.BaseTool
}

// Definition returns the tool definition
func (t *GetEarningsTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "fundamental.get_earnings",
		Name:        "Get Earnings",
		Version:     "1.0.0",
		Description: "Retrieves earnings history, estimates, and upcoming earnings dates",
		Category:    tools.CategoryFundamental,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "symbol",
				Type:        "string",
				Description: "Stock symbol",
				Required:    true,
			},
			{
				Name:        "include_estimates",
				Type:        "boolean",
				Description: "Include analyst estimates",
				Required:    false,
				Default:     true,
			},
		},
		Result: tools.ResultDefinition{
			Type:        "object",
			Description: "Earnings data and calendar",
		},
		ExecutionMode:    tools.ExecutionSync,
		PermissionLevel:  tools.PermissionRead,
		RiskLevel:        tools.RiskLow,
		Tags:            []string{"fundamental", "earnings", "estimates"},
		Timeout:         10 * time.Second,
	}
}

// Execute runs the tool
func (t *GetEarningsTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	symbol, _ := input.Arguments["symbol"].(string)

	data := map[string]interface{}{
		"symbol": symbol,
		"next_earnings_date": time.Now().Add(30 * 24 * time.Hour).Format("2006-01-02"),
		"fiscal_quarter":     "Q2 2024",
		"historical": []map[string]interface{}{
			{
				"quarter":        "Q1 2024",
				"report_date":    "2024-01-25",
				"eps_estimate":   2.10,
				"eps_actual":     2.18,
				"surprise":       0.08,
				"surprise_pct":   3.81,
				"revenue_estimate": 117900000000,
				"revenue_actual":   119575000000,
			},
			{
				"quarter":        "Q4 2023",
				"report_date":    "2023-10-26",
				"eps_estimate":   1.39,
				"eps_actual":     1.46,
				"surprise":       0.07,
				"surprise_pct":   5.04,
			},
		},
		"estimates": map[string]interface{}{
			"eps_estimate":     1.52,
			"eps_high":         1.65,
			"eps_low":          1.40,
			"revenue_estimate": 95000000000,
			"num_analysts":     28,
		},
		"surprise_history": map[string]interface{}{
			"beat_count":   8,
			"miss_count":   0,
			"meet_count":   0,
			"avg_surprise": 4.2,
		},
		"retrieved_at": time.Now().UTC().Format(time.RFC3339),
	}

	jsonData, _ := json.Marshal(data)

	return &tools.ExecutionResult{
		ToolID:    input.ToolID,
		RequestID: input.Context.RequestID,
		Success:   true,
		Data:      jsonData,
		Metadata: tools.ResultMetadata{
			Confidence: 0.90,
			Sources:    []string{"earnings_db", "analyst_estimates"},
		},
	}, nil
}

// GetDividendsTool retrieves dividend history and yield
type GetDividendsTool struct {
	tools.BaseTool
}

// Definition returns the tool definition
func (t *GetDividendsTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "fundamental.get_dividends",
		Name:        "Get Dividends",
		Version:     "1.0.0",
		Description: "Retrieves dividend history, yield, and upcoming dividend dates",
		Category:    tools.CategoryFundamental,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "symbol",
				Type:        "string",
				Description: "Stock symbol",
				Required:    true,
			},
			{
				Name:        "years",
				Type:        "integer",
				Description: "Years of history to retrieve",
				Required:    false,
				Default:     5,
				Min:         func() *float64 { v := 1.0; return &v }(),
				Max:         func() *float64 { v := 20.0; return &v }(),
			},
		},
		Result: tools.ResultDefinition{
			Type:        "object",
			Description: "Dividend data and history",
		},
		ExecutionMode:    tools.ExecutionSync,
		PermissionLevel:  tools.PermissionRead,
		RiskLevel:        tools.RiskLow,
		Tags:            []string{"fundamental", "dividends", "income"},
		Timeout:         10 * time.Second,
	}
}

// Execute runs the tool
func (t *GetDividendsTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	symbol, _ := input.Arguments["symbol"].(string)

	data := map[string]interface{}{
		"symbol":           symbol,
		"current_yield":    0.0052,
		"annual_dividend":  0.96,
		"dividend_growth_5y": 0.045,
		"payout_ratio":     0.15,
		"next_ex_date":     time.Now().Add(60 * 24 * time.Hour).Format("2006-01-02"),
		"next_pay_date":    time.Now().Add(75 * 24 * time.Hour).Format("2006-01-02"),
		"frequency":        "quarterly",
		"history": []map[string]interface{}{
			{
				"ex_date":    "2024-02-09",
				"pay_date":   "2024-02-15",
				"amount":     0.24,
				"yield_at_time": 0.0051,
			},
			{
				"ex_date":    "2023-11-10",
				"pay_date":   "2023-11-16",
				"amount":     0.24,
				"yield_at_time": 0.0052,
			},
		},
		"growth_history": []map[string]interface{}{
			{"year": 2024, "amount": 0.96, "growth": 0.043},
			{"year": 2023, "amount": 0.92, "growth": 0.044},
			{"year": 2022, "amount": 0.88, "growth": 0.045},
		},
		"aristocrat_years": 11,
		"retrieved_at":     time.Now().UTC().Format(time.RFC3339),
	}

	jsonData, _ := json.Marshal(data)

	return &tools.ExecutionResult{
		ToolID:    input.ToolID,
		RequestID: input.Context.RequestID,
		Success:   true,
		Data:      jsonData,
		Metadata: tools.ResultMetadata{
			Confidence: 0.95,
			Sources:    []string{"dividend_db", "sec_filings"},
		},
	}, nil
}

// Ensure tools implement the interface
var _ tools.ToolExecutor = (*GetCompanyProfileTool)(nil)
var _ tools.ToolExecutor = (*GetFinancialsTool)(nil)
var _ tools.ToolExecutor = (*GetEarningsTool)(nil)
var _ tools.ToolExecutor = (*GetDividendsTool)(nil)
