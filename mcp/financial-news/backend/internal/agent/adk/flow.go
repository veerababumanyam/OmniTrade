package adk

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/omnitrade/backend/internal/agent/hooks"
	"go.uber.org/zap"
)

// FlowDefinition defines a Genkit flow for agent orchestration
type FlowDefinition struct {
	// Name is the unique flow name
	Name string `json:"name"`

	// Description explains what the flow does
	Description string `json:"description"`

	// InputSchema defines the expected input schema
	InputSchema map[string]interface{} `json:"input_schema"`

	// OutputSchema defines the expected output schema
	OutputSchema map[string]interface{} `json:"output_schema"`

	// Steps are the execution steps in the flow
	Steps []FlowStep `json:"steps"`

	// Timeout for the entire flow
	Timeout time.Duration `json:"timeout"`

	// RetryPolicy defines how to handle failures
	RetryPolicy *RetryPolicy `json:"retry_policy,omitempty"`
}

// FlowStep represents a single step in a flow
type FlowStep struct {
	// ID is the step identifier
	ID string `json:"id"`

	// Name is the human-readable step name
	Name string `json:"name"`

	// AgentType is the agent to invoke (if this step runs an agent)
	AgentType AgentType `json:"agent_type,omitempty"`

	// Tool is the tool to invoke (if this step runs a tool)
	Tool string `json:"tool,omitempty"`

	// Condition is an optional condition for executing this step
	Condition string `json:"condition,omitempty"`

	// TransformInput is an optional input transformation
	TransformInput string `json:"transform_input,omitempty"`

	// TransformOutput is an optional output transformation
	TransformOutput string `json:"transform_output,omitempty"`

	// Parallel indicates if this step should run in parallel with siblings
	Parallel bool `json:"parallel"`

	// Timeout for this step
	Timeout time.Duration `json:"timeout,omitempty"`

	// OnError defines error handling behavior
	OnError ErrorHandling `json:"on_error,omitempty"`
}

// ErrorHandling defines how to handle errors in a step
type ErrorHandling struct {
	// Strategy is the error handling strategy
	Strategy string `json:"strategy"` // continue, stop, retry

	// MaxRetries is the maximum number of retries
	MaxRetries int `json:"max_retries,omitempty"`

	// FallbackValue is the value to use if the step fails
	FallbackValue interface{} `json:"fallback_value,omitempty"`
}

// RetryPolicy defines retry behavior for flows
type RetryPolicy struct {
	// MaxRetries is the maximum number of retries
	MaxRetries int `json:"max_retries"`

	// InitialDelay is the initial retry delay
	InitialDelay time.Duration `json:"initial_delay"`

	// MaxDelay is the maximum retry delay
	MaxDelay time.Duration `json:"max_delay"`

	// Multiplier is the backoff multiplier
	Multiplier float64 `json:"multiplier"`
}

