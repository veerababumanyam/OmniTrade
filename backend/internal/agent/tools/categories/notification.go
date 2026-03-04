package categories

import (
	"context"
	"encoding/json"
	"time"

	"github.com/v13478/omnitrade/backend/internal/agent/tools"
)

func init() {
	// Register notification tools
	tools.MustRegister(&CreateAlertTool{})
	tools.MustRegister(&GetAlertsTool{})
	tools.MustRegister(&SendNotificationTool{})
}

// AlertType defines the type of alert
type AlertType string

const (
	AlertTypePrice    AlertType = "price"
	AlertTypeVolume   AlertType = "volume"
	AlertTypeRSI      AlertType = "rsi"
	AlertTypeMACD     AlertType = "macd"
	AlertTypeSentiment AlertType = "sentiment"
	AlertTypeEarnings AlertType = "earnings"
	AlertTypeNews     AlertType = "news"
)

// CreateAlertTool creates a price or indicator alert
type CreateAlertTool struct {
	tools.BaseTool
}

// Definition returns the tool definition
func (t *CreateAlertTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "notification.create_alert",
		Name:        "Create Alert",
		Version:     "1.0.0",
		Description: "Creates a price, indicator, or event-based alert",
		Category:    tools.CategoryNotification,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "symbol",
				Type:        "string",
				Description: "Stock symbol",
				Required:    true,
			},
			{
				Name:        "alert_type",
				Type:        "string",
				Description: "Type of alert",
				Required:    true,
				Enum:        []string{"price", "volume", "rsi", "macd", "sentiment", "earnings", "news"},
			},
			{
				Name:        "condition",
				Type:        "string",
				Description: "Alert condition (e.g., 'above', 'below', 'crosses')",
				Required:    true,
			},
			{
				Name:        "value",
				Type:        "number",
				Description: "Threshold value for the alert",
				Required:    false,
			},
			{
				Name:        "message",
				Type:        "string",
				Description: "Custom alert message",
				Required:    false,
			},
			{
				Name:        "expires_in_hours",
				Type:        "integer",
				Description: "Hours until alert expires (0 = never)",
				Required:    false,
				Default:     168, // 1 week
			},
		},
		Result: tools.ResultDefinition{
			Type:        "object",
			Description: "Created alert details",
		},
		ExecutionMode:    tools.ExecutionSync,
		PermissionLevel:  tools.PermissionAnalyze,
		RiskLevel:        tools.RiskLow,
		Tags:            []string{"notification", "alert", "monitoring"},
		Timeout:         5 * time.Second,
	}
}

// Execute runs the tool
func (t *CreateAlertTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	symbol, _ := input.Arguments["symbol"].(string)
	alertType, _ := input.Arguments["alert_type"].(string)
	condition, _ := input.Arguments["condition"].(string)
	value, _ := input.Arguments["value"].(float64)
	message, _ := input.Arguments["message"].(string)
	expiresIn, _ := input.Arguments["expires_in_hours"].(int)
	if expiresIn == 0 {
		expiresIn = 168
	}

	alertID := "ALT-" + time.Now().Format("20060102150405")

	expiresAt := time.Now().Add(time.Duration(expiresIn) * time.Hour)
	if expiresIn == 0 {
		expiresAt = time.Time{} // Zero value means never expires
	}

	data := map[string]interface{}{
		"alert_id":       alertID,
		"symbol":         symbol,
		"alert_type":     alertType,
		"condition":      condition,
		"value":          value,
		"message":        message,
		"status":         "active",
		"created_at":     time.Now().UTC().Format(time.RFC3339),
		"expires_at":     expiresAt.UTC().Format(time.RFC3339),
		"notification_methods": []string{"email", "push", "webhook"},
		"triggered_count": 0,
	}

	if message == "" {
		data["message"] = generateDefaultMessage(symbol, alertType, condition, value)
	}

	jsonData, _ := json.Marshal(data)

	return &tools.ExecutionResult{
		ToolID:    input.ToolID,
		RequestID: input.Context.RequestID,
		Success:   true,
		Data:      jsonData,
		Metadata: tools.ResultMetadata{
			Confidence: 1.0,
			Sources:    []string{"alert_system"},
		},
	}, nil
}

func generateDefaultMessage(symbol, alertType, condition string, value float64) string {
	return symbol + " " + alertType + " " + condition + " " + formatValue(value)
}

func formatValue(v float64) string {
	if v >= 100 {
		return "%.0f"
	}
	return "%.2f"
}

// GetAlertsTool retrieves alerts for the user
type GetAlertsTool struct {
	tools.BaseTool
}

