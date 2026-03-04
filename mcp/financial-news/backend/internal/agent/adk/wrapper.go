package adk

import (
	"context"
	"encoding/json"
	"fmt"
	"reflect"
	"time"

	"github.com/omnitrade/backend/internal/agent/hooks"
	"go.uber.org/zap"
)

// FunctionTool represents an ADK-compatible function tool
// This mirrors the Google ADK FunctionTool interface
type FunctionTool struct {
	// Name is the unique identifier for the tool
	Name string `json:"name"`

	// Description explains what the tool does
	Description string `json:"description"`

	// Parameters defines the tool's input schema (JSON Schema format)
	Parameters map[string]interface{} `json:"parameters"`

	// Required lists required parameter names
	Required []string `json:"required,omitempty"`

	// Handler is the function that executes the tool
	Handler ToolHandler `json:"-"`

	// Timeout for tool execution
	Timeout time.Duration `json:"timeout"`

	// RetryCount for failed executions
	RetryCount int `json:"retry_count"`

	// Metadata contains additional tool configuration
	Metadata map[string]interface{} `json:"metadata,omitempty"`

	// hooksRegistry for hook integration
	hooksRegistry *hooks.Registry

	// logger for tool logging
	logger *zap.Logger
}

// ToolHandler is the function signature for tool execution
type ToolHandler func(ctx context.Context, params map[string]interface{}) (interface{}, error)

// ToolResult represents the result of a tool execution
type ToolResult struct {
	// Success indicates if the tool executed successfully
	Success bool `json:"success"`

	// Data contains the tool's output data
	Data interface{} `json:"data,omitempty"`

	// Error contains error information if failed
	Error string `json:"error,omitempty"`

	// Metadata contains additional result information
	Metadata map[string]interface{} `json:"metadata,omitempty"`

	// Duration is the execution duration
	Duration time.Duration `json:"duration"`
}

// ToolOption is a function that configures a FunctionTool
type ToolOption func(*FunctionTool)

// WithToolDescription sets the tool description
func WithToolDescription(desc string) ToolOption {
	return func(t *FunctionTool) {
		t.Description = desc
	}
}

// WithToolParameters sets the tool parameters schema
func WithToolParameters(params map[string]interface{}) ToolOption {
	return func(t *FunctionTool) {
		t.Parameters = params
	}
}

// WithToolRequired sets required parameters
func WithToolRequired(required ...string) ToolOption {
	return func(t *FunctionTool) {
		t.Required = required
	}
}

// WithToolTimeout sets the tool timeout
func WithToolTimeout(timeout time.Duration) ToolOption {
	return func(t *FunctionTool) {
		t.Timeout = timeout
	}
}

// WithToolRetry sets the retry count
func WithToolRetry(count int) ToolOption {
	return func(t *FunctionTool) {
		t.RetryCount = count
	}
}

// WithToolMetadata sets tool metadata
func WithToolMetadata(key string, value interface{}) ToolOption {
	return func(t *FunctionTool) {
		if t.Metadata == nil {
			t.Metadata = make(map[string]interface{})
		}
		t.Metadata[key] = value
	}
}

// WithToolHooks sets the hooks registry
func WithToolHooks(registry *hooks.Registry) ToolOption {
	return func(t *FunctionTool) {
		t.hooksRegistry = registry
	}
}

// WithToolLogger sets the logger
func WithToolLogger(logger *zap.Logger) ToolOption {
	return func(t *FunctionTool) {
		t.logger = logger
	}
}

// NewFunctionTool creates a new ADK-compatible function tool
func NewFunctionTool(name string, handler ToolHandler, opts ...ToolOption) *FunctionTool {
	tool := &FunctionTool{
		Name:        name,
		Handler:     handler,
		Timeout:     30 * time.Second,
		RetryCount:  2,
		Metadata:    make(map[string]interface{}),
		logger:      zap.NewNop(),
	}

	for _, opt := range opts {
		opt(tool)
	}

	return tool
}

