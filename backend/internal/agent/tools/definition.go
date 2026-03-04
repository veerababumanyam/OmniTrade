// Package tools provides a plugin architecture for AI agent tools in the OmniTrade platform.
// This package implements a layered architecture for tool registration, execution, and permission management
// with proper Google Genkit/ADK wrapping.
package tools

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
)

// Category represents the functional category of a tool
type Category string

const (
	CategoryMarketData   Category = "market_data"    // Real-time and historical market data
	CategoryFundamental  Category = "fundamental"    // Company fundamentals and financials
	CategorySentiment    Category = "sentiment"      // News sentiment and social analysis
	CategoryTechnical    Category = "technical"      // Technical analysis indicators
	CategoryRisk         Category = "risk"           // Risk assessment and management
	CategoryPortfolio    Category = "portfolio"      // Portfolio management operations
	CategoryNotification Category = "notification"   // Alert and notification tools
	CategoryAnalysis     Category = "analysis"       // General analysis tools
)

// PermissionLevel defines the required permission level to execute a tool
type PermissionLevel string

const (
	PermissionRead      PermissionLevel = "read"       // Read-only data access
	PermissionAnalyze   PermissionLevel = "analyze"    // Analysis and computation
	PermissionTrade     PermissionLevel = "trade"      // Trade proposal generation
	PermissionAdmin     PermissionLevel = "admin"      // Administrative operations
)

// RiskLevel indicates the potential impact of a tool's operation
type RiskLevel string

const (
	RiskLow      RiskLevel = "low"      // Minimal impact, safe for autonomous execution
	RiskMedium   RiskLevel = "medium"   // Moderate impact, may require review
	RiskHigh     RiskLevel = "high"     // Significant impact, requires HITL approval
	RiskCritical RiskLevel = "critical" // Maximum impact, always requires human approval
)

// ParameterDefinition describes a single parameter for a tool
type ParameterDefinition struct {
	Name        string      `json:"name"`
	Type        string      `json:"type"`         // "string", "number", "boolean", "array", "object"
	Description string      `json:"description"`
	Required    bool        `json:"required"`
	Default     interface{} `json:"default,omitempty"`
	Enum        []string    `json:"enum,omitempty"`      // Valid values for string types
	Min         *float64    `json:"min,omitempty"`       // Minimum for number types
	Max         *float64    `json:"max,omitempty"`       // Maximum for number types
	Pattern     string      `json:"pattern,omitempty"`   // Regex pattern for string validation
}

// ResultDefinition describes the expected output of a tool
type ResultDefinition struct {
	Type        string                        `json:"type"`        // "object", "array", "string", "number"
	Description string                        `json:"description"`
	Schema      map[string]ParameterDefinition `json:"schema,omitempty"` // For object types
}

// ExecutionMode defines how the tool should be executed
type ExecutionMode string

const (
	ExecutionSync      ExecutionMode = "sync"       // Synchronous execution
	ExecutionAsync     ExecutionMode = "async"      // Asynchronous execution
	ExecutionStreaming ExecutionMode = "streaming"  // Streaming response
)

// ToolDefinition is the complete definition of an agent tool
type ToolDefinition struct {
	// Identity
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Version     string   `json:"version"`
	Description string   `json:"description"`
	Category    Category `json:"category"`

	// Configuration
	Parameters  []ParameterDefinition `json:"parameters"`
	Result      ResultDefinition      `json:"result"`
	ExecutionMode ExecutionMode        `json:"execution_mode"`

	// Permissions and Risk
	PermissionLevel PermissionLevel `json:"permission_level"`
	RiskLevel       RiskLevel       `json:"risk_level"`

	// Metadata
	Tags        []string `json:"tags,omitempty"`
	Author      string   `json:"author,omitempty"`
	Deprecated  bool     `json:"deprecated,omitempty"`
	Replacement string   `json:"replacement,omitempty"` // Tool ID to use if deprecated

	// Rate Limiting
	RateLimitRequests int           `json:"rate_limit_requests,omitempty"` // Requests per window
	RateLimitWindow   time.Duration `json:"rate_limit_window,omitempty"`

	// Timeout
	Timeout time.Duration `json:"timeout,omitempty"`

	// Dependencies
	Dependencies []string `json:"dependencies,omitempty"` // Other tools this depends on
}

// Validate checks if the tool definition is valid
func (td *ToolDefinition) Validate() error {
	if td.ID == "" {
		return fmt.Errorf("tool ID is required")
	}
	if td.Name == "" {
		return fmt.Errorf("tool name is required")
	}
	if td.Version == "" {
		return fmt.Errorf("tool version is required")
	}
	if td.Description == "" {
		return fmt.Errorf("tool description is required")
	}

	// Validate parameters
	paramNames := make(map[string]bool)
	for _, param := range td.Parameters {
		if param.Name == "" {
			return fmt.Errorf("parameter name is required")
		}
		if paramNames[param.Name] {
			return fmt.Errorf("duplicate parameter name: %s", param.Name)
		}
		paramNames[param.Name] = true

		if err := validateParameterType(param.Type); err != nil {
			return fmt.Errorf("parameter %s: %w", param.Name, err)
		}
	}

	// Validate result type
	if err := validateResultType(td.Result.Type); err != nil {
		return fmt.Errorf("result: %w", err)
	}

	return nil
}

