package hooks

import (
	"context"
	"fmt"
)

// HookResult represents the result of a hook execution
type HookResult struct {
	// Proceed indicates whether to continue executing subsequent hooks
	Proceed bool `json:"proceed"`

	// ModifiedEvent is the potentially modified event (can be nil if not modified)
	ModifiedEvent *Event `json:"modified_event,omitempty"`

	// Data is arbitrary data returned by the hook
	Data interface{} `json:"data,omitempty"`

	// Error is an error that occurred during hook execution
	Error error `json:"error,omitempty"`

	// Metadata contains additional information about the hook execution
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// NewHookResult creates a new hook result that allows proceeding
func NewHookResult() *HookResult {
	return &HookResult{
		Proceed:  true,
		Metadata: make(map[string]interface{}),
	}
}

// StopResult creates a result that stops further hook execution
func StopResult(reason string) *HookResult {
	return &HookResult{
		Proceed:   false,
		Metadata:  map[string]interface{}{"reason": reason},
	}
}

// ErrorResult creates a result with an error
func ErrorResult(err error) *HookResult {
	return &HookResult{
		Proceed: true, // Continue even on error (errors are logged)
		Error:   err,
	}
}

// WithData adds data to the result
func (r *HookResult) WithData(data interface{}) *HookResult {
	r.Data = data
	return r
}

// WithModifiedEvent sets the modified event
func (r *HookResult) WithModifiedEvent(event *Event) *HookResult {
	r.ModifiedEvent = event
	return r
}

// WithMetadata adds metadata to the result
func (r *HookResult) WithMetadata(key string, value interface{}) *HookResult {
	if r.Metadata == nil {
		r.Metadata = make(map[string]interface{})
	}
	r.Metadata[key] = value
	return r
}

// Hook is the interface for a hook handler
type Hook interface {
	// ID returns a unique identifier for this hook
	ID() string

	// Name returns a human-readable name for the hook
	Name() string

	// Description returns a description of what the hook does
	Description() string

	// EventTypes returns the event types this hook subscribes to
	EventTypes() []EventType

	// Priority returns the execution priority (higher = earlier)
	Priority() Priority

	// Execute runs the hook logic
	Execute(ctx context.Context, event *Event) *HookResult

	// IsEnabled returns whether the hook is currently enabled
	IsEnabled() bool

	// Enable enables the hook
	Enable()

	// Disable disables the hook
	Disable()

	// Timeout returns the maximum execution time for this hook
	Timeout() int64 // milliseconds, 0 = no timeout
}

// HookConfig contains configuration for a hook
type HookConfig struct {
	ID          string        `json:"id"`
	Name        string        `json:"name"`
	Description string        `json:"description"`
	EventTypes  []EventType   `json:"event_types"`
	Priority    Priority      `json:"priority"`
	Enabled     bool          `json:"enabled"`
	Timeout     int64         `json:"timeout"` // milliseconds
	MaxRetries  int           `json:"max_retries"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// Validate validates the hook configuration
func (c *HookConfig) Validate() error {
	if c.ID == "" {
		return fmt.Errorf("hook id is required")
	}
	if c.Name == "" {
		return fmt.Errorf("hook name is required")
	}
	if len(c.EventTypes) == 0 {
		return fmt.Errorf("at least one event type is required")
	}
	if c.Timeout < 0 {
		return fmt.Errorf("timeout cannot be negative")
	}
	if c.MaxRetries < 0 {
		return fmt.Errorf("max_retries cannot be negative")
	}
	return nil
}

// BaseHook provides a base implementation of the Hook interface
type BaseHook struct {
	config HookConfig
}

// NewBaseHook creates a new base hook with the given configuration
func NewBaseHook(config HookConfig) *BaseHook {
	return &BaseHook{config: config}
}

// ID returns the hook identifier
func (h *BaseHook) ID() string {
	return h.config.ID
}

// Name returns the hook name
func (h *BaseHook) Name() string {
	return h.config.Name
}

// Description returns the hook description
func (h *BaseHook) Description() string {
	return h.config.Description
}

// EventTypes returns the subscribed event types
func (h *BaseHook) EventTypes() []EventType {
	return h.config.EventTypes
}

// Priority returns the hook priority
func (h *BaseHook) Priority() Priority {
	return h.config.Priority
}

// IsEnabled returns whether the hook is enabled
func (h *BaseHook) IsEnabled() bool {
	return h.config.Enabled
}

// Enable enables the hook
func (h *BaseHook) Enable() {
	h.config.Enabled = true
}

// Disable disables the hook
func (h *BaseHook) Disable() {
	h.config.Enabled = false
}

// Timeout returns the hook timeout
func (h *BaseHook) Timeout() int64 {
	return h.config.Timeout
}

// Config returns the hook configuration
func (h *BaseHook) Config() HookConfig {
	return h.config
}

// HookFunc is a function that implements the Hook interface
type HookFunc struct {
	BaseHook
	handler func(ctx context.Context, event *Event) *HookResult
}

// NewHookFunc creates a hook from a function
func NewHookFunc(config HookConfig, handler func(ctx context.Context, event *Event) *HookResult) *HookFunc {
	return &HookFunc{
		BaseHook: BaseHook{config: config},
		handler:  handler,
	}
}

// Execute runs the hook function
func (h *HookFunc) Execute(ctx context.Context, event *Event) *HookResult {
	if h.handler == nil {
		return NewHookResult()
	}
	return h.handler(ctx, event)
}

// HookMiddleware is a function that wraps a hook
type HookMiddleware func(next HookExecutor) HookExecutor

// HookExecutor is a function that executes a hook
type HookExecutor func(ctx context.Context, event *Event) *HookResult

// HookChain represents a chain of hooks to be executed
type HookChain struct {
	hooks []Hook
}

// NewHookChain creates a new hook chain
func NewHookChain(hooks ...Hook) *HookChain {
	return &HookChain{hooks: hooks}
}

// Add adds a hook to the chain
func (c *HookChain) Add(hook Hook) {
	c.hooks = append(c.hooks, hook)
}

// Execute executes all hooks in the chain in priority order
func (c *HookChain) Execute(ctx context.Context, event *Event) []*HookResult {
	// Sort by priority (descending)
	sorted := make([]Hook, len(c.hooks))
	copy(sorted, c.hooks)

	// Simple insertion sort by priority
	for i := 1; i < len(sorted); i++ {
		for j := i; j > 0 && sorted[j].Priority() > sorted[j-1].Priority(); j-- {
			sorted[j], sorted[j-1] = sorted[j-1], sorted[j]
		}
	}

	var results []*HookResult
	currentEvent := event

	for _, hook := range sorted {
		if !hook.IsEnabled() {
			continue
		}

		result := hook.Execute(ctx, currentEvent)
		results = append(results, result)

		// Update event if modified
		if result.ModifiedEvent != nil {
			currentEvent = result.ModifiedEvent
		}

		// Stop if the hook says not to proceed
		if !result.Proceed {
			break
		}
	}

	return results
}

// Hooks returns all hooks in the chain
func (c *HookChain) Hooks() []Hook {
	return c.hooks
}

// Length returns the number of hooks in the chain
func (c *HookChain) Length() int {
	return len(c.hooks)
}

// HookFilter is a function that filters events
type HookFilter func(event *Event) bool

// FilteredHook wraps a hook with a filter
type FilteredHook struct {
	Hook
	filter HookFilter
}

// NewFilteredHook creates a filtered hook
func NewFilteredHook(hook Hook, filter HookFilter) *FilteredHook {
	return &FilteredHook{
		Hook:   hook,
		filter: filter,
	}
}

// Execute runs the hook only if the filter passes
func (h *FilteredHook) Execute(ctx context.Context, event *Event) *HookResult {
	if h.filter != nil && !h.filter(event) {
		return NewHookResult() // Skip this hook
	}
	return h.Hook.Execute(ctx, event)
}

// ConditionalHook wraps a hook with a condition function
type ConditionalHook struct {
	Hook
	condition func(ctx context.Context, event *Event) bool
}

// NewConditionalHook creates a conditional hook
func NewConditionalHook(hook Hook, condition func(ctx context.Context, event *Event) bool) *ConditionalHook {
	return &ConditionalHook{
		Hook:      hook,
		condition: condition,
	}
}

// Execute runs the hook only if the condition is met
func (h *ConditionalHook) Execute(ctx context.Context, event *Event) *HookResult {
	if h.condition != nil && !h.condition(ctx, event) {
		return NewHookResult()
	}
	return h.Hook.Execute(ctx, event)
}

// AsyncHook wraps a hook to run asynchronously
type AsyncHook struct {
	Hook
	resultChan chan *HookResult
}

// NewAsyncHook creates an async hook
func NewAsyncHook(hook Hook) *AsyncHook {
	return &AsyncHook{
		Hook:       hook,
		resultChan: make(chan *HookResult, 1),
	}
}

// Execute runs the hook asynchronously
func (h *AsyncHook) Execute(ctx context.Context, event *Event) *HookResult {
	go func() {
		result := h.Hook.Execute(ctx, event)
		select {
		case h.resultChan <- result:
		case <-ctx.Done():
		}
	}()

	// For async hooks, we return immediately with proceed=true
	// The actual result can be obtained via Result()
	return NewHookResult()
}

// Result returns the result channel for async execution
func (h *AsyncHook) Result() <-chan *HookResult {
	return h.resultChan
}

// HookBuilder provides a fluent interface for building hooks
type HookBuilder struct {
	config  HookConfig
	handler func(ctx context.Context, event *Event) *HookResult
	filter  HookFilter
}

// NewHookBuilder creates a new hook builder
func NewHookBuilder() *HookBuilder {
	return &HookBuilder{
		config: HookConfig{
			Enabled:    true,
			Priority:   PriorityNormal,
			Timeout:    5000, // 5 seconds default
			MaxRetries: 0,
			Metadata:   make(map[string]interface{}),
		},
	}
}

// WithID sets the hook ID
func (b *HookBuilder) WithID(id string) *HookBuilder {
	b.config.ID = id
	return b
}

// WithName sets the hook name
func (b *HookBuilder) WithName(name string) *HookBuilder {
	b.config.Name = name
	return b
}

// WithDescription sets the hook description
func (b *HookBuilder) WithDescription(desc string) *HookBuilder {
	b.config.Description = desc
	return b
}

// WithEvents sets the event types
func (b *HookBuilder) WithEvents(types ...EventType) *HookBuilder {
	b.config.EventTypes = types
	return b
}

// WithPriority sets the priority
func (b *HookBuilder) WithPriority(priority Priority) *HookBuilder {
	b.config.Priority = priority
	return b
}

// WithTimeout sets the timeout in milliseconds
func (b *HookBuilder) WithTimeout(timeout int64) *HookBuilder {
	b.config.Timeout = timeout
	return b
}

// WithMaxRetries sets the max retries
func (b *HookBuilder) WithMaxRetries(retries int) *HookBuilder {
	b.config.MaxRetries = retries
	return b
}

// WithMetadata sets metadata
func (b *HookBuilder) WithMetadata(key string, value interface{}) *HookBuilder {
	if b.config.Metadata == nil {
		b.config.Metadata = make(map[string]interface{})
	}
	b.config.Metadata[key] = value
	return b
}

// WithHandler sets the handler function
func (b *HookBuilder) WithHandler(handler func(ctx context.Context, event *Event) *HookResult) *HookBuilder {
	b.handler = handler
	return b
}

// WithFilter sets the filter function
func (b *HookBuilder) WithFilter(filter HookFilter) *HookBuilder {
	b.filter = filter
	return b
}

// Build creates the hook
func (b *HookBuilder) Build() (Hook, error) {
	if err := b.config.Validate(); err != nil {
		return nil, err
	}

	if b.handler == nil {
		return nil, fmt.Errorf("handler is required")
	}

	hook := NewHookFunc(b.config, b.handler)

	if b.filter != nil {
		return NewFilteredHook(hook, b.filter), nil
	}

	return hook, nil
}

// MustBuild creates the hook or panics
func (b *HookBuilder) MustBuild() Hook {
	hook, err := b.Build()
	if err != nil {
		panic(err)
	}
	return hook
}