// Execute runs the tool with the given parameters
func (t *FunctionTool) Execute(ctx context.Context, params map[string]interface{}) *ToolResult {
	start := time.Now()
	result := &ToolResult{
		Metadata: make(map[string]interface{}),
	}

	// Create timeout context
	timeout := t.Timeout
	if timeout <= 0 {
		timeout = 30 * time.Second
	}
	execCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	// Validate parameters
	if err := t.validateParams(params); err != nil {
		result.Success = false
		result.Error = fmt.Sprintf("parameter validation failed: %v", err)
		result.Duration = time.Since(start)
		return result
	}

	// Execute with retries
	var lastErr error
	maxAttempts := t.RetryCount + 1

	for attempt := 0; attempt < maxAttempts; attempt++ {
		// Check context
		if execCtx.Err() != nil {
			result.Success = false
			result.Error = execCtx.Err().Error()
			result.Duration = time.Since(start)
			return result
		}

		// Execute handler
		data, err := t.Handler(execCtx, params)
		if err == nil {
			result.Success = true
			result.Data = data
			result.Duration = time.Since(start)
			result.Metadata["attempts"] = attempt + 1
			return result
		}

		lastErr = err

		// Check if error is retryable
		if !t.isRetryableError(err) {
			break
		}

		// Wait before retry
		if attempt < maxAttempts-1 {
			delay := t.getRetryDelay(attempt)
			select {
			case <-time.After(delay):
			case <-execCtx.Done():
				break
			}
		}
	}

	result.Success = false
	result.Error = lastErr.Error()
	result.Duration = time.Since(start)
	return result
}

// validateParams validates the input parameters against the schema
func (t *FunctionTool) validateParams(params map[string]interface{}) error {
	// Check required parameters
	for _, req := range t.Required {
		if _, ok := params[req]; !ok {
			return fmt.Errorf("required parameter '%s' is missing", req)
		}
	}

	// Additional schema validation could be added here
	return nil
}

// isRetryableError determines if an error should trigger a retry
func (t *FunctionTool) isRetryableError(err error) bool {
	if err == nil {
		return false
	}

	// Context errors are not retryable
	if err == context.Canceled || err == context.DeadlineExceeded {
		return false
	}

	return true
}

// getRetryDelay calculates the delay before retry
func (t *FunctionTool) getRetryDelay(attempt int) time.Duration {
	// Exponential backoff: 100ms, 200ms, 400ms
	delay := time.Duration(100*(1<<attempt)) * time.Millisecond
	maxDelay := 5 * time.Second
	if delay > maxDelay {
		delay = maxDelay
	}
	return delay
}

// ToADKFormat converts the tool to ADK-compatible format
func (t *FunctionTool) ToADKFormat() map[string]interface{} {
	return map[string]interface{}{
		"type": "function",
		"function": map[string]interface{}{
			"name":        t.Name,
			"description": t.Description,
			"parameters": map[string]interface{}{
				"type":       "object",
				"properties": t.Parameters,
				"required":   t.Required,
			},
		},
	}
}

// ToolRegistry manages all registered tools
type ToolRegistry struct {
	tools   map[string]*FunctionTool
	logger  *zap.Logger
	hooks   *hooks.Registry
}

// NewToolRegistry creates a new tool registry
func NewToolRegistry(logger *zap.Logger, hooksRegistry *hooks.Registry) *ToolRegistry {
	if logger == nil {
		logger = zap.NewNop()
	}
	return &ToolRegistry{
		tools:  make(map[string]*FunctionTool),
		logger: logger,
		hooks:  hooksRegistry,
	}
}

// Register registers a new tool
func (r *ToolRegistry) Register(tool *FunctionTool) error {
	if tool == nil {
		return fmt.Errorf("tool cannot be nil")
	}
	if tool.Name == "" {
		return fmt.Errorf("tool name is required")
	}
	if tool.Handler == nil {
		return fmt.Errorf("tool handler is required")
	}

	if _, exists := r.tools[tool.Name]; exists {
		return fmt.Errorf("tool '%s' already registered", tool.Name)
	}

	// Set hooks registry if not set
	if tool.hooksRegistry == nil && r.hooks != nil {
		tool.hooksRegistry = r.hooks
	}

	// Set logger if not set
	if tool.logger == nil {
		tool.logger = r.logger
	}

	r.tools[tool.Name] = tool

	r.logger.Info("tool registered",
		zap.String("tool_name", tool.Name),
		zap.String("description", tool.Description),
	)

	return nil
}

// Unregister removes a tool
func (r *ToolRegistry) Unregister(name string) error {
	if _, exists := r.tools[name]; !exists {
		return fmt.Errorf("tool '%s' not found", name)
	}

	delete(r.tools, name)
	r.logger.Info("tool unregistered", zap.String("tool_name", name))
	return nil
}

// Get retrieves a tool by name
func (r *ToolRegistry) Get(name string) (*FunctionTool, bool) {
	tool, ok := r.tools[name]
	return tool, ok
}

// GetAll returns all registered tools
func (r *ToolRegistry) GetAll() map[string]*FunctionTool {
	result := make(map[string]*FunctionTool)
	for k, v := range r.tools {
		result[k] = v
	}
	return result
}

// Execute runs a tool by name
func (r *ToolRegistry) Execute(ctx context.Context, name string, params map[string]interface{}) *ToolResult {
	tool, ok := r.tools[name]
	if !ok {
		return &ToolResult{
			Success: false,
			Error:   fmt.Sprintf("tool '%s' not found", name),
		}
	}

	return tool.Execute(ctx, params)
}

