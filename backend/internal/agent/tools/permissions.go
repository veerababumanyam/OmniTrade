package tools

import (
	"context"
	"fmt"
	"sync"
)

// PermissionManager handles permission checking for tool execution
type PermissionManager struct {
	mu           sync.RWMutex
	rolePermissions map[Role]PermissionSet
	userRoles      map[string][]Role // userID -> roles
	customRules    []PermissionRule
}

// Role represents a user role in the system
type Role string

const (
	RoleGuest    Role = "guest"
	RoleViewer   Role = "viewer"
	RoleAnalyst  Role = "analyst"
	RoleTrader   Role = "trader"
	RoleAdmin    Role = "admin"
	RoleSystem   Role = "system"
)

// PermissionSet defines what permissions a role has
type PermissionSet struct {
	Levels       []PermissionLevel `json:"levels"`
	Categories   []Category        `json:"categories"`
	MaxRiskLevel RiskLevel         `json:"max_risk_level"`
	Tools        []string          `json:"tools,omitempty"`        // Specific tool allowlist
	DeniedTools  []string          `json:"denied_tools,omitempty"` // Tool blacklist
}

// PermissionRule is a custom permission rule
type PermissionRule interface {
	Evaluate(ctx context.Context, def *ToolDefinition, input *ExecutionInput) (bool, error)
}

// PermissionContext contains context for permission evaluation
type PermissionContext struct {
	UserID       string
	Roles        []Role
	SessionID    string
	IPAddress    string
	CustomClaims map[string]interface{}
}

// NewPermissionManager creates a new permission manager with default roles
func NewPermissionManager() *PermissionManager {
	pm := &PermissionManager{
		rolePermissions: make(map[Role]PermissionSet),
		userRoles:       make(map[string][]Role),
		customRules:     []PermissionRule{},
	}

	// Initialize default role permissions
	pm.initializeDefaults()

	return pm
}

// initializeDefaults sets up default role permissions
func (pm *PermissionManager) initializeDefaults() {
	// Guest - read-only access to market data
	pm.rolePermissions[RoleGuest] = PermissionSet{
		Levels:       []PermissionLevel{PermissionRead},
		Categories:   []Category{CategoryMarketData, CategoryFundamental},
		MaxRiskLevel: RiskLow,
	}

	// Viewer - read access to most categories
	pm.rolePermissions[RoleViewer] = PermissionSet{
		Levels: []PermissionLevel{PermissionRead, PermissionAnalyze},
		Categories: []Category{
			CategoryMarketData,
			CategoryFundamental,
			CategorySentiment,
			CategoryTechnical,
			CategoryAnalysis,
		},
		MaxRiskLevel: RiskLow,
	}

	// Analyst - analysis and medium-risk operations
	pm.rolePermissions[RoleAnalyst] = PermissionSet{
		Levels: []PermissionLevel{PermissionRead, PermissionAnalyze},
		Categories: []Category{
			CategoryMarketData,
			CategoryFundamental,
			CategorySentiment,
			CategoryTechnical,
			CategoryRisk,
			CategoryAnalysis,
		},
		MaxRiskLevel: RiskMedium,
	}

	// Trader - can generate trade proposals
	pm.rolePermissions[RoleTrader] = PermissionSet{
		Levels: []PermissionLevel{PermissionRead, PermissionAnalyze, PermissionTrade},
		Categories: []Category{
			CategoryMarketData,
			CategoryFundamental,
			CategorySentiment,
			CategoryTechnical,
			CategoryRisk,
			CategoryPortfolio,
			CategoryAnalysis,
			CategoryNotification,
		},
		MaxRiskLevel: RiskHigh,
	}

	// Admin - full access
	pm.rolePermissions[RoleAdmin] = PermissionSet{
		Levels:       []PermissionLevel{PermissionRead, PermissionAnalyze, PermissionTrade, PermissionAdmin},
		Categories:   []Category{}, // Empty means all categories
		MaxRiskLevel: RiskCritical,
	}

	// System - for automated system operations
	pm.rolePermissions[RoleSystem] = PermissionSet{
		Levels:       []PermissionLevel{PermissionRead, PermissionAnalyze, PermissionTrade, PermissionAdmin},
		Categories:   []Category{},
		MaxRiskLevel: RiskHigh, // System can't do critical without explicit approval
	}
}

