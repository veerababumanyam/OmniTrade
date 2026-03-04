// Package categories provides implementations of tools organized by category.
// Each file in this package registers tools using init() functions for automatic registration.
package categories

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/v13478/omnitrade/backend/internal/agent/tools"
)

func init() {
	// Register market data tools
	tools.MustRegister(&GetMarketPriceTool{})
	tools.MustRegister(&GetHistoricalPricesTool{})
	tools.MustRegister(&GetMarketDepthTool{})
	tools.MustRegister(&GetTickDataTool{})
}

// GetMarketPriceTool retrieves current market price for a symbol
type GetMarketPriceTool struct {
	tools.BaseTool
}

func init() {
	// This empty init ensures the file is processed
}

// Definition returns the tool definition
func (t *GetMarketPriceTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "market_data.get_price",
		Name:        "Get Market Price",
		Version:     "1.0.0",
		Description: "Retrieves the current market price for a given stock symbol",
		Category:    tools.CategoryMarketData,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "symbol",
				Type:        "string",
				Description: "Stock symbol (e.g., AAPL, MSFT)",
				Required:    true,
				Pattern:     "^[A-Z]{1,5}$",
			},
			{
				Name:        "exchange",
				Type:        "string",
				Description: "Exchange code (optional)",
				Required:    false,
				Enum:        []string{"NYSE", "NASDAQ", "AMEX", "LSE", "TSE"},
			},
		},
		Result: tools.ResultDefinition{
			Type:        "object",
			Description: "Current market price data",
			Schema: map[string]tools.ParameterDefinition{
				"symbol":    {Type: "string", Description: "Stock symbol"},
				"price":     {Type: "number", Description: "Current price"},
				"change":    {Type: "number", Description: "Price change"},
				"change_pct": {Type: "number", Description: "Percentage change"},
				"volume":    {Type: "integer", Description: "Trading volume"},
				"timestamp": {Type: "string", Description: "Data timestamp"},
			},
		},
		ExecutionMode:    tools.ExecutionSync,
		PermissionLevel:  tools.PermissionRead,
		RiskLevel:        tools.RiskLow,
		Tags:            []string{"realtime", "price", "quote"},
		Timeout:         10 * time.Second,
		RateLimitRequests: 100,
		RateLimitWindow:   time.Minute,
	}
}

// Execute runs the tool
func (t *GetMarketPriceTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	symbol, _ := input.Arguments["symbol"].(string)
	exchange, _ := input.Arguments["exchange"].(string)

	// In production, this would query the database or external API
	// For now, return mock data
	data := map[string]interface{}{
		"symbol":     symbol,
		"price":      150.25,
		"change":     2.50,
		"change_pct": 1.69,
		"volume":     50000000,
		"exchange":   exchange,
		"timestamp":  time.Now().UTC().Format(time.RFC3339),
	}

	jsonData, _ := json.Marshal(data)

	return &tools.ExecutionResult{
		ToolID:    input.ToolID,
		RequestID: input.Context.RequestID,
		Success:   true,
		Data:      jsonData,
		Metadata: tools.ResultMetadata{
			CacheHit:      false,
			DataStaleness: 0,
			Confidence:    0.95,
			Sources:       []string{"market_data_table"},
		},
	}, nil
}

// GetHistoricalPricesTool retrieves historical price data
type GetHistoricalPricesTool struct {
	tools.BaseTool
}

// Definition returns the tool definition
func (t *GetHistoricalPricesTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "market_data.get_historical",
		Name:        "Get Historical Prices",
		Version:     "1.0.0",
		Description: "Retrieves historical price data for a stock symbol over a date range",
		Category:    tools.CategoryMarketData,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "symbol",
				Type:        "string",
				Description: "Stock symbol",
				Required:    true,
				Pattern:     "^[A-Z]{1,5}$",
			},
			{
				Name:        "start_date",
				Type:        "string",
				Description: "Start date (YYYY-MM-DD)",
				Required:    true,
				Pattern:     "^\\d{4}-\\d{2}-\\d{2}$",
			},
			{
				Name:        "end_date",
				Type:        "string",
				Description: "End date (YYYY-MM-DD)",
				Required:    true,
				Pattern:     "^\\d{4}-\\d{2}-\\d{2}$",
			},
			{
				Name:        "interval",
				Type:        "string",
				Description: "Data interval",
				Required:    false,
				Default:     "1d",
				Enum:        []string{"1m", "5m", "15m", "1h", "1d", "1w", "1M"},
			},
		},
		Result: tools.ResultDefinition{
			Type:        "array",
			Description: "Array of historical price data points",
		},
		ExecutionMode:    tools.ExecutionSync,
		PermissionLevel:  tools.PermissionRead,
		RiskLevel:        tools.RiskLow,
		Tags:            []string{"historical", "price", "timeseries"},
		Timeout:         30 * time.Second,
		RateLimitRequests: 50,
		RateLimitWindow:   time.Minute,
	}
}

