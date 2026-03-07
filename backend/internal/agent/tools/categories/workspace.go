package categories

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
	"time"

	"github.com/v13478/omnitrade/backend/internal/agent/tools"
)

func init() {
	// Register Google Workspace tools
	tools.MustRegister(&GmailListTool{})
	tools.MustRegister(&GmailSendTool{})
	tools.MustRegister(&CalendarEventsTool{})
	tools.MustRegister(&DriveSearchTool{})
}

// executeGWCLI runs the gwcli command with the given arguments and returns the JSON output
func executeGWCLI(ctx context.Context, args ...string) ([]byte, error) {
	// Always append --format json for structured output
	fullArgs := append(args, "--format", "json")
	
	cmd := exec.CommandContext(ctx, "gwcli", fullArgs...)
	
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("gwcli execution failed: %w (stderr: %s)", err, stderr.String())
	}

	return stdout.Bytes(), nil
}

// GmailListTool lists recent emails
type GmailListTool struct {
	tools.BaseTool
}

func (t *GmailListTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "workspace.gmail_list",
		Name:        "List Gmail Messages",
		Version:     "1.0.0",
		Description: "Lists recent emails from Gmail. Use for checking notifications or replies.",
		Category:    tools.CategoryNotification,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "limit",
				Type:        "integer",
				Description: "Maximum number of messages to retrieve",
				Required:    false,
				Default:     10,
			},
			{
				Name:        "unread",
				Type:        "boolean",
				Description: "Only list unread messages",
				Required:    false,
				Default:     false,
			},
		},
		Result: tools.ResultDefinition{
			Type:        "array",
			Description: "List of email messages",
		},
		ExecutionMode:   tools.ExecutionSync,
		PermissionLevel: tools.PermissionRead,
		RiskLevel:       tools.RiskLow,
		Tags:            []string{"gmail", "workspace", "email"},
		Timeout:         15 * time.Second,
	}
}

func (t *GmailListTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	limit, _ := input.Arguments["limit"].(float64)
	unread, _ := input.Arguments["unread"].(bool)

	args := []string{"gmail", "list"}
	if limit > 0 {
		args = append(args, "--limit", fmt.Sprintf("%.0f", limit))
	}
	if unread {
		args = append(args, "--unread")
	}

	output, err := executeGWCLI(ctx, args...)
	if err != nil {
		return nil, err
	}

	return &tools.ExecutionResult{
		ToolID:    input.ToolID,
		RequestID: input.Context.RequestID,
		Success:   true,
		Data:      output,
		Metadata: tools.ResultMetadata{
			Confidence: 1.0,
			Sources:    []string{"google_workspace_api"},
		},
	}, nil
}

// GmailSendTool sends an email
type GmailSendTool struct {
	tools.BaseTool
}

func (t *GmailSendTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "workspace.gmail_send",
		Name:        "Send Gmail Message",
		Version:     "1.0.0",
		Description: "Sends an email via Gmail. Use for trade proposal notifications or alerts.",
		Category:    tools.CategoryNotification,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "to",
				Type:        "string",
				Description: "Recipient email address",
				Required:    true,
			},
			{
				Name:        "subject",
				Type:        "string",
				Description: "Email subject",
				Required:    true,
			},
			{
				Name:        "body",
				Type:        "string",
				Description: "Email body content",
				Required:    true,
			},
		},
		Result: tools.ResultDefinition{
			Type:        "object",
			Description: "Sent message details",
		},
		ExecutionMode:   tools.ExecutionSync,
		PermissionLevel: tools.PermissionTrade,
		RiskLevel:       tools.RiskMedium,
		Tags:            []string{"gmail", "workspace", "email", "send"},
		Timeout:         20 * time.Second,
	}
}

func (t *GmailSendTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	to, _ := input.Arguments["to"].(string)
	subject, _ := input.Arguments["subject"].(string)
	body, _ := input.Arguments["body"].(string)

	args := []string{"gmail", "send", "--to", to, "--subject", subject, "--body", body}

	output, err := executeGWCLI(ctx, args...)
	if err != nil {
		return nil, err
	}

	return &tools.ExecutionResult{
		ToolID:    input.ToolID,
		RequestID: input.Context.RequestID,
		Success:   true,
		Data:      output,
		Metadata: tools.ResultMetadata{
			Confidence: 1.0,
			Sources:    []string{"google_workspace_api"},
		},
	}, nil
}

// CalendarEventsTool lists upcoming calendar events
type CalendarEventsTool struct {
	tools.BaseTool
}

func (t *CalendarEventsTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "workspace.calendar_events",
		Name:        "List Calendar Events",
		Version:     "1.0.0",
		Description: "Lists upcoming calendar events. Use for identifying schedule conflicts.",
		Category:    tools.CategoryAnalysis,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "days",
				Type:        "integer",
				Description: "Number of days to look ahead",
				Required:    false,
				Default:     7,
			},
		},
		Result: tools.ResultDefinition{
			Type:        "array",
			Description: "List of calendar events",
		},
		ExecutionMode:   tools.ExecutionSync,
		PermissionLevel: tools.PermissionRead,
		RiskLevel:       tools.RiskLow,
		Tags:            []string{"calendar", "workspace", "schedule"},
		Timeout:         15 * time.Second,
	}
}

func (t *CalendarEventsTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	days, _ := input.Arguments["days"].(float64)
	if days == 0 {
		days = 7
	}

	args := []string{"calendar", "events", "--days", fmt.Sprintf("%.0f", days)}

	output, err := executeGWCLI(ctx, args...)
	if err != nil {
		return nil, err
	}

	return &tools.ExecutionResult{
		ToolID:    input.ToolID,
		RequestID: input.Context.RequestID,
		Success:   true,
		Data:      output,
		Metadata: tools.ResultMetadata{
			Confidence: 1.0,
			Sources:    []string{"google_workspace_api"},
		},
	}, nil
}

// DriveSearchTool searches for files in Google Drive
type DriveSearchTool struct {
	tools.BaseTool
}

func (t *DriveSearchTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "workspace.drive_search",
		Name:        "Search Google Drive",
		Version:     "1.0.0",
		Description: "Searches for files and documents in Google Drive. Use for retrieving research reports or data files.",
		Category:    tools.CategoryAnalysis,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "query",
				Type:        "string",
				Description: "Search query (e.g., 'name contains \"report\"')",
				Required:    true,
			},
		},
		Result: tools.ResultDefinition{
			Type:        "array",
			Description: "List of found files",
		},
		ExecutionMode:   tools.ExecutionSync,
		PermissionLevel: tools.PermissionRead,
		RiskLevel:       tools.RiskLow,
		Tags:            []string{"drive", "workspace", "files", "research"},
		Timeout:         20 * time.Second,
	}
}

func (t *DriveSearchTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	query, _ := input.Arguments["query"].(string)

	args := []string{"drive", "search", query}

	output, err := executeGWCLI(ctx, args...)
	if err != nil {
		return nil, err
	}

	return &tools.ExecutionResult{
		ToolID:    input.ToolID,
		RequestID: input.Context.RequestID,
		Success:   true,
		Data:      output,
		Metadata: tools.ResultMetadata{
			Confidence: 1.0,
			Sources:    []string{"google_workspace_api"},
		},
	}, nil
}

// Ensure tools implement the interface
var _ tools.ToolExecutor = (*GmailListTool)(nil)
var _ tools.ToolExecutor = (*GmailSendTool)(nil)
var _ tools.ToolExecutor = (*CalendarEventsTool)(nil)
var _ tools.ToolExecutor = (*DriveSearchTool)(nil)