// Check verifies if the execution is permitted
func (pm *PermissionManager) Check(ctx context.Context, def *ToolDefinition, input *ExecutionInput) error {
	if input.Context == nil {
		return fmt.Errorf("execution context is required")
	}

	pm.mu.RLock()
	defer pm.mu.RUnlock()

	// Get user roles
	roles := pm.userRoles[input.Context.UserID]
	if len(roles) == 0 {
		// Default to guest if no roles assigned
		roles = []Role{RoleGuest}
	}

	// Check each role's permissions
	allowed := false
	for _, role := range roles {
		if pm.checkRolePermission(role, def, input) {
			allowed = true
			break
		}
	}

	if !allowed {
		return fmt.Errorf("permission denied: user %s cannot execute tool %s",
			input.Context.UserID, def.ID)
	}

	// Check custom rules
	for _, rule := range pm.customRules {
		permitted, err := rule.Evaluate(ctx, def, input)
		if err != nil {
			return fmt.Errorf("permission rule evaluation failed: %w", err)
		}
		if !permitted {
			return fmt.Errorf("permission denied by custom rule")
		}
	}

	return nil
}

// checkRolePermission checks if a role has permission to execute the tool
func (pm *PermissionManager) checkRolePermission(role Role, def *ToolDefinition, input *ExecutionInput) bool {
	perms, exists := pm.rolePermissions[role]
	if !exists {
		return false
	}

	// Check permission level
	levelAllowed := false
	for _, level := range perms.Levels {
		if level == def.PermissionLevel {
			levelAllowed = true
			break
		}
	}
	if !levelAllowed {
		return false
	}

	// Check category (empty categories means all allowed)
	if len(perms.Categories) > 0 {
		categoryAllowed := false
		for _, cat := range perms.Categories {
			if cat == def.Category {
				categoryAllowed = true
				break
			}
		}
		if !categoryAllowed {
			return false
		}
	}

	// Check risk level
	if !isRiskAllowed(perms.MaxRiskLevel, def.RiskLevel) {
		return false
	}

	// Check tool allowlist
	if len(perms.Tools) > 0 {
		toolAllowed := false
		for _, toolID := range perms.Tools {
			if toolID == def.ID {
				toolAllowed = true
				break
			}
		}
		if !toolAllowed {
			return false
		}
	}

	// Check tool blacklist
	for _, deniedTool := range perms.DeniedTools {
		if deniedTool == def.ID {
			return false
		}
	}

	return true
}

// isRiskAllowed checks if the allowed risk level permits the required risk level
func isRiskAllowed(allowed, required RiskLevel) bool {
	riskOrder := map[RiskLevel]int{
		RiskLow:      0,
		RiskMedium:   1,
		RiskHigh:     2,
		RiskCritical: 3,
	}

	return riskOrder[allowed] >= riskOrder[required]
}

// SetUserRole assigns roles to a user
func (pm *PermissionManager) SetUserRole(userID string, roles ...Role) {
	pm.mu.Lock()
	defer pm.mu.Unlock()
	pm.userRoles[userID] = roles
}

// GetUserRoles returns the roles assigned to a user
func (pm *PermissionManager) GetUserRoles(userID string) []Role {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	roles := pm.userRoles[userID]
	if len(roles) == 0 {
		return []Role{RoleGuest}
	}

	result := make([]Role, len(roles))
	copy(result, roles)
	return result
}

// SetRolePermissions configures permissions for a role
func (pm *PermissionManager) SetRolePermissions(role Role, perms PermissionSet) {
	pm.mu.Lock()
	defer pm.mu.Unlock()
	pm.rolePermissions[role] = perms
}

