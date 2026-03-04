# OmniTrade Tool Reference

## Overview

This document provides comprehensive documentation for all available tools in the OmniTrade agent system. Tools are categorized by function and include parameter definitions, examples, and use cases.

## Tool Categories

| Category | Description | Tools |
|----------|-------------|-------|
| **Market Data** | Real-time and historical market data | `get_price`, `get_historical`, `get_depth`, `get_ticks` |
| **Fundamental** | Company fundamentals and financials | `get_financials`, `get_earnings`, `get_ratios` |
| **Sentiment** | News sentiment and social analysis | `analyze_news`, `analyze_social`, `get_sentiment_score` |
| **Technical** | Technical analysis indicators | `calculate_rsi`, `calculate_macd`, `calculate_bollinger` |
| **Risk** | Risk assessment and management | `calculate_var`, `assess_risk`, `check_limits` |
| **Portfolio** | Portfolio management operations | `get_positions`, `calculate_pnl`, `rebalance` |
| **Notification** | Alert and notification tools | `send_alert`, `send_email`, `send_slack` |
| **Analysis** | General analysis tools | `run_analysis`, `generate_report` |

## Market Data Tools

### `market_data.get_price`

Retrieves current market price for a symbol.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Stock symbol (e.g., AAPL, MSFT). Pattern: `^[A-Z]{1,5}$` |
| `exchange` | string | No | Exchange code. Options: NYSE, NASDAQ, AMEX, LSE, TSE |

#### Result Schema

```json
{
  "symbol": "string",
  "price": "number",
  "change": "number",
  "change_pct": "number",
  "volume": "integer",
  "timestamp": "string"
}
```

#### Example Usage

```go
input := &tools.ExecutionInput{
    ToolID: "market_data.get_price",
    Arguments: map[string]interface{}{
        "symbol":   "AAPL",
        "exchange": "NASDAQ",
    },
    Context: &tools.ExecutionContext{
        RequestID:     "req-123",
        UserID:        "user-456",
        CorrelationID: "corr-789",
        Timestamp:     time.Now(),
    },
}

result, err := tools.Execute(ctx, input)
```

#### Response Example

```json
{
  "tool_id": "market_data.get_price",
  "request_id": "req-123",
  "success": true,
  "data": {
    "symbol": "AAPL",
    "price": 150.25,
    "change": 2.50,
    "change_pct": 1.69,
    "volume": 50000000,
    "exchange": "NASDAQ",
    "timestamp": "2026-03-04T12:00:00Z"
  },
  "metadata": {
    "duration": "15ms",
    "cache_hit": false,
    "confidence": 0.95,
    "sources": ["market_data_table"]
  }
}
```

---

### `market_data.get_historical`

Retrieves historical price data for a stock symbol over a date range.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Stock symbol. Pattern: `^[A-Z]{1,5}$` |
| `start_date` | string | Yes | Start date (YYYY-MM-DD). Pattern: `^\d{4}-\d{2}-\d{2}$` |
| `end_date` | string | Yes | End date (YYYY-MM-DD). Pattern: `^\d{4}-\d{2}-\d{2}$` |
| `interval` | string | No | Data interval. Default: `1d`. Options: 1m, 5m, 15m, 1h, 1d, 1w, 1M |

#### Result Schema

```json
{
  "symbol": "string",
  "start_date": "string",
  "end_date": "string",
  "interval": "string",
  "data": [
    {
      "date": "string",
      "open": "number",
      "high": "number",
      "low": "number",
      "close": "number",
      "volume": "integer"
    }
  ]
}
```

#### Example Usage

```go
input := &tools.ExecutionInput{
    ToolID: "market_data.get_historical",
    Arguments: map[string]interface{}{
        "symbol":     "AAPL",
        "start_date": "2026-01-01",
        "end_date":   "2026-03-04",
        "interval":   "1d",
    },
    Context: &tools.ExecutionContext{
        RequestID: "req-123",
        UserID:    "user-456",
        Timestamp: time.Now(),
    },
}

result, err := tools.Execute(ctx, input)
```

---

### `market_data.get_depth`

Retrieves order book depth (bid/ask levels) for a stock symbol.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Stock symbol |
| `levels` | integer | No | Number of price levels to return. Default: 5. Min: 1, Max: 20 |

#### Result Schema

