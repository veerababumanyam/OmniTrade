package hooks

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"

	"go.uber.org/zap"
)

// Registry manages all registered hooks
type Registry struct {
	mu           sync.RWMutex
	hooks        map[string]Hook                    // hook_id -> Hook
	eventHooks   map[EventType][]Hook               // event_type -> []Hook
	plugins      map[string][]string                // plugin_name -> []hook_ids
	middlewares  []HookMiddleware
	logger       *zap.Logger
	hookTimeout  time.Duration
	maxHooks     int
	stats        *RegistryStats
}

// RegistryConfig contains configuration for the registry
type RegistryConfig struct {
	Logger      *zap.Logger
	HookTimeout time.Duration
	MaxHooks    int
}

// RegistryStats contains statistics about the registry
type RegistryStats struct {
	mu              sync.RWMutex
	TotalHooks      int64
	TotalExecutions int64
	TotalErrors     int64
	TotalDuration   time.Duration
	HooksByType     map[EventType]int64
	ErrorsByHook    map[string]int64
}

// NewRegistryStats creates new registry stats
func NewRegistryStats() *RegistryStats {
	return &RegistryStats{
		HooksByType:  make(map[EventType]int64),
		ErrorsByHook: make(map[string]int64),
	}
}

// RecordExecution records an execution
func (s *RegistryStats) RecordExecution(eventType EventType, duration time.Duration, hasError bool, hookID string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.TotalExecutions++
	s.TotalDuration += duration
	s.HooksByType[eventType]++

	if hasError {
		s.TotalErrors++
		s.ErrorsByHook[hookID]++
	}
}

// GetStats returns a copy of the stats
func (s *RegistryStats) GetStats() (int64, int64, int64, time.Duration) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.TotalHooks, s.TotalExecutions, s.TotalErrors, s.TotalDuration
}

// NewRegistry creates a new hook registry
func NewRegistry(config RegistryConfig) *Registry {
	if config.Logger == nil {
		config.Logger = zap.NewNop()
	}
	if config.HookTimeout == 0 {
		config.HookTimeout = 30 * time.Second
	}
	if config.MaxHooks == 0 {
		config.MaxHooks = 1000
	}

	return &Registry{
		hooks:       make(map[string]Hook),
		eventHooks:  make(map[EventType][]Hook),
		plugins:     make(map[string][]string),
		middlewares: make([]HookMiddleware, 0),
		logger:      config.Logger,
		hookTimeout: config.HookTimeout,
		maxHooks:    config.MaxHooks,
		stats:       NewRegistryStats(),
	}
}

// Register registers a new hook
func (r *Registry) Register(hook Hook) error {
	return r.RegisterWithPlugin(hook, "")
}

// RegisterWithPlugin registers a hook associated with a plugin
func (r *Registry) RegisterWithPlugin(hook Hook, pluginName string) error {
	if hook == nil {
		return fmt.Errorf("hook cannot be nil")
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	// Check max hooks limit
	if len(r.hooks) >= r.maxHooks {
		return fmt.Errorf("maximum number of hooks (%d) reached", r.maxHooks)
	}

	// Check for duplicate
	if _, exists := r.hooks[hook.ID()]; exists {
		return fmt.Errorf("hook with ID '%s' already registered", hook.ID())
	}

	// Register hook
	r.hooks[hook.ID()] = hook

	// Register for each event type
	for _, eventType := range hook.EventTypes() {
		r.eventHooks[eventType] = append(r.eventHooks[eventType], hook)
	}

	// Associate with plugin
	if pluginName != "" {
		r.plugins[pluginName] = append(r.plugins[pluginName], hook.ID())
	}

	r.stats.mu.Lock()
	r.stats.TotalHooks++
	r.stats.mu.Unlock()

	r.logger.Info("hook registered",
		zap.String("hook_id", hook.ID()),
		zap.String("hook_name", hook.Name()),
		zap.Strings("event_types", eventTypesToStrings(hook.EventTypes())),
		zap.Int("priority", int(hook.Priority())),
		zap.String("plugin", pluginName),
	)

	return nil
}

// Unregister removes a hook by ID
func (r *Registry) Unregister(hookID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	hook, exists := r.hooks[hookID]
	if !exists {
		return fmt.Errorf("hook with ID '%s' not found", hookID)
	}

	// Remove from hooks map
	delete(r.hooks, hookID)

	// Remove from event hooks
	for _, eventType := range hook.EventTypes() {
		hooks := r.eventHooks[eventType]
		for i, h := range hooks {
			if h.ID() == hookID {
				r.eventHooks[eventType] = append(hooks[:i], hooks[i+1:]...)
				break
			}
		}
	}

	// Remove from plugin associations
	for plugin, hookIDs := range r.plugins {
		for i, id := range hookIDs {
			if id == hookID {
				r.plugins[plugin] = append(hookIDs[:i], hookIDs[i+1:]...)
				break
			}
		}
	}

	r.stats.mu.Lock()
	r.stats.TotalHooks--
	r.stats.mu.Unlock()

	r.logger.Info("hook unregistered", zap.String("hook_id", hookID))

	return nil
}

// UnregisterPlugin removes all hooks associated with a plugin
func (r *Registry) UnregisterPlugin(pluginName string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	hookIDs, exists := r.plugins[pluginName]
	if !exists {
		return nil // No hooks for this plugin
	}

	// Remove each hook
	for _, hookID := range hookIDs {
		if hook, ok := r.hooks[hookID]; ok {
			// Remove from event hooks
			for _, eventType := range hook.EventTypes() {
				hooks := r.eventHooks[eventType]
				for i, h := range hooks {
					if h.ID() == hookID {
						r.eventHooks[eventType] = append(hooks[:i], hooks[i+1:]...)
						break
					}
				}
			}
			delete(r.hooks, hookID)
		}
	}

	delete(r.plugins, pluginName)

	r.stats.mu.Lock()
	r.stats.TotalHooks -= int64(len(hookIDs))
	r.stats.mu.Unlock()

	r.logger.Info("plugin hooks unregistered",
		zap.String("plugin", pluginName),
		zap.Int("count", len(hookIDs)),
	)

	return nil
}

// Get retrieves a hook by ID
func (r *Registry) Get(hookID string) (Hook, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	hook, exists := r.hooks[hookID]
	return hook, exists
}

// GetByEventType retrieves all hooks for an event type, sorted by priority
func (r *Registry) GetByEventType(eventType EventType) []Hook {
	r.mu.RLock()
	defer r.mu.RUnlock()

	hooks := r.eventHooks[eventType]
	if len(hooks) == 0 {
		return nil
	}

	// Sort by priority (descending)
	sorted := make([]Hook, len(hooks))
	copy(sorted, hooks)

	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].Priority() > sorted[j].Priority()
	})

	return sorted
}

