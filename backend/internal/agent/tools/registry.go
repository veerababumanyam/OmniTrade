package tools

import (
	"context"
	"fmt"
	"log"
	"sort"
	"strings"
	"sync"
	"time"
)

// Registry is the central registry for all agent tools
type Registry struct {
	mu          sync.RWMutex
	tools       map[string]ToolExecutor
	categories  map[Category][]string // category -> tool IDs
	permissions *PermissionManager
	rateLimiter *RateLimiter
	hooks       *HookManager
}

// RegistryOption is a functional option for configuring the registry
type RegistryOption func(*Registry)

// globalRegistry is the default global registry instance
var globalRegistry *Registry
var globalRegistryOnce sync.Once

// NewRegistry creates a new tool registry
func NewRegistry(opts ...RegistryOption) *Registry {
	r := &Registry{
		tools:      make(map[string]ToolExecutor),
		categories: make(map[Category][]string),
	}

	for _, opt := range opts {
		opt(r)
	}

	// Initialize default components if not provided
	if r.permissions == nil {
		r.permissions = NewPermissionManager()
	}
	if r.rateLimiter == nil {
		r.rateLimiter = NewRateLimiter()
	}
	if r.hooks == nil {
		r.hooks = NewHookManager()
	}

	return r
}

// WithPermissionManager sets a custom permission manager
func WithPermissionManager(pm *PermissionManager) RegistryOption {
	return func(r *Registry) {
		r.permissions = pm
	}
}

// WithRateLimiter sets a custom rate limiter
func WithRateLimiter(rl *RateLimiter) RegistryOption {
	return func(r *Registry) {
		r.rateLimiter = rl
	}
}

// WithHooks sets a custom hook manager
func WithHooks(hm *HookManager) RegistryOption {
	return func(r *Registry) {
		r.hooks = hm
	}
}

// GetGlobalRegistry returns the global registry instance, initializing it if necessary
func GetGlobalRegistry() *Registry {
	globalRegistryOnce.Do(func() {
		globalRegistry = NewRegistry()
	})
	return globalRegistry
}

// Register registers a tool executor with the registry
func (r *Registry) Register(executor ToolExecutor) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	def := executor.Definition()
	if def == nil {
		return fmt.Errorf("tool definition is nil")
	}

	// Validate the definition
	if err := def.Validate(); err != nil {
		return fmt.Errorf("invalid tool definition: %w", err)
	}

	// Check for duplicate registration
	if _, exists := r.tools[def.ID]; exists {
		return fmt.Errorf("tool already registered: %s", def.ID)
	}

	// Register the tool
	r.tools[def.ID] = executor

	// Update category index
	r.categories[def.Category] = append(r.categories[def.Category], def.ID)

	log.Printf("[ToolRegistry] Registered tool: %s (category: %s, version: %s)",
		def.ID, def.Category, def.Version)

	return nil
}

// MustRegister registers a tool and panics on error
func (r *Registry) MustRegister(executor ToolExecutor) {
	if err := r.Register(executor); err != nil {
		panic(fmt.Sprintf("failed to register tool: %v", err))
	}
}

// Unregister removes a tool from the registry
func (r *Registry) Unregister(toolID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	executor, exists := r.tools[toolID]
	if !exists {
		return fmt.Errorf("tool not found: %s", toolID)
	}

	def := executor.Definition()

	// Remove from tools map
	delete(r.tools, toolID)

	// Remove from category index
	if tools, ok := r.categories[def.Category]; ok {
		for i, id := range tools {
			if id == toolID {
				r.categories[def.Category] = append(tools[:i], tools[i+1:]...)
				break
			}
		}
	}

	log.Printf("[ToolRegistry] Unregistered tool: %s", toolID)
	return nil
}

// Get retrieves a tool executor by ID
func (r *Registry) Get(toolID string) (ToolExecutor, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	executor, exists := r.tools[toolID]
	return executor, exists
}

// GetDefinition retrieves a tool definition by ID
func (r *Registry) GetDefinition(toolID string) (*ToolDefinition, bool) {
	executor, exists := r.Get(toolID)
	if !exists {
		return nil, false
	}
	return executor.Definition(), true
}

// List returns all registered tool IDs
func (r *Registry) List() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	ids := make([]string, 0, len(r.tools))
	for id := range r.tools {
		ids = append(ids, id)
	}
	sort.Strings(ids)
	return ids
}

// ListByCategory returns tool IDs for a specific category
func (r *Registry) ListByCategory(category Category) []string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	tools, exists := r.categories[category]
	if !exists {
		return []string{}
	}

	// Return a copy to prevent modification
	result := make([]string, len(tools))
	copy(result, tools)
	sort.Strings(result)
	return result
}