// FlowExecution represents a flow execution instance
type FlowExecution struct {
	// ID is the execution ID
	ID string `json:"id"`

	// FlowName is the name of the flow being executed
	FlowName string `json:"flow_name"`

	// Status is the current execution status
	Status FlowStatus `json:"status"`

	// StartTime is when execution started
	StartTime time.Time `json:"start_time"`

	// EndTime is when execution completed
	EndTime time.Time `json:"end_time,omitempty"`

	// Input is the flow input
	Input map[string]interface{} `json:"input"`

	// Output is the flow output
	Output map[string]interface{} `json:"output,omitempty"`

	// Error is the error message if failed
	Error string `json:"error,omitempty"`

	// StepResults contains results from each step
	StepResults map[string]*StepResult `json:"step_results"`

	// Metadata contains additional execution information
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// FlowStatus represents the status of a flow execution
type FlowStatus string

const (
	FlowStatusPending   FlowStatus = "pending"
	FlowStatusRunning   FlowStatus = "running"
	FlowStatusComplete  FlowStatus = "complete"
	FlowStatusFailed    FlowStatus = "failed"
	FlowStatusCancelled FlowStatus = "cancelled"
)

// StepResult represents the result of a step execution
type StepResult struct {
	// StepID is the step identifier
	StepID string `json:"step_id"`

	// Status is the step status
	Status FlowStatus `json:"status"`

	// StartTime is when the step started
	StartTime time.Time `json:"start_time"`

	// EndTime is when the step completed
	EndTime time.Time `json:"end_time"`

	// Output is the step output
	Output interface{} `json:"output,omitempty"`

	// Error is the error message if failed
	Error string `json:"error,omitempty"`

	// Duration is the execution duration
	Duration time.Duration `json:"duration"`
}

// FlowRegistry manages all flow definitions
type FlowRegistry struct {
	flows       map[string]*FlowDefinition
	agentPool   *AgentPool
	toolRegistry *ToolRegistry
	hookRegistry *hooks.Registry
	logger      *zap.Logger
	mu          sync.RWMutex
}

// NewFlowRegistry creates a new flow registry
func NewFlowRegistry(agentPool *AgentPool, toolRegistry *ToolRegistry, hookRegistry *hooks.Registry, logger *zap.Logger) *FlowRegistry {
	if logger == nil {
		logger = zap.NewNop()
	}

	registry := &FlowRegistry{
		flows:        make(map[string]*FlowDefinition),
		agentPool:    agentPool,
		toolRegistry: toolRegistry,
		hookRegistry: hookRegistry,
		logger:       logger,
	}

	// Register default flows
	registry.registerDefaultFlows()

	return registry
}

// registerDefaultFlows registers the default OmniTrade flows
func (r *FlowRegistry) registerDefaultFlows() {
	// Multi-Agent Analysis Flow
	r.Register(&FlowDefinition{
		Name:        "multi_agent_analysis",
		Description: "Runs all analyst agents in parallel and synthesizes results",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"symbol":     map[string]interface{}{"type": "string"},
				"timeframe":  map[string]interface{}{"type": "string"},
				"query":      map[string]interface{}{"type": "string"},
				"context":    map[string]interface{}{"type": "object"},
			},
			"required": []string{"symbol"},
		},
		OutputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"analysis":   map[string]interface{}{"type": "object"},
				"signals":    map[string]interface{}{"type": "array"},
				"confidence": map[string]interface{}{"type": "number"},
				"proposal":   map[string]interface{}{"type": "object"},
			},
		},
		Steps: []FlowStep{
			{
				ID:        "parallel_analysis",
				Name:      "Parallel Analyst Execution",
				Parallel:  true,
				Timeout:   60 * time.Second,
				OnError:   ErrorHandling{Strategy: "continue"},
			},
			{
				ID:        "risk_assessment",
				Name:      "Risk Assessment",
				AgentType: AgentTypeRiskManager,
				Timeout:   30 * time.Second,
				OnError:   ErrorHandling{Strategy: "stop"},
			},
			{
				ID:        "portfolio_decision",
				Name:      "Portfolio Decision",
				AgentType: AgentTypePortfolioManager,
				Timeout:   45 * time.Second,
				OnError:   ErrorHandling{Strategy: "stop"},
			},
		},
		Timeout: 180 * time.Second,
	})

	// Single Agent Flow
	r.Register(&FlowDefinition{
		Name:        "single_agent_analysis",
		Description: "Runs a single agent for targeted analysis",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"symbol":     map[string]interface{}{"type": "string"},
				"agent_type": map[string]interface{}{"type": "string"},
				"query":      map[string]interface{}{"type": "string"},
				"context":    map[string]interface{}{"type": "object"},
			},
			"required": []string{"symbol", "agent_type"},
		},
		OutputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"analysis":   map[string]interface{}{"type": "object"},
				"confidence": map[string]interface{}{"type": "number"},
				"reasoning":  map[string]interface{}{"type": "string"},
			},
		},
		Steps: []FlowStep{
			{
				ID:        "agent_execution",
				Name:      "Agent Execution",
				Timeout:   60 * time.Second,
				OnError:   ErrorHandling{Strategy: "stop"},
			},
		},
		Timeout: 90 * time.Second,
	})

	// Trade Proposal Flow
	r.Register(&FlowDefinition{
		Name:        "trade_proposal_flow",
		Description: "Generates a trade proposal with full analysis",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"symbol":       map[string]interface{}{"type": "string"},
				"side":         map[string]interface{}{"type": "string"},
				"quantity":     map[string]interface{}{"type": "string"},
				"strategy":     map[string]interface{}{"type": "string"},
				"correlation_id": map[string]interface{}{"type": "string"},
			},
			"required": []string{"symbol", "side"},
		},
		OutputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"proposal_id": map[string]interface{}{"type": "string"},
				"status":      map[string]interface{}{"type": "string"},
				"confidence":  map[string]interface{}{"type": "number"},
			},
		},
		Steps: []FlowStep{
			{
				ID:        "analysis",
				Name:      "Multi-Agent Analysis",
				Parallel:  true,
				Timeout:   60 * time.Second,
			},
			{
				ID:        "risk_check",
				Name:      "Risk Check",
				AgentType: AgentTypeRiskManager,
				Timeout:   20 * time.Second,
			},
			{
				ID:        "proposal_creation",
				Name:      "Create Proposal",
				AgentType: AgentTypePortfolioManager,
				Timeout:   30 * time.Second,
			},
		},
		Timeout: 120 * time.Second,
		RetryPolicy: &RetryPolicy{
			MaxRetries:   2,
			InitialDelay: 1 * time.Second,
			MaxDelay:     10 * time.Second,
			Multiplier:   2.0,
		},
	})
}