```json
{
  "symbol": "string",
  "bids": [
    {
      "price": "number",
      "size": "integer"
    }
  ],
  "asks": [
    {
      "price": "number",
      "size": "integer"
    }
  ],
  "timestamp": "string"
}
```

---

### `market_data.get_ticks`

Retrieves tick-by-tick trade data for a stock symbol.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Stock symbol |
| `limit` | integer | No | Maximum number of ticks to return. Default: 100. Min: 1, Max: 10000 |

#### Execution Mode

This tool supports **streaming** execution mode for real-time data.

---

## Fundamental Analysis Tools

### `fundamental.get_financials`

Retrieves company financial statements.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Stock symbol |
| `statement_type` | string | No | Type of statement. Options: income, balance, cash_flow, all. Default: all |
| `period` | string | No | Period type. Options: quarterly, annual. Default: quarterly |
| `fiscal_year` | integer | No | Fiscal year. Default: current year |

#### Permission Level

- **Permission Level**: `read`
- **Risk Level**: `low`

---

### `fundamental.get_earnings`

Retrieves earnings data and estimates.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Stock symbol |
| `include_estimates` | boolean | No | Include analyst estimates. Default: true |
| `quarters` | integer | No | Number of quarters. Default: 4. Min: 1, Max: 12 |

---

### `fundamental.get_ratios`

Retrieves financial ratios for a company.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Stock symbol |
| `ratios` | array | No | Specific ratios to retrieve. Default: all |
| `compare_peers` | boolean | No | Compare with industry peers. Default: false |

#### Available Ratios

- `pe_ratio` - Price-to-Earnings
- `pb_ratio` - Price-to-Book
- `ps_ratio` - Price-to-Sales
- `debt_equity` - Debt-to-Equity
- `current_ratio` - Current Ratio
- `quick_ratio` - Quick Ratio
- `roe` - Return on Equity
- `roa` - Return on Assets

---

## Sentiment Analysis Tools

### `sentiment.analyze_news`

Analyzes news sentiment for a symbol.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Stock symbol |
| `sources` | array | No | News sources to include. Default: all |
| `days_back` | integer | No | Days to look back. Default: 7. Min: 1, Max: 30 |
| `include_headlines_only` | boolean | No | Analyze headlines only. Default: true |

#### Permission Level

- **Permission Level**: `analyze`
- **Risk Level**: `low`

---

### `sentiment.analyze_social`

Analyzes social media sentiment.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Stock symbol or cashtag |
| `platforms` | array | No | Platforms to analyze. Options: twitter, reddit, stocktwits. Default: all |
| `hours_back` | integer | No | Hours to look back. Default: 24. Min: 1, Max: 168 |

---

### `sentiment.get_sentiment_score`

Retrieves aggregated sentiment score.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Stock symbol |
| `sources` | array | No | Sources to include. Options: news, social, analyst. Default: all |
| `weighted` | boolean | No | Apply weighted scoring. Default: true |

#### Result Schema

```json
{
  "symbol": "string",
  "overall_score": "number",
  "scores": {
    "news": "number",
    "social": "number",
    "analyst": "number"
  },
  "trend": "string",
  "confidence": "number",
  "timestamp": "string"
}
```

---

## Technical Analysis Tools

### `technical.calculate_rsi`

Calculates Relative Strength Index.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Stock symbol |
| `period` | integer | No | RSI period. Default: 14. Min: 5, Max: 50 |
| `interval` | string | No | Price interval. Default: 1d |

#### Result Schema

```json
{
  "symbol": "string",
  "rsi": "number",
  "signal": "string",
  "overbought": "boolean",
  "oversold": "boolean"
}
```

---

### `technical.calculate_macd`

Calculates Moving Average Convergence Divergence.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Stock symbol |
| `fast_period` | integer | No | Fast EMA period. Default: 12 |
| `slow_period` | integer | No | Slow EMA period. Default: 26 |
| `signal_period` | integer | No | Signal line period. Default: 9 |
| `interval` | string | No | Price interval. Default: 1d |

#### Result Schema

```json
{
  "symbol": "string",
  "macd": "number",
  "signal": "number",
  "histogram": "number",
  "trend": "string",
  "crossover": "string"
}
```

---

### `technical.calculate_bollinger`