// ListByPermission returns tool IDs requiring a specific permission level or lower
func (r *Registry) ListByPermission(level PermissionLevel) []string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	permissionOrder := map[PermissionLevel]int{
		PermissionRead:    0,
		PermissionAnalyze: 1,
		PermissionTrade:   2,
		PermissionAdmin:   3,
	}

	maxLevel := permissionOrder[level]
	ids := []string{}

	for _, executor := range r.tools {
		def := executor.Definition()
		if permissionOrder[def.PermissionLevel] <= maxLevel {
			ids = append(ids, def.ID)
		}
	}

	sort.Strings(ids)
	return ids
}

// Search finds tools matching a query
func (r *Registry) Search(query string) []string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	query = strings.ToLower(query)
	ids := []string{}

	for _, executor := range r.tools {
		def := executor.Definition()

		// Search in ID, name, description, and tags
		if strings.Contains(strings.ToLower(def.ID), query) ||
			strings.Contains(strings.ToLower(def.Name), query) ||
			strings.Contains(strings.ToLower(def.Description), query) {
			ids = append(ids, def.ID)
			continue
		}

		// Search in tags
		for _, tag := range def.Tags {
			if strings.Contains(strings.ToLower(tag), query) {
				ids = append(ids, def.ID)
				break
			}
		}
	}

	sort.Strings(ids)
	return ids
}

// GetDefinitions returns all tool definitions
func (r *Registry) GetDefinitions() []*ToolDefinition {
	r.mu.RLock()
	defer r.mu.RUnlock()

	definitions := make([]*ToolDefinition, 0, len(r.tools))
	for _, executor := range r.tools {
		definitions = append(definitions, executor.Definition())
	}

	// Sort by ID for consistent ordering
	sort.Slice(definitions, func(i, j int) bool {
		return definitions[i].ID < definitions[j].ID
	})

	return definitions
}

// Execute runs a tool with the given input
func (r *Registry) Execute(ctx context.Context, input *ExecutionInput) (*ExecutionResult, error) {
	// Get the tool
	executor, exists := r.Get(input.ToolID)
	if !exists {
		return nil, fmt.Errorf("tool not found: %s", input.ToolID)
	}

	def := executor.Definition()

	// Execute before hooks
	if err := r.hooks.ExecuteBefore(ctx, input); err != nil {
		return nil, fmt.Errorf("before hook failed: %w", err)
	}

	// Check rate limits
	if def.RateLimitRequests > 0 {
		if !r.rateLimiter.Allow(input.ToolID, input.Context.UserID) {
			return &ExecutionResult{
				ToolID:    input.ToolID,
				RequestID: input.Context.RequestID,
				Success:   false,
				Error: &ExecutionError{
					Code:    "RATE_LIMIT_EXCEEDED",
					Message: "rate limit exceeded for this tool",
					Type:    "rate_limit",
				},
			}, nil
		}
	}

	// Validate input
	if err := executor.ValidateInput(ctx, input); err != nil {
		return &ExecutionResult{
			ToolID:    input.ToolID,
			RequestID: input.Context.RequestID,
			Success:   false,
			Error: &ExecutionError{
				Code:    "VALIDATION_ERROR",
				Message: err.Error(),
				Type:    "validation",
			},
		}, nil
	}

	// Check permissions
	if err := r.permissions.Check(ctx, def, input); err != nil {
		return &ExecutionResult{
			ToolID:    input.ToolID,
			RequestID: input.Context.RequestID,
			Success:   false,
			Error: &ExecutionError{
				Code:    "PERMISSION_DENIED",
				Message: err.Error(),
				Type:    "permission",
			},
		}, nil
	}

	// Apply timeout
	if def.Timeout > 0 {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, def.Timeout)
		defer cancel()
	}

	// Execute the tool
	startTime := time.Now()
	result, err := executor.Execute(ctx, input)
	duration := time.Since(startTime)

	if result != nil {
		result.Metadata.Duration = duration
	}

	// Execute after hooks
	r.hooks.ExecuteAfter(ctx, input, result, err)

	if err != nil {
		return nil, err
	}

	return result, nil
}

// Stats returns registry statistics
func (r *Registry) Stats() RegistryStats {
	r.mu.RLock()
	defer r.mu.RUnlock()

	stats := RegistryStats{
		TotalTools:    len(r.tools),
		ByCategory:    make(map[Category]int),
		ByPermission:  make(map[PermissionLevel]int),
		ByRisk:        make(map[RiskLevel]int),
		Deprecated:    0,
	}

	for _, executor := range r.tools {
		def := executor.Definition()
		stats.ByCategory[def.Category]++
		stats.ByPermission[def.PermissionLevel]++
		stats.ByRisk[def.RiskLevel]++
		if def.Deprecated {
			stats.Deprecated++
		}
	}

	return stats
}