// GetToolSchemas returns all tool schemas in ADK format
func (r *ToolRegistry) GetToolSchemas() []map[string]interface{} {
	schemas := make([]map[string]interface{}, 0, len(r.tools))
	for _, tool := range r.tools {
		schemas = append(schemas, tool.ToADKFormat())
	}
	return schemas
}

// WrapGoFunc wraps a Go function as an ADK FunctionTool
// The function must have the signature: func(context.Context, InputType) (OutputType, error)
func WrapGoFunc(name string, fn interface{}, opts ...ToolOption) (*FunctionTool, error) {
	// Validate function type
	fnType := reflect.TypeOf(fn)
	if fnType.Kind() != reflect.Func {
		return nil, fmt.Errorf("fn must be a function")
	}

	if fnType.NumIn() != 2 || fnType.NumOut() != 2 {
		return nil, fmt.Errorf("fn must have signature: func(context.Context, InputType) (OutputType, error)")
	}

	// Check first input is context.Context
	if !fnType.In(0).Implements(reflect.TypeOf((*context.Context)(nil)).Elem()) {
		return nil, fmt.Errorf("first parameter must be context.Context")
	}

	// Check second output is error
	errorType := reflect.TypeOf((*error)(nil)).Elem()
	if !fnType.Out(1).Implements(errorType) {
		return nil, fmt.Errorf("second return value must be error")
	}

	// Extract input type for schema generation
	inputType := fnType.In(1)
	schema := generateSchemaFromType(inputType)

	// Create handler
	handler := func(ctx context.Context, params map[string]interface{}) (interface{}, error) {
		// Convert params to input type
		input := reflect.New(inputType).Interface()
		if err := mapToStruct(params, input); err != nil {
			return nil, fmt.Errorf("failed to convert params: %w", err)
		}

		// Call the function
		args := []reflect.Value{
			reflect.ValueOf(ctx),
			reflect.ValueOf(input).Elem(),
		}
		results := reflect.ValueOf(fn).Call(args)

		// Extract results
		output := results[0].Interface()
		err, _ := results[1].Interface().(error)

		return output, err
	}

	// Add schema to options
	opts = append([]ToolOption{WithToolParameters(schema)}, opts...)

	return NewFunctionTool(name, handler, opts...), nil
}

// generateSchemaFromType generates a JSON Schema from a Go type
func generateSchemaFromType(t reflect.Type) map[string]interface{} {
	schema := make(map[string]interface{})

	switch t.Kind() {
	case reflect.String:
		schema["type"] = "string"
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		schema["type"] = "integer"
	case reflect.Float32, reflect.Float64:
		schema["type"] = "number"
	case reflect.Bool:
		schema["type"] = "boolean"
	case reflect.Slice, reflect.Array:
		schema["type"] = "array"
		schema["items"] = generateSchemaFromType(t.Elem())
	case reflect.Map:
		schema["type"] = "object"
		schema["additionalProperties"] = generateSchemaFromType(t.Elem())
	case reflect.Struct:
		schema["type"] = "object"
		properties := make(map[string]interface{})
		required := make([]string, 0)

		for i := 0; i < t.NumField(); i++ {
			field := t.Field(i)
			jsonTag := field.Tag.Get("json")
			if jsonTag == "" || jsonTag == "-" {
				continue
			}

			// Parse json tag
			name := jsonTag
			if idx := len(jsonTag); idx > 0 {
				for j, c := range jsonTag {
					if c == ',' {
						name = jsonTag[:j]
						break
					}
				}
			}

			properties[name] = generateSchemaFromType(field.Type)

			// Check if required (no omitempty)
			if !containsOmitEmpty(jsonTag) {
				required = append(required, name)
			}
		}

		schema["properties"] = properties
		if len(required) > 0 {
			schema["required"] = required
		}
	case reflect.Ptr:
		return generateSchemaFromType(t.Elem())
	default:
		schema["type"] = "object"
	}

	return schema
}

// containsOmitEmpty checks if the json tag contains omitempty
func containsOmitEmpty(tag string) bool {
	for i := 0; i < len(tag); i++ {
		if tag[i] == ',' {
			return tag[i+1:] == "omitempty" || len(tag) > i+9 && tag[i+1:i+10] == "omitempty,"
		}
	}
	return false
}

// mapToStruct converts a map to a struct using JSON marshaling
func mapToStruct(m map[string]interface{}, out interface{}) error {
	data, err := json.Marshal(m)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, out)
}

// MustWrapGoFunc wraps a Go function or panics
func MustWrapGoFunc(name string, fn interface{}, opts ...ToolOption) *FunctionTool {
	tool, err := WrapGoFunc(name, fn, opts...)
	if err != nil {
		panic(err)
	}
	return tool
}