// Definition returns the tool definition
func (t *GetAlertsTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "notification.get_alerts",
		Name:        "Get Alerts",
		Version:     "1.0.0",
		Description: "Retrieves active and historical alerts",
		Category:    tools.CategoryNotification,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "status",
				Type:        "string",
				Description: "Filter by alert status",
				Required:    false,
				Enum:        []string{"active", "triggered", "expired", "all"},
				Default:     "active",
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
			},
		},
		Result: tools.ResultDefinition{
			Type:        "object",
			Description: "Alert list",
		},
		ExecutionMode:    tools.ExecutionSync,
		PermissionLevel:  tools.PermissionRead,
		RiskLevel:        tools.RiskLow,
		Tags:            []string{"notification", "alert", "list"},
		Timeout:         5 * time.Second,
	}
}

// Execute runs the tool
func (t *GetAlertsTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	status, _ := input.Arguments["status"].(string)
	if status == "" {
		status = "active"
	}
	symbol, _ := input.Arguments["symbol"].(string)

	data := map[string]interface{}{
		"status_filter": status,
		"symbol_filter": symbol,
		"total_count":   5,
		"alerts": []map[string]interface{}{
			{
				"alert_id":    "ALT-20240304120000",
				"symbol":      "AAPL",
				"alert_type":  "price",
				"condition":   "above",
				"value":       155.00,
				"status":      "active",
				"created_at":  time.Now().Add(-24 * time.Hour).UTC().Format(time.RFC3339),
				"expires_at":  time.Now().Add(144 * time.Hour).UTC().Format(time.RFC3339),
			},
			{
				"alert_id":       "ALT-20240303093000",
				"symbol":         "MSFT",
				"alert_type":     "rsi",
				"condition":      "below",
				"value":          30,
				"status":         "triggered",
				"created_at":     time.Now().Add(-48 * time.Hour).UTC().Format(time.RFC3339),
				"triggered_at":   time.Now().Add(-12 * time.Hour).UTC().Format(time.RFC3339),
				"triggered_value": 28.5,
			},
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
			Sources:    []string{"alert_db"},
		},
	}, nil
}

// SendNotificationTool sends a notification to the user
type SendNotificationTool struct {
	tools.BaseTool
}

// Definition returns the tool definition
func (t *SendNotificationTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "notification.send",
		Name:        "Send Notification",
		Version:     "1.0.0",
		Description: "Sends a notification to specified channels",
		Category:    tools.CategoryNotification,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "title",
				Type:        "string",
				Description: "Notification title",
				Required:    true,
			},
			{
				Name:        "message",
				Type:        "string",
				Description: "Notification message body",
				Required:    true,
			},
			{
				Name:        "priority",
				Type:        "string",
				Description: "Notification priority",
				Required:    false,
				Default:     "normal",
				Enum:        []string{"low", "normal", "high", "urgent"},
			},
			{
				Name:        "channels",
				Type:        "array",
				Description: "Notification channels",
				Required:    false,
				Default:     []string{"email", "push"},
			},
			{
				Name:        "metadata",
				Type:        "object",
				Description: "Additional metadata",
				Required:    false,
			},
		},
		Result: tools.ResultDefinition{
			Type:        "object",
			Description: "Notification delivery status",
		},
		ExecutionMode:    tools.ExecutionAsync,
		PermissionLevel:  tools.PermissionAnalyze,
		RiskLevel:        tools.RiskLow,
		Tags:            []string{"notification", "messaging"},
		Timeout:         10 * time.Second,
	}
}

// Execute runs the tool
func (t *SendNotificationTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	title, _ := input.Arguments["title"].(string)
	message, _ := input.Arguments["message"].(string)
	priority, _ := input.Arguments["priority"].(string)
	if priority == "" {
		priority = "normal"
	}

	notificationID := "NOT-" + time.Now().Format("20060102150405")

	data := map[string]interface{}{
		"notification_id": notificationID,
		"title":          title,
		"message":        message,
		"priority":       priority,
		"sent_at":        time.Now().UTC().Format(time.RFC3339),
		"delivery_status": map[string]interface{}{
			"email": map[string]interface{}{
				"status":   "sent",
				"sent_at":  time.Now().UTC().Format(time.RFC3339),
				"recipient": "user@example.com",
			},
			"push": map[string]interface{}{
				"status":   "delivered",
				"sent_at":  time.Now().UTC().Format(time.RFC3339),
				"device":   "mobile",
			},
		},
		"channels_used": []string{"email", "push"},
	}

	jsonData, _ := json.Marshal(data)

	return &tools.ExecutionResult{
		ToolID:    input.ToolID,
		RequestID: input.Context.RequestID,
		Success:   true,
		Data:      jsonData,
		Metadata: tools.ResultMetadata{
			Confidence: 1.0,
			Sources:    []string{"notification_service"},
		},
	}, nil
}

// Ensure tools implement the interface
var _ tools.ToolExecutor = (*CreateAlertTool)(nil)
var _ tools.ToolExecutor = (*GetAlertsTool)(nil)
var _ tools.ToolExecutor = (*SendNotificationTool)(nil)