// GetByPlugin retrieves all hooks for a plugin
func (r *Registry) GetByPlugin(pluginName string) []Hook {
	r.mu.RLock()
	defer r.mu.RUnlock()

	hookIDs, exists := r.plugins[pluginName]
	if !exists {
		return nil
	}

	hooks := make([]Hook, 0, len(hookIDs))
	for _, id := range hookIDs {
		if hook, ok := r.hooks[id]; ok {
			hooks = append(hooks, hook)
		}
	}

	return hooks
}

// GetAll retrieves all registered hooks
func (r *Registry) GetAll() []Hook {
	r.mu.RLock()
	defer r.mu.RUnlock()

	hooks := make([]Hook, 0, len(r.hooks))
	for _, hook := range r.hooks {
		hooks = append(hooks, hook)
	}

	return hooks
}

// Enable enables a hook by ID
func (r *Registry) Enable(hookID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	hook, exists := r.hooks[hookID]
	if !exists {
		return fmt.Errorf("hook with ID '%s' not found", hookID)
	}

	hook.Enable()
	r.logger.Info("hook enabled", zap.String("hook_id", hookID))

	return nil
}

// Disable disables a hook by ID
func (r *Registry) Disable(hookID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	hook, exists := r.hooks[hookID]
	if !exists {
		return fmt.Errorf("hook with ID '%s' not found", hookID)
	}

	hook.Disable()
	r.logger.Info("hook disabled", zap.String("hook_id", hookID))

	return nil
}

// AddMiddleware adds a middleware that wraps all hook executions
func (r *Registry) AddMiddleware(middleware HookMiddleware) {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.middlewares = append(r.middlewares, middleware)
}

// GetMiddlewares returns all registered middlewares
func (r *Registry) GetMiddlewares() []HookMiddleware {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return r.middlewares
}

// Stats returns registry statistics
func (r *Registry) Stats() (int64, int64, int64, time.Duration) {
	return r.stats.GetStats()
}

// GetHooksByTypeStats returns execution counts by event type
func (r *Registry) GetHooksByTypeStats() map[EventType]int64 {
	r.stats.mu.RLock()
	defer r.stats.mu.RUnlock()

	result := make(map[EventType]int64)
	for k, v := range r.stats.HooksByType {
		result[k] = v
	}
	return result
}

// GetErrorsByHook returns error counts by hook ID
func (r *Registry) GetErrorsByHook() map[string]int64 {
	r.stats.mu.RLock()
	defer r.stats.mu.RUnlock()

	result := make(map[string]int64)
	for k, v := range r.stats.ErrorsByHook {
		result[k] = v
	}
	return result
}

// Clear removes all hooks
func (r *Registry) Clear() {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.hooks = make(map[string]Hook)
	r.eventHooks = make(map[EventType][]Hook)
	r.plugins = make(map[string][]string)

	r.logger.Info("all hooks cleared")
}

// HasHooks checks if any hooks are registered for an event type
func (r *Registry) HasHooks(eventType EventType) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()

	hooks, exists := r.eventHooks[eventType]
	return exists && len(hooks) > 0
}

// ListEventTypes returns all event types that have hooks registered
func (r *Registry) ListEventTypes() []EventType {
	r.mu.RLock()
	defer r.mu.RUnlock()

	types := make([]EventType, 0, len(r.eventHooks))
	for t := range r.eventHooks {
		types = append(types, t)
	}
	return types
}

