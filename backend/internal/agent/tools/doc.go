// Package tools provides a plugin architecture for AI agent tools in the OmniTrade platform.
//
// The tools package implements a layered architecture for tool registration, execution, and permission management
// with proper LiteLLM integration. It is designed to support the Three-Plane Architecture of OmniTrade:
// Data Plane (Read-Only), Intelligence Plane, and Action Plane (HITL).
//
// # Architecture Overview
//
// The package is organized into several components:
//
//   - definition.go: Core tool definition types and interfaces
//   - registry.go: Central registry for tool registration and discovery
//   - executor.go: Tool execution with batch and streaming support
//   - permissions.go: Role-based access control and permission management
//   - categories/: Tool implementations organized by functional category
//
// # Tool Categories
//
// Tools are organized into the following categories:
//
//   - market_data: Real-time and historical market data tools
//   - fundamental: Company fundamentals and financial data tools
//   - sentiment: News sentiment and social analysis tools
//   - technical: Technical analysis and indicator tools
//   - risk: Risk assessment and management tools
//   - portfolio: Portfolio management and trade proposal tools
//   - notification: Alert and notification tools
//
// # Usage
//
// Basic tool registration:
//
//	// Register a tool with the global registry
//	tools.Register(&MyTool{})
//
//	// Or use MustRegister to panic on error
//	tools.MustRegister(&MyTool{})
//
// Tool execution:
//
//	// Create execution input
//	input := &tools.ExecutionInput{
//	    ToolID: "market_data.get_price",
//	    Arguments: map[string]interface{}{
//	        "symbol": "AAPL",
//	    },
//	    Context: &tools.ExecutionContext{
//	        RequestID: "req-123",
//	        UserID:    "user-456",
//	    },
//	}
//
//	// Execute the tool
//	result, err := tools.Execute(ctx, input)
//
// # Creating Custom Tools
//
// To create a custom tool, implement the ToolExecutor interface:
//
//	type MyTool struct {
//	    tools.BaseTool
//	}
//
//	func (t *MyTool) Definition() *tools.ToolDefinition {
//	    return &tools.ToolDefinition{
//	        ID:          "my_category.my_tool",
//	        Name:        "My Tool",
//	        Version:     "1.0.0",
//	        Description: "Description of what the tool does",
//	        Category:    tools.CategoryAnalysis,
//	        // ... other fields
//	    }
//	}
//
//	func (t *MyTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
//	    // Implementation
//	    return &tools.ExecutionResult{
//	        ToolID:  input.ToolID,
//	        Success: true,
//	        Data:    jsonData,
//	    }, nil
//	}
//
// # Permission Model
//
// The permission system uses role-based access control (RBAC) with the following roles:
//
//   - guest: Read-only access to basic market data
//   - viewer: Read access to most categories
//   - analyst: Analysis and medium-risk operations
//   - trader: Can generate trade proposals
//   - admin: Full access
//   - system: Automated system operations
//
// Permission levels:
//
//   - read: Read-only data access
//   - analyze: Analysis and computation
//   - trade: Trade proposal generation
//   - admin: Administrative operations
//
// # Risk Levels
//
// Tools are classified by risk level:
//
//   - low: Minimal impact, safe for autonomous execution
//   - medium: Moderate impact, may require review
//   - high: Significant impact, requires HITL approval
//   - critical: Maximum impact, always requires human approval
//
// # LiteLLM Integration
//
// Tools are executed through the registry and can be orchestrated via the LiteLLM Gateway
// for AI-powered analysis and decision making.
//
// # Best Practices
//
//   - Always validate input parameters in Execute()
//   - Use appropriate risk levels for tools
//   - Set reasonable timeouts for external API calls
//   - Include confidence scores in result metadata
//   - Document all parameters and expected outputs
//   - Use dependency declarations for tools that call other tools
//
// # Security Considerations
//
//   - AI agents never write directly to the database
//   - All trade operations require human-in-the-loop approval
//   - Tools validate all external input
//   - Rate limiting is enforced per tool/user
//   - Audit logging is available for compliance
package tools