Calculates Bollinger Bands.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | Yes | Stock symbol |
| `period` | integer | No | SMA period. Default: 20 |
| `std_dev` | number | No | Standard deviation multiplier. Default: 2.0 |
| `interval` | string | No | Price interval. Default: 1d |

#### Result Schema

```json
{
  "symbol": "string",
  "upper_band": "number",
  "middle_band": "number",
  "lower_band": "number",
  "current_price": "number",
  "bandwidth": "number",
  "percent_b": "number",
  "signal": "string"
}
```

---

## Risk Assessment Tools

### `risk.calculate_var`

Calculates Value at Risk.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `portfolio_id` | string | Yes | Portfolio identifier |
| `confidence_level` | number | No | Confidence level. Default: 0.95. Min: 0.90, Max: 0.99 |
| `time_horizon` | integer | No | Time horizon in days. Default: 1. Min: 1, Max: 10 |
| `method` | string | No | Calculation method. Options: historical, parametric, monte_carlo. Default: historical |

#### Permission Level

- **Permission Level**: `analyze`
- **Risk Level**: `medium`

---

### `risk.assess_risk`

Comprehensive risk assessment.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbol` | string | No | Symbol to assess (optional, uses portfolio if not provided) |
| `portfolio_id` | string | No | Portfolio identifier |
| `include_stress_test` | boolean | No | Include stress testing. Default: true |

#### Permission Level

- **Permission Level**: `analyze`
- **Risk Level**: `medium`

---

### `risk.check_limits`

Checks if an operation violates risk limits.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `operation` | object | Yes | Proposed operation details |
| `portfolio_id` | string | Yes | Portfolio identifier |

#### Permission Level

- **Permission Level**: `trade`
- **Risk Level**: `high`

---

## Portfolio Management Tools

### `portfolio.get_positions`

Retrieves current portfolio positions.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `portfolio_id` | string | Yes | Portfolio identifier |
| `include_pending` | boolean | No | Include pending orders. Default: false |

#### Permission Level

- **Permission Level**: `read`
- **Risk Level**: `low`

---

### `portfolio.calculate_pnl`

Calculates profit and loss.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `portfolio_id` | string | Yes | Portfolio identifier |
| `period` | string | No | P&L period. Options: today, mtd, ytd, all. Default: mtd |
| `include_unrealized` | boolean | No | Include unrealized P&L. Default: true |

---

### `portfolio.rebalance`

Generates rebalancing recommendations.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `portfolio_id` | string | Yes | Portfolio identifier |
| `target_allocation` | object | Yes | Target allocation percentages |
| `drift_threshold` | number | No | Rebalance trigger threshold. Default: 0.05 |

#### Permission Level

- **Permission Level**: `trade`
- **Risk Level**: `high`
- **Human Approval Required**: Yes

---

## Notification Tools

### `notification.send_alert`

Sends an alert.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `severity` | string | Yes | Alert severity. Options: info, warning, critical |
| `message` | string | Yes | Alert message |
| `details` | object | No | Additional details |
| `recipients` | array | No | Recipients. Default: all admins |

#### Permission Level

- **Permission Level**: `analyze`
- **Risk Level**: `low`

---

### `notification.send_email`

Sends an email notification.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `to` | array | Yes | Recipient email addresses |
| `subject` | string | Yes | Email subject |
| `body` | string | Yes | Email body (markdown supported) |
| `priority` | string | No | Email priority. Options: low, normal, high. Default: normal |

---

### `notification.send_slack`

Sends a Slack notification.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `channel` | string | Yes | Slack channel ID |
| `message` | string | Yes | Message text |
| `attachments` | array | No | Slack attachments |
| `blocks` | array | No | Slack blocks |

---

## Creating Custom Tools

### Tool Definition

```go
package mytools

import (
    "context"
    "encoding/json"
    "time"

    "github.com/omnitrade/backend/internal/agent/tools"
)

// MyCustomTool implements a custom tool
type MyCustomTool struct {
    tools.BaseTool
}

// NewMyCustomTool creates a new custom tool
func NewMyCustomTool() *MyCustomTool {
    return &MyCustomTool{}
}