// ListPlugins returns all plugin names that have hooks registered
func (r *Registry) ListPlugins() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	plugins := make([]string, 0, len(r.plugins))
	for p := range r.plugins {
		plugins = append(plugins, p)
	}
	return plugins
}

// HookInfo contains information about a hook
type HookInfo struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	EventTypes  []string `json:"event_types"`
	Priority    int      `json:"priority"`
	Enabled     bool     `json:"enabled"`
	Timeout     int64    `json:"timeout"`
	Plugin      string   `json:"plugin,omitempty"`
}

// GetHookInfo returns detailed information about a hook
func (r *Registry) GetHookInfo(hookID string) (*HookInfo, bool) {
	r.mu.RLock()
	defer r.mu.Unlock()

	hook, exists := r.hooks[hookID]
	if !exists {
		return nil, false
	}

	info := &HookInfo{
		ID:          hook.ID(),
		Name:        hook.Name(),
		Description: hook.Description(),
		EventTypes:  eventTypesToStrings(hook.EventTypes()),
		Priority:    int(hook.Priority()),
		Enabled:     hook.IsEnabled(),
		Timeout:     hook.Timeout(),
	}

	// Find plugin
	for plugin, hookIDs := range r.plugins {
		for _, id := range hookIDs {
			if id == hookID {
				info.Plugin = plugin
				break
			}
		}
	}

	return info, true
}

// GetAllHookInfo returns information about all hooks
func (r *Registry) GetAllHookInfo() []*HookInfo {
	r.mu.RLock()
	defer r.mu.RUnlock()

	infos := make([]*HookInfo, 0, len(r.hooks))
	for _, hook := range r.hooks {
		info := &HookInfo{
			ID:          hook.ID(),
			Name:        hook.Name(),
			Description: hook.Description(),
			EventTypes:  eventTypesToStrings(hook.EventTypes()),
			Priority:    int(hook.Priority()),
			Enabled:     hook.IsEnabled(),
			Timeout:     hook.Timeout(),
		}

		// Find plugin
		for plugin, hookIDs := range r.plugins {
			for _, id := range hookIDs {
				if id == hook.ID() {
					info.Plugin = plugin
					break
				}
			}
		}

		infos = append(infos, info)
	}

	// Sort by priority (descending)
	sort.Slice(infos, func(i, j int) bool {
		return infos[i].Priority > infos[j].Priority
	})

	return infos
}

// ValidateEvent validates that an event can be processed
func (r *Registry) ValidateEvent(event *Event) error {
	if event == nil {
		return fmt.Errorf("event cannot be nil")
	}
	if event.Type == "" {
		return fmt.Errorf("event type is required")
	}
	if event.Source == "" {
		return fmt.Errorf("event source is required")
	}
	if event.Payload == nil {
		return fmt.Errorf("event payload is required")
	}
	if err := event.Payload.Validate(); err != nil {
		return fmt.Errorf("invalid payload: %w", err)
	}
	return nil
}

// eventTypesToStrings converts event types to strings
func eventTypesToStrings(types []EventType) []string {
	result := make([]string, len(types))
	for i, t := range types {
		result[i] = string(t)
	}
	return result
}

// MatchEventType checks if a pattern matches an event type
// Supports wildcards: "before.*" matches "before.data.fetch"
func MatchEventType(pattern, eventType EventType) bool {
	patternStr := string(pattern)
	eventStr := string(eventType)

	// Exact match
	if patternStr == eventStr {
		return true
	}

	// Wildcard match
	if strings.HasSuffix(patternStr, ".*") {
		prefix := strings.TrimSuffix(patternStr, ".*")
		return strings.HasPrefix(eventStr, prefix+".")
	}

	// Double wildcard (matches everything after)
	if strings.HasSuffix(patternStr, ".**") {
		prefix := strings.TrimSuffix(patternStr, ".**")
		return strings.HasPrefix(eventStr, prefix)
	}

	return false
}

// GetMatchingHooks retrieves hooks that match an event type (including wildcards)
func (r *Registry) GetMatchingHooks(eventType EventType) []Hook {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var matchingHooks []Hook

	// Check exact match
	if hooks, ok := r.eventHooks[eventType]; ok {
		matchingHooks = append(matchingHooks, hooks...)
	}

	// Check wildcard patterns
	for pattern, hooks := range r.eventHooks {
		if pattern != eventType && MatchEventType(pattern, eventType) {
			matchingHooks = append(matchingHooks, hooks...)
		}
	}

	// Sort by priority (descending)
	sort.Slice(matchingHooks, func(i, j int) bool {
		return matchingHooks[i].Priority() > matchingHooks[j].Priority()
	})

	return matchingHooks
}

// Context keys for registry
type registryContextKey string

const (
	RegistryContextKey registryContextKey = "hook_registry"
)

// WithRegistry adds a registry to a context
func WithRegistry(ctx context.Context, registry *Registry) context.Context {
	return context.WithValue(ctx, RegistryContextKey, registry)
}

// FromContext retrieves a registry from a context
func FromContext(ctx context.Context) (*Registry, bool) {
	registry, ok := ctx.Value(RegistryContextKey).(*Registry)
	return registry, ok
}