func validateParameterType(t string) error {
	validTypes := map[string]bool{
		"string":  true,
		"number":  true,
		"integer": true,
		"boolean": true,
		"array":   true,
		"object":  true,
	}
	if !validTypes[t] {
		return fmt.Errorf("invalid parameter type: %s", t)
	}
	return nil
}

func validateResultType(t string) error {
	validTypes := map[string]bool{
		"object":  true,
		"array":   true,
		"string":  true,
		"number":  true,
		"integer": true,
		"boolean": true,
		"null":    true,
	}
	if !validTypes[t] {
		return fmt.Errorf("invalid result type: %s", t)
	}
	return nil
}

// ToJSONSchema converts the tool definition to JSON Schema format for ADK compatibility
func (td *ToolDefinition) ToJSONSchema() map[string]interface{} {
	properties := make(map[string]interface{})
	required := []string{}

	for _, param := range td.Parameters {
		prop := map[string]interface{}{
			"type":        param.Type,
			"description": param.Description,
		}

		if param.Default != nil {
			prop["default"] = param.Default
		}
		if len(param.Enum) > 0 {
			prop["enum"] = param.Enum
		}
		if param.Min != nil {
			prop["minimum"] = *param.Min
		}
		if param.Max != nil {
			prop["maximum"] = *param.Max
		}
		if param.Pattern != "" {
			prop["pattern"] = param.Pattern
		}

		properties[param.Name] = prop

		if param.Required {
			required = append(required, param.Name)
		}
	}

	schema := map[string]interface{}{
		"type":       "object",
		"properties": properties,
	}

	if len(required) > 0 {
		schema["required"] = required
	}

	return schema
}

// ExecutionInput represents the input to a tool execution
type ExecutionInput struct {
	ToolID    string                 `json:"tool_id"`
	Arguments map[string]interface{} `json:"arguments"`
	Context   *ExecutionContext      `json:"context,omitempty"`
}

// ExecutionContext provides contextual information for tool execution
type ExecutionContext struct {
	RequestID    string            `json:"request_id"`
	UserID       string            `json:"user_id"`
	SessionID    string            `json:"session_id"`
	CorrelationID string           `json:"correlation_id"`
	Timestamp    time.Time         `json:"timestamp"`
	Metadata     map[string]string `json:"metadata,omitempty"`
}

// ExecutionResult represents the output of a tool execution
type ExecutionResult struct {
	ToolID    string          `json:"tool_id"`
	RequestID string          `json:"request_id"`
	Success   bool            `json:"success"`
	Data      json.RawMessage `json:"data,omitempty"`
	Error     *ExecutionError `json:"error,omitempty"`
	Metadata  ResultMetadata  `json:"metadata"`
}

// ExecutionError represents an error during tool execution
type ExecutionError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Type    string `json:"type"` // "validation", "permission", "execution", "timeout", "rate_limit"
	Details string `json:"details,omitempty"`
}

// ResultMetadata contains metadata about the execution result
type ResultMetadata struct {
	Duration       time.Duration `json:"duration"`
	CacheHit       bool          `json:"cache_hit"`
	DataStaleness  time.Duration `json:"data_staleness,omitempty"`
	Confidence     float64       `json:"confidence,omitempty"` // AI confidence in result
	Sources        []string      `json:"sources,omitempty"`    // Data sources used
	Warnings       []string      `json:"warnings,omitempty"`
	HumanApproval  bool          `json:"human_approval_required,omitempty"`
}

// ToolExecutor is the interface that all tools must implement
type ToolExecutor interface {
	// Definition returns the tool's definition
	Definition() *ToolDefinition

	// ValidateInput validates the input arguments
	ValidateInput(ctx context.Context, input *ExecutionInput) error

	// Execute runs the tool with the given input
	Execute(ctx context.Context, input *ExecutionInput) (*ExecutionResult, error)

	// CheckPermission verifies if the execution is permitted
	CheckPermission(ctx context.Context, input *ExecutionInput) error
}

// BaseTool provides a base implementation for tools
type BaseTool struct {
	definition *ToolDefinition
}

// NewBaseTool creates a new base tool with the given definition
func NewBaseTool(def *ToolDefinition) *BaseTool {
	return &BaseTool{definition: def}
}

// Definition returns the tool's definition
func (bt *BaseTool) Definition() *ToolDefinition {
	return bt.definition
}

// ValidateInput provides default input validation
func (bt *BaseTool) ValidateInput(ctx context.Context, input *ExecutionInput) error {
	if input.ToolID != bt.definition.ID {
		return fmt.Errorf("tool ID mismatch: expected %s, got %s", bt.definition.ID, input.ToolID)
	}

	// Check required parameters
	for _, param := range bt.definition.Parameters {
		if param.Required {
			val, exists := input.Arguments[param.Name]
			if !exists || val == nil {
				return fmt.Errorf("required parameter missing: %s", param.Name)
			}
		}
	}

	return nil
}

// CheckPermission provides default permission checking
func (bt *BaseTool) CheckPermission(ctx context.Context, input *ExecutionInput) error {
	// Default implementation - no restrictions
	// Override in specific tools for custom permission logic
	return nil
}

// Execute must be implemented by the concrete tool
func (bt *BaseTool) Execute(ctx context.Context, input *ExecutionInput) (*ExecutionResult, error) {
	return nil, fmt.Errorf("execute not implemented for base tool")
}