// GetRolePermissions returns the permissions for a role
func (pm *PermissionManager) GetRolePermissions(role Role) (PermissionSet, bool) {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	perms, exists := pm.rolePermissions[role]
	return perms, exists
}

// AddCustomRule adds a custom permission rule
func (pm *PermissionManager) AddCustomRule(rule PermissionRule) {
	pm.mu.Lock()
	defer pm.mu.Unlock()
	pm.customRules = append(pm.customRules, rule)
}

// ClearCustomRules removes all custom permission rules
func (pm *PermissionManager) ClearCustomRules() {
	pm.mu.Lock()
	defer pm.mu.Unlock()
	pm.customRules = []PermissionRule{}
}

// TimeBasedRule is a permission rule that restricts access based on time
type TimeBasedRule struct {
	AllowedHours []int // Hours (0-23) when execution is allowed
	DaysOfWeek   []int // Days (0=Sunday, 6=Saturday) when execution is allowed
}

// Evaluate checks if current time allows execution
func (r *TimeBasedRule) Evaluate(ctx context.Context, def *ToolDefinition, input *ExecutionInput) (bool, error) {
	// This would use input.Context.Timestamp to check time constraints
	// For now, return true (allowed)
	return true, nil
}

// CategoryRestrictionRule restricts access to certain categories based on context
type CategoryRestrictionRule struct {
	RestrictedCategories []Category
	Condition            func(ctx context.Context, input *ExecutionInput) bool
}

// Evaluate checks if category access is allowed
func (r *CategoryRestrictionRule) Evaluate(ctx context.Context, def *ToolDefinition, input *ExecutionInput) (bool, error) {
	// Check if this category is restricted
	isRestricted := false
	for _, cat := range r.RestrictedCategories {
		if cat == def.Category {
			isRestricted = true
			break
		}
	}

	if !isRestricted {
		return true, nil
	}

	// Apply condition if category is restricted
	if r.Condition != nil {
		return r.Condition(ctx, input), nil
	}

	return false, nil
}

// AuditLogger logs permission checks for compliance
type AuditLogger struct {
	mu     sync.Mutex
	entries []AuditEntry
}

// AuditEntry represents a single audit log entry
type AuditEntry struct {
	Timestamp   string           `json:"timestamp"`
	UserID      string           `json:"user_id"`
	ToolID      string           `json:"tool_id"`
	Permission  PermissionLevel  `json:"permission"`
	Risk        RiskLevel        `json:"risk"`
	Granted     bool             `json:"granted"`
	Reason      string           `json:"reason"`
	SessionID   string           `json:"session_id"`
	RequestID   string           `json:"request_id"`
}

// NewAuditLogger creates a new audit logger
func NewAuditLogger() *AuditLogger {
	return &AuditLogger{
		entries: []AuditEntry{},
	}
}

// Log records a permission check
func (al *AuditLogger) Log(entry AuditEntry) {
	al.mu.Lock()
	defer al.mu.Unlock()
	al.entries = append(al.entries, entry)
}

// GetEntries returns all audit entries
func (al *AuditLogger) GetEntries() []AuditEntry {
	al.mu.Lock()
	defer al.mu.Unlock()

	result := make([]AuditEntry, len(al.entries))
	copy(result, al.entries)
	return result
}

// Clear removes all audit entries
func (al *AuditLogger) Clear() {
	al.mu.Lock()
	defer al.mu.Unlock()
	al.entries = []AuditEntry{}
}

// RequiresHumanApproval checks if a tool execution requires human approval
func RequiresHumanApproval(def *ToolDefinition, input *ExecutionInput) bool {
	// Critical risk always requires approval
	if def.RiskLevel == RiskCritical {
		return true
	}

	// Trade operations require approval based on risk
	if def.PermissionLevel == PermissionTrade && def.RiskLevel >= RiskHigh {
		return true
	}

	// Admin operations always require approval
	if def.PermissionLevel == PermissionAdmin {
		return true
	}

	return false
}