// Execute runs the tool
func (t *GetHistoricalPricesTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	symbol, _ := input.Arguments["symbol"].(string)
	startDate, _ := input.Arguments["start_date"].(string)
	endDate, _ := input.Arguments["end_date"].(string)
	interval, _ := input.Arguments["interval"].(string)
	if interval == "" {
		interval = "1d"
	}

	// In production, query database with date range
	data := map[string]interface{}{
		"symbol":     symbol,
		"start_date": startDate,
		"end_date":   endDate,
		"interval":   interval,
		"data": []map[string]interface{}{
			{
				"date":   startDate,
				"open":   148.00,
				"high":   152.00,
				"low":    147.50,
				"close":  150.25,
				"volume": 50000000,
			},
		},
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
			Sources:    []string{"market_data_table"},
		},
	}, nil
}

// GetMarketDepthTool retrieves order book depth data
type GetMarketDepthTool struct {
	tools.BaseTool
}

// Definition returns the tool definition
func (t *GetMarketDepthTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "market_data.get_depth",
		Name:        "Get Market Depth",
		Version:     "1.0.0",
		Description: "Retrieves order book depth (bid/ask levels) for a stock symbol",
		Category:    tools.CategoryMarketData,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "symbol",
				Type:        "string",
				Description: "Stock symbol",
				Required:    true,
			},
			{
				Name:        "levels",
				Type:        "integer",
				Description: "Number of price levels to return",
				Required:    false,
				Default:     5,
				Min:         func() *float64 { v := 1.0; return &v }(),
				Max:         func() *float64 { v := 20.0; return &v }(),
			},
		},
		Result: tools.ResultDefinition{
			Type:        "object",
			Description: "Order book depth with bid/ask levels",
		},
		ExecutionMode:    tools.ExecutionSync,
		PermissionLevel:  tools.PermissionRead,
		RiskLevel:        tools.RiskLow,
		Tags:            []string{"orderbook", "depth", "realtime"},
		Timeout:         5 * time.Second,
	}
}

// Execute runs the tool
func (t *GetMarketDepthTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	symbol, _ := input.Arguments["symbol"].(string)

	// Mock order book data
	data := map[string]interface{}{
		"symbol": symbol,
		"bids": []map[string]interface{}{
			{"price": 150.20, "size": 1000},
			{"price": 150.15, "size": 2500},
			{"price": 150.10, "size": 3000},
		},
		"asks": []map[string]interface{}{
			{"price": 150.25, "size": 1500},
			{"price": 150.30, "size": 2000},
			{"price": 150.35, "size": 2500},
		},
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}

	jsonData, _ := json.Marshal(data)

	return &tools.ExecutionResult{
		ToolID:    input.ToolID,
		RequestID: input.Context.RequestID,
		Success:   true,
		Data:      jsonData,
		Metadata: tools.ResultMetadata{
			CacheHit:   false,
			Confidence: 0.95,
			Sources:    []string{"order_book_feed"},
		},
	}, nil
}

// GetTickDataTool retrieves tick-by-tick trade data
type GetTickDataTool struct {
	tools.BaseTool
}

// Definition returns the tool definition
func (t *GetTickDataTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "market_data.get_ticks",
		Name:        "Get Tick Data",
		Version:     "1.0.0",
		Description: "Retrieves tick-by-tick trade data for a stock symbol",
		Category:    tools.CategoryMarketData,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "symbol",
				Type:        "string",
				Description: "Stock symbol",
				Required:    true,
			},
			{
				Name:        "limit",
				Type:        "integer",
				Description: "Maximum number of ticks to return",
				Required:    false,
				Default:     100,
				Min:         func() *float64 { v := 1.0; return &v }(),
				Max:         func() *float64 { v := 10000.0; return &v }(),
			},
		},
		Result: tools.ResultDefinition{
			Type:        "array",
			Description: "Array of tick data points",
		},
		ExecutionMode:    tools.ExecutionStreaming,
		PermissionLevel:  tools.PermissionRead,
		RiskLevel:        tools.RiskLow,
		Tags:            []string{"ticks", "trades", "realtime"},
		Timeout:         15 * time.Second,
	}
}

// Execute runs the tool
func (t *GetTickDataTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	symbol, _ := input.Arguments["symbol"].(string)

	// Mock tick data
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

	data := map[string]interface{}{
		"symbol": symbol,
		"ticks":  ticks,
	}

	jsonData, _ := json.Marshal(data)

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

// Ensure tools implement the interface
var _ tools.ToolExecutor = (*GetMarketPriceTool)(nil)
var _ tools.ToolExecutor = (*GetHistoricalPricesTool)(nil)
var _ tools.ToolExecutor = (*GetMarketDepthTool)(nil)
var _ tools.ToolExecutor = (*GetTickDataTool)(nil)