// Definition returns the tool definition
func (t *MyCustomTool) Definition() *tools.ToolDefinition {
    return &tools.ToolDefinition{
        ID:          "my_custom.tool",
        Name:        "My Custom Tool",
        Version:     "1.0.0",
        Description: "A custom tool for specific operations",
        Category:    tools.CategoryAnalysis,
        Parameters: []tools.ParameterDefinition{
            {
                Name:        "symbol",
                Type:        "string",
                Description: "Stock symbol to analyze",
                Required:    true,
                Pattern:     "^[A-Z]{1,5}$",
            },
            {
                Name:        "depth",
                Type:        "integer",
                Description: "Analysis depth",
                Required:    false,
                Default:     3,
                Min:         func() *float64 { v := 1.0; return &v }(),
                Max:         func() *float64 { v := 10.0; return &v }(),
            },
        },
        Result: tools.ResultDefinition{
            Type:        "object",
            Description: "Analysis result",
            Schema: map[string]tools.ParameterDefinition{
                "score": {Type: "number", Description: "Analysis score"},
                "signal": {Type: "string", Description: "Trading signal"},
            },
        },
        ExecutionMode:    tools.ExecutionSync,
        PermissionLevel:  tools.PermissionAnalyze,
        RiskLevel:        tools.RiskMedium,
        Tags:            []string{"custom", "analysis"},
        Timeout:         30 * time.Second,
        RateLimitRequests: 50,
        RateLimitWindow:   time.Minute,
    }
}

// Execute runs the tool
func (t *MyCustomTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
    // Extract parameters
    symbol, _ := input.Arguments["symbol"].(string)
    depth := 3
    if d, ok := input.Arguments["depth"].(int); ok {
        depth = d
    }

    // Perform analysis
    result := map[string]interface{}{
        "symbol": symbol,
        "score":  0.85,
        "signal": "buy",
        "depth":  depth,
    }

    jsonData, _ := json.Marshal(result)

    return &tools.ExecutionResult{
        ToolID:    input.ToolID,
        RequestID: input.Context.RequestID,
        Success:   true,
        Data:      jsonData,
        Metadata: tools.ResultMetadata{
            Duration:   15 * time.Millisecond,
            CacheHit:   false,
            Confidence: 0.85,
            Sources:    []string{"internal_analysis"},
        },
    }, nil
}

// Register the tool
func init() {
    tools.MustRegister(NewMyCustomTool())
}
```

### Using Tool Builders

For simpler tools, use the function tools:

```go
func createSimpleTool() *tools.ToolExecutor {
    def := &tools.ToolDefinition{
        ID:          "simple.tool",
        Name:        "Simple Tool",
        Version:     "1.0.0",
        Description: "A simple tool example",
        Category:    tools.CategoryAnalysis,
        Parameters: []tools.ParameterDefinition{
            {
                Name:        "input",
                Type:        "string",
                Description: "Input string",
                Required:    true,
            },
        },
        Result: tools.ResultDefinition{
            Type:        "string",
            Description: "Output string",
        },
        ExecutionMode:    tools.ExecutionSync,
        PermissionLevel:  tools.PermissionRead,
        RiskLevel:        tools.RiskLow,
    }

    return &SimpleTool{
        BaseTool: *tools.NewBaseTool(def),
    }
}
```

## Permission Reference

### Permission Levels

| Level | Description | Access |
|-------|-------------|--------|
| `read` | Read-only data access | Market data, fundamentals, positions |
| `analyze` | Analysis and computation | Technical indicators, sentiment, risk metrics |
| `trade` | Trade proposal generation | Position management, order submission |
| `admin` | Administrative operations | Configuration, system management |

### Risk Levels

| Level | Description | HITL Required |
|-------|-------------|----------------|
| `low` | Minimal impact | No |
| `medium` | Moderate impact | No (logged) |
| `high` | Significant impact | Yes |
| `critical` | Maximum impact | Yes (always) |

### Role Permissions

| Role | Permissions | Max Risk Level |
|------|-------------|-----------------|
| `guest` | read | low |
| `viewer` | read, analyze | low |
| `analyst` | read, analyze | medium |
| `trader` | read, analyze, trade | high |
| `admin` | read, analyze, trade, admin | critical |
| `system` | read, analyze, trade, admin | high |

## Related Documentation

- [Architecture Overview](./architecture.md)
- [Plugin Development Guide](./plugin-development-guide.md)
- [Hooks Reference](./hooks-reference.md)