// Register registers a new flow definition
func (r *FlowRegistry) Register(flow *FlowDefinition) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if flow.Name == "" {
		return fmt.Errorf("flow name is required")
	}

	if _, exists := r.flows[flow.Name]; exists {
		return fmt.Errorf("flow '%s' already registered", flow.Name)
	}

	if flow.Timeout <= 0 {
		flow.Timeout = 120 * time.Second
	}

	r.flows[flow.Name] = flow

	r.logger.Info("flow registered",
		zap.String("flow_name", flow.Name),
		zap.Int("steps", len(flow.Steps)),
	)

	return nil
}

// Get retrieves a flow definition by name
func (r *FlowRegistry) Get(name string) (*FlowDefinition, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	flow, ok := r.flows[name]
	return flow, ok
}

// ExecuteFlow executes a flow by name
func (r *FlowRegistry) ExecuteFlow(ctx context.Context, flowName string, input map[string]interface{}) (*FlowExecution, error) {
	flow, ok := r.Get(flowName)
	if !ok {
		return nil, fmt.Errorf("flow '%s' not found", flowName)
	}

	return r.Execute(ctx, flow, input)
}

// Execute executes a flow definition
func (r *FlowRegistry) Execute(ctx context.Context, flow *FlowDefinition, input map[string]interface{}) (*FlowExecution, error) {
	execution := &FlowExecution{
		ID:          generateFlowID(),
		FlowName:    flow.Name,
		Status:      FlowStatusPending,
		StartTime:   time.Now(),
		Input:       input,
		StepResults: make(map[string]*StepResult),
		Metadata:    make(map[string]interface{}),
	}

	// Create timeout context
	timeout := flow.Timeout
	if timeout <= 0 {
		timeout = 120 * time.Second
	}
	execCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	// Execute before Genkit flow hooks
	if r.hookRegistry != nil {
		hookIntegrator := NewADKHookIntegrator(r.hookRegistry, r.logger)
		payload := &hooks.BasePayload{
			Data: map[string]interface{}{
				"flow_name": flow.Name,
				"input":     input,
			},
		}
		event := hooks.NewEventWithContext(execCtx, hooks.EventBeforeGenkitFlow, "flow_registry", payload)
		executor := hooks.NewExecutor(hooks.ExecutorConfig{
			Registry: r.hookRegistry,
			Logger:   r.logger,
		})
		executor.Execute(execCtx, event)
	}

	// Update status
	execution.Status = FlowStatusRunning

	// Execute steps
	for _, step := range flow.Steps {
		select {
		case <-execCtx.Done():
			execution.Status = FlowStatusCancelled
			execution.Error = execCtx.Err().Error()
			execution.EndTime = time.Now()
			return execution, execCtx.Err()
		default:
		}

		result := r.executeStep(execCtx, step, execution)

		execution.StepResults[step.ID] = result

		if result.Status == FlowStatusFailed && step.OnError.Strategy == "stop" {
			execution.Status = FlowStatusFailed
			execution.Error = result.Error
			execution.EndTime = time.Now()
			return execution, fmt.Errorf("step %s failed: %s", step.ID, result.Error)
		}
	}

	// Build final output
	execution.Output = r.buildOutput(execution)
	execution.Status = FlowStatusComplete
	execution.EndTime = time.Now()

	// Execute after Genkit flow hooks
	if r.hookRegistry != nil {
		hookIntegrator := NewADKHookIntegrator(r.hookRegistry, r.logger)
		payload := &hooks.BasePayload{
			Data: map[string]interface{}{
				"flow_name": flow.Name,
				"output":    execution.Output,
				"status":    string(execution.Status),
			},
		}
		event := hooks.NewEventWithContext(execCtx, hooks.EventAfterGenkitFlow, "flow_registry", payload)
		executor := hooks.NewExecutor(hooks.ExecutorConfig{
			Registry: r.hookRegistry,
			Logger:   r.logger,
		})
		executor.Execute(execCtx, event)
	}

	r.logger.Info("flow execution complete",
		zap.String("flow_name", flow.Name),
		zap.String("execution_id", execution.ID),
		zap.String("status", string(execution.Status)),
		zap.Duration("duration", execution.EndTime.Sub(execution.StartTime)),
	)

	return execution, nil
}