// ToolBuilder provides a fluent interface for building tools
type ToolBuilder struct {
	tool *FunctionTool
}

// NewToolBuilder creates a new tool builder
func NewToolBuilder(name string) *ToolBuilder {
	return &ToolBuilder{
		tool: &FunctionTool{
			Name:      name,
			Timeout:   30 * time.Second,
			RetryCount: 2,
			Metadata:  make(map[string]interface{}),
		},
	}
}

// WithDescription sets the description
func (b *ToolBuilder) WithDescription(desc string) *ToolBuilder {
	b.tool.Description = desc
	return b
}

// WithHandler sets the handler function
func (b *ToolBuilder) WithHandler(handler ToolHandler) *ToolBuilder {
	b.tool.Handler = handler
	return b
}

// WithStringParam adds a string parameter
func (b *ToolBuilder) WithStringParam(name, desc string, required bool) *ToolBuilder {
	if b.tool.Parameters == nil {
		b.tool.Parameters = make(map[string]interface{})
	}
	b.tool.Parameters[name] = map[string]interface{}{
		"type":        "string",
		"description": desc,
	}
	if required {
		b.tool.Required = append(b.tool.Required, name)
	}
	return b
}

// WithNumberParam adds a number parameter
func (b *ToolBuilder) WithNumberParam(name, desc string, required bool) *ToolBuilder {
	if b.tool.Parameters == nil {
		b.tool.Parameters = make(map[string]interface{})
	}
	b.tool.Parameters[name] = map[string]interface{}{
		"type":        "number",
		"description": desc,
	}
	if required {
		b.tool.Required = append(b.tool.Required, name)
	}
	return b
}

// WithIntegerParam adds an integer parameter
func (b *ToolBuilder) WithIntegerParam(name, desc string, required bool) *ToolBuilder {
	if b.tool.Parameters == nil {
		b.tool.Parameters = make(map[string]interface{})
	}
	b.tool.Parameters[name] = map[string]interface{}{
		"type":        "integer",
		"description": desc,
	}
	if required {
		b.tool.Required = append(b.tool.Required, name)
	}
	return b
}

// WithBooleanParam adds a boolean parameter
func (b *ToolBuilder) WithBooleanParam(name, desc string, required bool) *ToolBuilder {
	if b.tool.Parameters == nil {
		b.tool.Parameters = make(map[string]interface{})
	}
	b.tool.Parameters[name] = map[string]interface{}{
		"type":        "boolean",
		"description": desc,
	}
	if required {
		b.tool.Required = append(b.tool.Required, name)
	}
	return b
}

// WithObjectParam adds an object parameter
func (b *ToolBuilder) WithObjectParam(name, desc string, properties map[string]interface{}, required bool) *ToolBuilder {
	if b.tool.Parameters == nil {
		b.tool.Parameters = make(map[string]interface{})
	}
	b.tool.Parameters[name] = map[string]interface{}{
		"type":        "object",
		"description": desc,
		"properties":  properties,
	}
	if required {
		b.tool.Required = append(b.tool.Required, name)
	}
	return b
}

// WithArrayParam adds an array parameter
func (b *ToolBuilder) WithArrayParam(name, desc string, itemType string, required bool) *ToolBuilder {
	if b.tool.Parameters == nil {
		b.tool.Parameters = make(map[string]interface{})
	}
	b.tool.Parameters[name] = map[string]interface{}{
		"type":        "array",
		"description": desc,
		"items": map[string]interface{}{
			"type": itemType,
		},
	}
	if required {
		b.tool.Required = append(b.tool.Required, name)
	}
	return b
}

// WithTimeout sets the timeout
func (b *ToolBuilder) WithTimeout(timeout time.Duration) *ToolBuilder {
	b.tool.Timeout = timeout
	return b
}

// WithRetry sets the retry count
func (b *ToolBuilder) WithRetry(count int) *ToolBuilder {
	b.tool.RetryCount = count
	return b
}

// WithMetadata sets metadata
func (b *ToolBuilder) WithMetadata(key string, value interface{}) *ToolBuilder {
	b.tool.Metadata[key] = value
	return b
}

// Build builds the tool
func (b *ToolBuilder) Build() (*FunctionTool, error) {
	if b.tool.Name == "" {
		return nil, fmt.Errorf("tool name is required")
	}
	if b.tool.Handler == nil {
		return nil, fmt.Errorf("tool handler is required")
	}
	return b.tool, nil
}

// MustBuild builds the tool or panics
func (b *ToolBuilder) MustBuild() *FunctionTool {
	tool, err := b.Build()
	if err != nil {
		panic(err)
	}
	return tool
}
