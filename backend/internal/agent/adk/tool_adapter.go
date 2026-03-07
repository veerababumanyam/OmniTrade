// Copyright 2026 OmniTrade Authors
// SPDX-License-Identifier: Apache-2.0

package adk

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"
)

// OmniTradeTool wraps an OmniTrade ToolDefinition to implement ADK's tool.Tool interface.
type OmniTradeTool struct {
	definition ToolDefinition
}

// ToolDefinition represents an OmniTrade tool definition.
type ToolDefinition struct {
	Name        string
	Description string
	InputSchema map[string]interface{}
	Handler     func(ctx context.Context, input interface{}) (interface{}, error)
	Timeout     time.Duration
	Category    string
}

// NewOmniTradeTool creates a new OmniTradeTool wrapper.
func NewOmniTradeTool(def ToolDefinition) *OmniTradeTool {
	return &OmniTradeTool{definition: def}
}

// WrapTool converts a single OmniTrade ToolDefinition to an ADK tool.
func WrapTool(def ToolDefinition) *OmniTradeTool {
	return NewOmniTradeTool(def)
}

// WrapTools converts multiple OmniTrade ToolDefinitions to ADK tools.
func WrapTools(definitions []ToolDefinition) []*OmniTradeTool {
	tools := make([]*OmniTradeTool, 0, len(definitions))
	for _, def := range definitions {
		tools = append(tools, WrapTool(def))
	}
	return tools
}

// Name returns the tool name.
func (t *OmniTradeTool) Name() string {
	return t.definition.Name
}

// GetDescription returns the tool description.
func (t *OmniTradeTool) GetDescription() string {
	return t.definition.Description
}

// Execute runs the tool with the given input.
func (t *OmniTradeTool) Execute(ctx context.Context, input interface{}) (interface{}, error) {
	// Apply timeout if specified
	if t.definition.Timeout > 0 {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, t.definition.Timeout)
		defer cancel()
	}

	// Execute the handler
	result, err := t.definition.Handler(ctx, input)
	if err != nil {
		log.Printf("Tool %s execution failed: %v", t.definition.Name, err)
		return nil, fmt.Errorf("tool execution failed: %w", err)
	}

	return result, nil
}

// MarshalJSON implements json.Marshaler for logging.
func (t *OmniTradeTool) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]interface{}{
		"name":        t.definition.Name,
		"description": t.definition.Description,
		"category":    t.definition.Category,
	})
}

// String returns a string representation.
func (t *OmniTradeTool) String() string {
	return fmt.Sprintf("OmniTradeTool{name=%s, category=%s}", t.definition.Name, t.definition.Category)
}

// ============================================================
// PREDEFINED TRADING TOOLS
// ============================================================

var (
	// FetchPriceTool fetches current market price for a symbol.
	FetchPriceTool = ToolDefinition{
		Name:        "fetch_price",
		Description: "Fetch the current market price for a given trading symbol",
		Category:    "data.market",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"symbol": map[string]interface{}{
					"type":        "string",
					"description": "The trading symbol (e.g., 'AAPL', 'GOOGL')",
				},
			},
			"required": []interface{}{"symbol"},
		},
		Timeout: 10 * time.Second,
	}

	// FetchVolumeTool fetches trading volume for a symbol.
	FetchVolumeTool = ToolDefinition{
		Name:        "fetch_volume",
		Description: "Fetch the trading volume for a given trading symbol",
		Category:    "data.market",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"symbol": map[string]interface{}{
					"type":        "string",
					"description": "The trading symbol (e.g., 'AAPL', 'GOOGL')",
				},
			},
			"required": []interface{}{"symbol"},
		},
		Timeout: 10 * time.Second,
	}

	// RAGSearchTool searches the vector database.
	RAGSearchTool = ToolDefinition{
		Name:        "rag_search",
		Description: "Search the vector database for relevant historical context and analysis",
		Category:    "analysis.rag",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"query": map[string]interface{}{
					"type":        "string",
					"description": "The search query",
				},
			},
			"required": []interface{}{"query"},
		},
		Timeout: 30 * time.Second,
	}

	// CalculateRiskMetricsTool calculates risk metrics.
	CalculateRiskMetricsTool = ToolDefinition{
		Name:        "calculate_risk_metrics",
		Description: "Calculate risk metrics including VaR, Sharpe ratio, and position sizing",
		Category:    "analysis.risk",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"symbol": map[string]interface{}{
					"type":        "string",
					"description": "The trading symbol",
				},
			},
			"required": []interface{}{"symbol"},
		},
		Timeout: 15 * time.Second,
	}

	// ProposeTradeTool creates a trade proposal.
	ProposeTradeTool = ToolDefinition{
		Name:        "propose_trade",
		Description: "Create a trade proposal for human-in-the-loop review",
		Category:    "action.trade",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"symbol": map[string]interface{}{
					"type":        "string",
					"description": "The trading symbol",
				},
				"action": map[string]interface{}{
					"type":        "string",
					"description": "Trade action",
				},
			},
			"required": []interface{}{"symbol", "action"},
		},
		Timeout: 5 * time.Second,
	}

	// GmailSendTool sends an email alert.
	GmailSendTool = ToolDefinition{
		Name:        "workspace.gmail_send",
		Description: "Sends an email via Gmail. Use for trade proposal notifications or alerts.",
		Category:    "action.notification",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"to": map[string]interface{}{
					"type":        "string",
					"description": "Recipient email address",
				},
				"subject": map[string]interface{}{
					"type":        "string",
					"description": "Email subject",
				},
				"body": map[string]interface{}{
					"type":        "string",
					"description": "Email body content",
				},
			},
			"required": []interface{}{"to", "subject", "body"},
		},
		Timeout: 20 * time.Second,
	}
)

// DefaultTradingTools returns the default set of trading tools.
func DefaultTradingTools() []ToolDefinition {
	return []ToolDefinition{
		FetchPriceTool,
		FetchVolumeTool,
		RAGSearchTool,
		CalculateRiskMetricsTool,
		ProposeTradeTool,
		GmailSendTool,
	}
}