// executeStep executes a single step in the flow
func (r *FlowRegistry) executeStep(ctx context.Context, step FlowStep, execution *FlowExecution) *StepResult {
	result := &StepResult{
		StepID:    step.ID,
		Status:    FlowStatusPending,
		StartTime: time.Now(),
	}

	// Handle parallel steps
	if step.Parallel {
		return r.executeParallelSteps(ctx, step, execution)
	}

	// Handle agent step
	if step.AgentType != "" {
		return r.executeAgentStep(ctx, step, execution)
	}

	// Handle tool step
	if step.Tool != "" {
		return r.executeToolStep(ctx, step, execution)
	}

	// Generic step execution
	result.Status = FlowStatusComplete
	result.Output = map[string]interface{}{"step": step.ID, "status": "completed"}
	result.EndTime = time.Now()
	result.Duration = result.EndTime.Sub(result.StartTime)

	return result
}

// executeParallelSteps executes parallel analyst steps
func (r *FlowRegistry) executeParallelSteps(ctx context.Context, step FlowStep, execution *FlowExecution) *StepResult {
	result := &StepResult{
		StepID:    step.ID,
		Status:    FlowStatusRunning,
		StartTime: time.Now(),
	}

	// Get all analyst agents
	analystTypes := []AgentType{
		AgentTypeFundamentalAnalyst,
		AgentTypeTechnicalAnalyst,
		AgentTypeSentimentAnalyst,
	}

	inputs := make(map[AgentType]*AgentInput)
	for _, at := range analystTypes {
		inputs[at] = &AgentInput{
			Symbol:       getString(execution.Input, "symbol"),
			Query:        getString(execution.Input, "query"),
			Context:      getMap(execution.Input, "context"),
			Timeframe:    getString(execution.Input, "timeframe"),
			CorrelationID: execution.ID,
		}
	}

	// Execute in parallel
	outputs := r.agentPool.ExecuteParallel(ctx, inputs)

	// Collect results
	analysisResults := make(map[string]interface{})
	for at, output := range outputs {
		analysisResults[string(at)] = output
	}

	result.Status = FlowStatusComplete
	result.Output = analysisResults
	result.EndTime = time.Now()
	result.Duration = result.EndTime.Sub(result.StartTime)

	return result
}

// executeAgentStep executes an agent step
func (r *FlowRegistry) executeAgentStep(ctx context.Context, step FlowStep, execution *FlowExecution) *StepResult {
	result := &StepResult{
		StepID:    step.ID,
		Status:    FlowStatusRunning,
		StartTime: time.Now(),
	}

	agent, ok := r.agentPool.GetAgent(step.AgentType)
	if !ok {
		result.Status = FlowStatusFailed
		result.Error = fmt.Sprintf("agent %s not found", step.AgentType)
		result.EndTime = time.Now()
		return result
	}

	input := &AgentInput{
		Symbol:        getString(execution.Input, "symbol"),
		Query:         getString(execution.Input, "query"),
		Context:       getMap(execution.Input, "context"),
		Timeframe:     getString(execution.Input, "timeframe"),
		CorrelationID: execution.ID,
	}

	// Add previous step results to context
	if input.Context == nil {
		input.Context = make(map[string]interface{})
	}
	for stepID, stepResult := range execution.StepResults {
		input.Context[stepID] = stepResult.Output
	}

	output, err := agent.Run(ctx, input)
	if err != nil {
		result.Status = FlowStatusFailed
		result.Error = err.Error()
	} else {
		result.Status = FlowStatusComplete
		result.Output = output
	}

	result.EndTime = time.Now()
	result.Duration = result.EndTime.Sub(result.StartTime)

	return result
}