// RegistryStats contains statistics about the registry
type RegistryStats struct {
	TotalTools   int                       `json:"total_tools"`
	ByCategory   map[Category]int          `json:"by_category"`
	ByPermission map[PermissionLevel]int   `json:"by_permission"`
	ByRisk       map[RiskLevel]int         `json:"by_risk"`
	Deprecated   int                       `json:"deprecated"`
}

// RateLimiter manages rate limiting for tool execution
type RateLimiter struct {
	mu     sync.RWMutex
	buckets map[string]*rateBucket
}

type rateBucket struct {
	tokens    int
	lastCheck time.Time
	window    time.Duration
	maxTokens int
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter() *RateLimiter {
	return &RateLimiter{
		buckets: make(map[string]*rateBucket),
	}
}

// Allow checks if a request is allowed under rate limiting
func (rl *RateLimiter) Allow(toolID, userID string) bool {
	key := fmt.Sprintf("%s:%s", toolID, userID)

	rl.mu.Lock()
	defer rl.mu.Unlock()

	bucket, exists := rl.buckets[key]
	if !exists {
		return true // No rate limit configured
	}

	now := time.Now()
	elapsed := now.Sub(bucket.lastCheck)

	// Refill tokens based on elapsed time
	if elapsed >= bucket.window {
		bucket.tokens = bucket.maxTokens
		bucket.lastCheck = now
	}

	if bucket.tokens > 0 {
		bucket.tokens--
		return true
	}

	return false
}

// SetLimit configures a rate limit for a tool/user combination
func (rl *RateLimiter) SetLimit(toolID, userID string, maxRequests int, window time.Duration) {
	key := fmt.Sprintf("%s:%s", toolID, userID)

	rl.mu.Lock()
	defer rl.mu.Unlock()

	rl.buckets[key] = &rateBucket{
		tokens:    maxRequests,
		lastCheck: time.Now(),
		window:    window,
		maxTokens: maxRequests,
	}
}

// HookManager manages lifecycle hooks for tool execution
type HookManager struct {
	mu            sync.RWMutex
	beforeHooks   []HookFunc
	afterHooks    []HookFunc
	errorHooks    []ErrorHookFunc
}

// HookFunc is a function that runs before or after tool execution
type HookFunc func(ctx context.Context, input *ExecutionInput) error

// ErrorHookFunc is a function that runs after tool execution with error info
type ErrorHookFunc func(ctx context.Context, input *ExecutionInput, result *ExecutionResult, err error)

// NewHookManager creates a new hook manager
func NewHookManager() *HookManager {
	return &HookManager{
		beforeHooks: []HookFunc{},
		afterHooks:  []HookFunc{},
		errorHooks:  []ErrorHookFunc{},
	}
}

// RegisterBeforeHook adds a hook that runs before tool execution
func (hm *HookManager) RegisterBeforeHook(hook HookFunc) {
	hm.mu.Lock()
	defer hm.mu.Unlock()
	hm.beforeHooks = append(hm.beforeHooks, hook)
}

// RegisterAfterHook adds a hook that runs after tool execution
func (hm *HookManager) RegisterAfterHook(hook HookFunc) {
	hm.mu.Lock()
	defer hm.mu.Unlock()
	hm.afterHooks = append(hm.afterHooks, hook)
}

// RegisterErrorHook adds a hook that runs on execution errors
func (hm *HookManager) RegisterErrorHook(hook ErrorHookFunc) {
	hm.mu.Lock()
	defer hm.mu.Unlock()
	hm.errorHooks = append(hm.errorHooks, hook)
}

// ExecuteBefore runs all before hooks
func (hm *HookManager) ExecuteBefore(ctx context.Context, input *ExecutionInput) error {
	hm.mu.RLock()
	defer hm.mu.RUnlock()

	for _, hook := range hm.beforeHooks {
		if err := hook(ctx, input); err != nil {
			return err
		}
	}
	return nil
}

// ExecuteAfter runs all after hooks
func (hm *HookManager) ExecuteAfter(ctx context.Context, input *ExecutionInput, result *ExecutionResult, err error) {
	hm.mu.RLock()
	defer hm.mu.RUnlock()

	for _, hook := range hm.afterHooks {
		_ = hook(ctx, input) // Ignore errors in after hooks
	}

	if err != nil {
		for _, hook := range hm.errorHooks {
			hook(ctx, input, result, err)
		}
	}
}

// Register is a convenience function to register a tool with the global registry
func Register(executor ToolExecutor) error {
	return GetGlobalRegistry().Register(executor)
}

// MustRegister is a convenience function to register a tool with the global registry, panicking on error
func MustRegister(executor ToolExecutor) {
	GetGlobalRegistry().MustRegister(executor)
}

// Execute is a convenience function to execute a tool using the global registry
func Execute(ctx context.Context, input *ExecutionInput) (*ExecutionResult, error) {
	return GetGlobalRegistry().Execute(ctx, input)
}