// executeToolStep executes a tool step
func (r *FlowRegistry) executeToolStep(ctx context.Context, step FlowStep, execution *FlowExecution) *StepResult {
	result := &StepResult{
		StepID:    step.ID,
		Status:    FlowStatusRunning,
		StartTime: time.Now(),
	}

	params := getMap(execution.Input, "params")
	if params == nil {
		params = execution.Input
	}

	toolResult := r.toolRegistry.Execute(ctx, step.Tool, params)

	if !toolResult.Success {
		result.Status = FlowStatusFailed
		result.Error = toolResult.Error
	} else {
		result.Status = FlowStatusComplete
		result.Output = toolResult.Data
	}

	result.EndTime = time.Now()
	result.Duration = result.EndTime.Sub(result.StartTime)

	return result
}

// buildOutput builds the final output from step results
func (r *FlowRegistry) buildOutput(execution *FlowExecution) map[string]interface{} {
	output := make(map[string]interface{})

	// Collect analysis from parallel step
	if parallelResult, ok := execution.StepResults["parallel_analysis"]; ok {
		if analyses, ok := parallelResult.Output.(map[string]interface{}); ok {
			output["analyses"] = analyses

			// Calculate combined confidence
			totalConf := 0.0
			count := 0
			for _, a := range analyses {
				if agentOutput, ok := a.(*AgentOutput); ok {
					totalConf += agentOutput.Confidence
					count++
				}
			}
			if count > 0 {
				output["confidence"] = totalConf / float64(count)
			}
		}
	}

	// Add risk assessment
	if riskResult, ok := execution.StepResults["risk_assessment"]; ok {
		output["risk_assessment"] = riskResult.Output
	}

	// Add portfolio decision
	if portfolioResult, ok := execution.StepResults["portfolio_decision"]; ok {
		output["portfolio_decision"] = portfolioResult.Output

		// Extract trade proposal if present
		if agentOutput, ok := portfolioResult.Output.(*AgentOutput); ok {
			if agentOutput.Confidence >= 0.7 {
				output["trade_recommended"] = true
				output["trade_confidence"] = agentOutput.Confidence
			}
		}
	}

	// Add metadata
	output["execution_id"] = execution.ID
	output["duration_ms"] = execution.EndTime.Sub(execution.StartTime).Milliseconds()

	return output
}

// Helper functions

func generateFlowID() string {
	return fmt.Sprintf("flow_%d", time.Now().UnixNano())
}

func getString(m map[string]interface{}, key string) string {
	if v, ok := m[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

func getMap(m map[string]interface{}, key string) map[string]interface{} {
	if v, ok := m[key]; ok {
		if mm, ok := v.(map[string]interface{}); ok {
			return mm
		}
	}
	return nil
}

// DefineFlow creates a new flow definition with a builder pattern
func DefineFlow(name string) *FlowBuilder {
	return &FlowBuilder{
		flow: &FlowDefinition{
			Name:        name,
			InputSchema: make(map[string]interface{}),
			OutputSchema: make(map[string]interface{}),
			Steps:       make([]FlowStep, 0),
			Metadata:    make(map[string]interface{}),
		},
	}
}

// FlowBuilder provides a fluent interface for building flows
type FlowBuilder struct {
	flow *FlowDefinition
}

// WithDescription sets the flow description
func (b *FlowBuilder) WithDescription(desc string) *FlowBuilder {
	b.flow.Description = desc
	return b
}

// WithInputSchema sets the input schema
func (b *FlowBuilder) WithInputSchema(schema map[string]interface{}) *FlowBuilder {
	b.flow.InputSchema = schema
	return b
}

// WithOutputSchema sets the output schema
func (b *FlowBuilder) WithOutputSchema(schema map[string]interface{}) *FlowBuilder {
	b.flow.OutputSchema = schema
	return b
}

// WithTimeout sets the flow timeout
func (b *FlowBuilder) WithTimeout(timeout time.Duration) *FlowBuilder {
	b.flow.Timeout = timeout
	return b
}

// WithRetryPolicy sets the retry policy
func (b *FlowBuilder) WithRetryPolicy(maxRetries int, initialDelay, maxDelay time.Duration, multiplier float64) *FlowBuilder {
	b.flow.RetryPolicy = &RetryPolicy{
		MaxRetries:   maxRetries,
		InitialDelay: initialDelay,
		MaxDelay:     maxDelay,
		Multiplier:   multiplier,
	}
	return b
}

// AddStep adds a step to the flow
func (b *FlowBuilder) AddStep(step FlowStep) *FlowBuilder {
	b.flow.Steps = append(b.flow.Steps, step)
	return b
}

// AddAgentStep adds an agent execution step
func (b *FlowBuilder) AddAgentStep(id, name string, agentType AgentType, timeout time.Duration) *FlowBuilder {
	b.flow.Steps = append(b.flow.Steps, FlowStep{
		ID:        id,
		Name:      name,
		AgentType: agentType,
		Timeout:   timeout,
	})
	return b
}

// AddParallelStep adds a parallel execution step
func (b *FlowBuilder) AddParallelStep(id, name string, timeout time.Duration) *FlowBuilder {
	b.flow.Steps = append(b.flow.Steps, FlowStep{
		ID:       id,
		Name:     name,
		Parallel: true,
		Timeout:  timeout,
	})
	return b
}

// AddToolStep adds a tool execution step
func (b *FlowBuilder) AddToolStep(id, name, tool string, timeout time.Duration) *FlowBuilder {
	b.flow.Steps = append(b.flow.Steps, FlowStep{
		ID:      id,
		Name:    name,
		Tool:    tool,
		Timeout: timeout,
	})
	return b
}

// Build returns the built flow definition
func (b *FlowBuilder) Build() *FlowDefinition {
	return b.flow
}

// Register registers the flow with a registry
func (b *FlowBuilder) Register(registry *FlowRegistry) error {
	return registry.Register(b.flow)
}

// FlowExecutor provides a simplified interface for executing flows
type FlowExecutor struct {
	registry *FlowRegistry
	logger   *zap.Logger
}

// NewFlowExecutor creates a new flow executor
func NewFlowExecutor(registry *FlowRegistry, logger *zap.Logger) *FlowExecutor {
	if logger == nil {
		logger = zap.NewNop()
	}
	return &FlowExecutor{
		registry: registry,
		logger:   logger,
	}
}

// RunAnalysis executes the multi-agent analysis flow
func (e *FlowExecutor) RunAnalysis(ctx context.Context, symbol string, options ...AnalysisOption) (*FlowExecution, error) {
	input := map[string]interface{}{
		"symbol": symbol,
	}

	// Apply options
	for _, opt := range options {
		opt(input)
	}

	return e.registry.ExecuteFlow(ctx, "multi_agent_analysis", input)
}

// RunTradeProposal executes the trade proposal flow
func (e *FlowExecutor) RunTradeProposal(ctx context.Context, symbol, side, quantity, strategy string) (*FlowExecution, error) {
	input := map[string]interface{}{
		"symbol":   symbol,
		"side":     side,
		"quantity": quantity,
		"strategy": strategy,
	}

	return e.registry.ExecuteFlow(ctx, "trade_proposal_flow", input)
}

// RunSingleAgent executes a single agent analysis
func (e *FlowExecutor) RunSingleAgent(ctx context.Context, agentType AgentType, symbol string, query string) (*FlowExecution, error) {
	input := map[string]interface{}{
		"symbol":     symbol,
		"agent_type": string(agentType),
		"query":      query,
	}

	return e.registry.ExecuteFlow(ctx, "single_agent_analysis", input)
}

// AnalysisOption is an option for analysis execution
type AnalysisOption func(map[string]interface{})

// WithTimeframe sets the analysis timeframe
func WithTimeframe(timeframe string) AnalysisOption {
	return func(input map[string]interface{}) {
		input["timeframe"] = timeframe
	}
}

// WithQuery sets the analysis query
func WithQuery(query string) AnalysisOption {
	return func(input map[string]interface{}) {
		input["query"] = query
	}
}

// WithContext sets the analysis context
func WithContext(context map[string]interface{}) AnalysisOption {
	return func(input map[string]interface{}) {
		input["context"] = context
	}
}

// ToJSON converts a flow execution to JSON
func (e *FlowExecution) ToJSON() ([]byte, error) {
	return json.MarshalIndent(e, "", "  ")
}

// FromJSON loads a flow execution from JSON
func FromJSON(data []byte) (*FlowExecution, error) {
	var execution FlowExecution
	if err := json.Unmarshal(data, &execution); err != nil {
		return nil, err
	}
	return &execution, nil
}
