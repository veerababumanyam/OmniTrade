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

// AgentState represents the current state of an agent
type AgentState string

const (
	AgentStateIdle     AgentState = "idle"
	AgentStateRunning  AgentState = "running"
	AgentStatePaused   AgentState = "paused"
	AgentStateError    AgentState = "error"
	AgentStateComplete AgentState = "complete"
)

// AgentStatus contains the current status of an agent
type AgentStatus struct {
	ID           string                 `json:"id"`
	Type         AgentType              `json:"type"`
	State        AgentState             `json:"state"`
	LastRun      time.Time              `json:"last_run,omitempty"`
	LastSuccess  time.Time              `json:"last_success,omitempty"`
	LastError    string                 `json:"last_error,omitempty"`
	RunCount     int64                  `json:"run_count"`
	SuccessCount int64                  `json:"success_count"`
	ErrorCount   int64                  `json:"error_count"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
}

// AgentInput represents input to an agent
type AgentInput struct {
	// Symbol is the trading symbol being analyzed
	Symbol string `json:"symbol,omitempty"`

	// Query is a natural language query
	Query string `json:"query,omitempty"`

	// Context provides additional context for the analysis
	Context map[string]interface{} `json:"context,omitempty"`

	// Parameters are specific parameters for the agent
	Parameters map[string]interface{} `json:"parameters,omitempty"`

	// Timeframe is the analysis timeframe
	Timeframe string `json:"timeframe,omitempty"`

	// CorrelationID for tracing
	CorrelationID string `json:"correlation_id,omitempty"`
}

// AgentOutput represents output from an agent
type AgentOutput struct {
	// Success indicates if the agent execution was successful
	Success bool `json:"success"`

	// Data is the main output data
	Data map[string]interface{} `json:"data,omitempty"`

	// Confidence is the confidence level of the output
	Confidence float64 `json:"confidence"`

	// Reasoning explains the agent's reasoning
	Reasoning string `json:"reasoning,omitempty"`

	// Recommendations are actionable recommendations
	Recommendations []string `json:"recommendations,omitempty"`

	// Warnings are any warnings or caveats
	Warnings []string `json:"warnings,omitempty"`

	// Metadata contains additional output information
	Metadata map[string]interface{} `json:"metadata,omitempty"`

	// Duration is the execution duration
	Duration time.Duration `json:"duration"`

	// TokensUsed is the number of tokens consumed
	TokensUsed int `json:"tokens_used,omitempty"`

	// ModelUsed is the model that was used
	ModelUsed string `json:"model_used,omitempty"`

	// Error is the error message if failed
	Error string `json:"error,omitempty"`
}

// Agent is the interface for an ADK-based agent
type Agent interface {
	// ID returns the agent's unique identifier
	ID() string

	// Name returns the agent's name
	Name() string

	// Type returns the agent's type
	Type() AgentType

	// Description returns the agent's description
	Description() string

	// Config returns the agent's configuration
	Config() *AgentConfig

	// Status returns the agent's current status
	Status() *AgentStatus

	// Run executes the agent with the given input
	Run(ctx context.Context, input *AgentInput) (*AgentOutput, error)

	// RunWithTools executes the agent with tool access
	RunWithTools(ctx context.Context, input *AgentInput, tools []*FunctionTool) (*AgentOutput, error)

	// Pause pauses the agent
	Pause() error

	// Resume resumes the agent
	Resume() error

	// Reset resets the agent state
	Reset() error
}

// BaseAgent provides a base implementation of the Agent interface
type BaseAgent struct {
	config     *AgentConfig
	status     *AgentStatus
	tools      *ToolRegistry
	hooks      *ADKHookIntegrator
	logger     *zap.Logger
	mu         sync.RWMutex
}

// NewBaseAgent creates a new base agent
func NewBaseAgent(config *AgentConfig, tools *ToolRegistry, hookIntegrator *ADKHookIntegrator, logger *zap.Logger) *BaseAgent {
	if logger == nil {
		logger = zap.NewNop()
	}

	return &BaseAgent{
		config: config,
		status: &AgentStatus{
			ID:       config.ID,
			Type:     config.Type,
			State:    AgentStateIdle,
			Metadata: make(map[string]interface{}),
		},
		tools:  tools,
		hooks:  hookIntegrator,
		logger: logger,
	}
}

// ID returns the agent's unique identifier
func (a *BaseAgent) ID() string {
	return a.config.ID
}

// Name returns the agent's name
func (a *BaseAgent) Name() string {
	return a.config.Name
}

// Type returns the agent's type
func (a *BaseAgent) Type() AgentType {
	return a.config.Type
}

// Description returns the agent's description
func (a *BaseAgent) Description() string {
	return a.config.Description
}

// Config returns the agent's configuration
func (a *BaseAgent) Config() *AgentConfig {
	return a.config
}

// Status returns the agent's current status
func (a *BaseAgent) Status() *AgentStatus {
	a.mu.RLock()
	defer a.mu.RUnlock()

	// Return a copy
	status := *a.status
	status.Metadata = make(map[string]interface{})
	for k, v := range a.status.Metadata {
		status.Metadata[k] = v
	}
	return &status
}

// updateState updates the agent state
func (a *BaseAgent) updateState(state AgentState) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.status.State = state
}

// Run executes the agent with the given input
func (a *BaseAgent) Run(ctx context.Context, input *AgentInput) (*AgentOutput, error) {
	return a.RunWithTools(ctx, input, nil)
}

// RunWithTools executes the agent with tool access
func (a *BaseAgent) RunWithTools(ctx context.Context, input *AgentInput, tools []*FunctionTool) (*AgentOutput, error) {
	start := time.Now()

	// Update state
	a.updateState(AgentStateRunning)
	defer func() {
		a.mu.Lock()
		a.status.LastRun = time.Now()
		a.status.RunCount++
		a.mu.Unlock()
	}()

	// Execute before hooks
	if a.hooks != nil {
		inputMap, _ := json.Marshal(input)
		var inputMapDecoded map[string]interface{}
		json.Unmarshal(inputMap, &inputMapDecoded)

		hookResult, err := a.hooks.BeforeAgentRun(ctx, a.config.ID, a.config.Type, inputMapDecoded)
		if err != nil {
			a.logger.Error("before agent run hooks failed", zap.Error(err))
		}
		if hookResult != nil && hookResult.Stopped {
			a.updateState(AgentStateError)
			return nil, fmt.Errorf("agent run stopped by hooks: %s", hookResult.StopReason)
		}
	}

	// Create timeout context
	timeout := a.config.Timeout
	if timeout <= 0 {
		timeout = 60 * time.Second
	}
	runCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	// Execute the agent (this is a template - actual LLM integration would go here)
	output, err := a.executeAgent(runCtx, input, tools)

	duration := time.Since(start)

	// Update status
	a.mu.Lock()
	if err != nil {
		a.status.State = AgentStateError
		a.status.LastError = err.Error()
		a.status.ErrorCount++
	} else {
		a.status.State = AgentStateComplete
		a.status.LastSuccess = time.Now()
		a.status.SuccessCount++
	}
	a.mu.Unlock()

	// Execute after hooks
	if a.hooks != nil {
		var outputMap map[string]interface{}
		if output != nil {
			outputBytes, _ := json.Marshal(output)
			json.Unmarshal(outputBytes, &outputMap)
		}

		errMsg := ""
		if err != nil {
			errMsg = err.Error()
		}

		_, hookErr := a.hooks.AfterAgentRun(ctx, a.config.ID, a.config.Type, outputMap, duration, err == nil, errMsg)
		if hookErr != nil {
			a.logger.Error("after agent run hooks failed", zap.Error(hookErr))
		}
	}

	if err != nil {
		return nil, err
	}

	output.Duration = duration
	output.ModelUsed = a.config.Model.ModelID
	return output, nil
}

// executeAgent contains the actual agent execution logic
func (a *BaseAgent) executeAgent(ctx context.Context, input *AgentInput, tools []*FunctionTool) (*AgentOutput, error) {
	// This is a template implementation
	// In production, this would integrate with the actual LLM (Gemini/Claude)

	output := &AgentOutput{
		Success:        true,
		Data:           make(map[string]interface{}),
		Metadata:       make(map[string]interface{}),
		Recommendations: make([]string, 0),
		Warnings:       make([]string, 0),
	}

	// Build the prompt with system prompt and input
	systemPrompt := a.config.SystemPrompt

	// Log the execution
	a.logger.Info("executing agent",
		zap.String("agent_id", a.config.ID),
		zap.String("agent_type", string(a.config.Type)),
		zap.String("symbol", input.Symbol),
	)

	// Store input in metadata
	output.Metadata["input_symbol"] = input.Symbol
	output.Metadata["input_query"] = input.Query
	output.Metadata["system_prompt_length"] = len(systemPrompt)

	// Simulate agent reasoning based on type
	switch a.config.Type {
	case AgentTypeFundamentalAnalyst:
		output = a.executeFundamentalAnalysis(ctx, input, output)
	case AgentTypeTechnicalAnalyst:
		output = a.executeTechnicalAnalysis(ctx, input, output)
	case AgentTypeSentimentAnalyst:
		output = a.executeSentimentAnalysis(ctx, input, output)
	case AgentTypeRiskManager:
		output = a.executeRiskAssessment(ctx, input, output)
	case AgentTypePortfolioManager:
		output = a.executePortfolioDecision(ctx, input, output)
	default:
		return nil, fmt.Errorf("unknown agent type: %s", a.config.Type)
	}

	return output, nil
}

// executeFundamentalAnalysis performs fundamental analysis
func (a *BaseAgent) executeFundamentalAnalysis(ctx context.Context, input *AgentInput, output *AgentOutput) *AgentOutput {
	output.Data["analysis_type"] = "fundamental"
	output.Data["symbol"] = input.Symbol
	output.Confidence = 0.75 // Placeholder
	output.Reasoning = "Fundamental analysis based on financial statements, earnings, and valuation metrics."
	output.Recommendations = []string{
		"Review P/E ratio relative to sector peers",
		"Analyze revenue growth trends",
		"Check debt-to-equity ratio",
	}
	output.Metadata["analyst_type"] = "fundamental"
	return output
}

// executeTechnicalAnalysis performs technical analysis
func (a *BaseAgent) executeTechnicalAnalysis(ctx context.Context, input *AgentInput, output *AgentOutput) *AgentOutput {
	output.Data["analysis_type"] = "technical"
	output.Data["symbol"] = input.Symbol
	output.Confidence = 0.70 // Placeholder
	output.Reasoning = "Technical analysis based on price patterns, indicators, and momentum signals."
	output.Recommendations = []string{
		"Monitor RSI for overbought/oversold conditions",
		"Watch for MACD crossover signals",
		"Identify key support and resistance levels",
	}
	output.Metadata["analyst_type"] = "technical"
	return output
}

// executeSentimentAnalysis performs sentiment analysis
func (a *BaseAgent) executeSentimentAnalysis(ctx context.Context, input *AgentInput, output *AgentOutput) *AgentOutput {
	output.Data["analysis_type"] = "sentiment"
	output.Data["symbol"] = input.Symbol
	output.Confidence = 0.68 // Placeholder
	output.Reasoning = "Sentiment analysis based on news headlines, social media, and market commentary."
	output.Recommendations = []string{
		"Monitor news flow for sentiment shifts",
		"Track social media mentions",
		"Watch for analyst rating changes",
	}
	output.Metadata["analyst_type"] = "sentiment"
	return output
}

// executeRiskAssessment performs risk assessment
func (a *BaseAgent) executeRiskAssessment(ctx context.Context, input *AgentInput, output *AgentOutput) *AgentOutput {
	output.Data["analysis_type"] = "risk"
	output.Data["symbol"] = input.Symbol
	output.Confidence = 0.85 // Higher confidence for risk metrics
	output.Reasoning = "Risk assessment based on volatility, VaR, and portfolio correlation analysis."
	output.Recommendations = []string{
		"Monitor portfolio concentration",
		"Review position sizing",
		"Assess correlation with existing positions",
	}
	output.Warnings = []string{
		"Consider tail risk scenarios",
		"Review leverage exposure",
	}
	output.Metadata["analyst_type"] = "risk"
	return output
}

// executePortfolioDecision makes portfolio decisions
func (a *BaseAgent) executePortfolioDecision(ctx context.Context, input *AgentInput, output *AgentOutput) *AgentOutput {
	output.Data["analysis_type"] = "portfolio"
	output.Data["symbol"] = input.Symbol
	output.Confidence = 0.72 // Placeholder
	output.Reasoning = "Portfolio decision synthesizing inputs from all analyst agents."
	output.Recommendations = []string{
		"Consider position size based on conviction",
		"Set appropriate stop-loss levels",
		"Review portfolio balance",
	}
	output.Metadata["analyst_type"] = "portfolio"
	output.Metadata["decision_framework"] = "multi_agent_synthesis"
	return output
}

// Pause pauses the agent
func (a *BaseAgent) Pause() error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.status.State == AgentStateRunning {
		return fmt.Errorf("cannot pause agent while running")
	}

	a.status.State = AgentStatePaused
	a.logger.Info("agent paused", zap.String("agent_id", a.config.ID))
	return nil
}

// Resume resumes the agent
func (a *BaseAgent) Resume() error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.status.State != AgentStatePaused {
		return fmt.Errorf("agent is not paused")
	}

	a.status.State = AgentStateIdle
	a.logger.Info("agent resumed", zap.String("agent_id", a.config.ID))
	return nil
}

// Reset resets the agent state
func (a *BaseAgent) Reset() error {
	a.mu.Lock()
	defer a.mu.Unlock()

	a.status = &AgentStatus{
		ID:       a.config.ID,
		Type:     a.config.Type,
		State:    AgentStateIdle,
		Metadata: make(map[string]interface{}),
	}

	a.logger.Info("agent reset", zap.String("agent_id", a.config.ID))
	return nil
}

// AgentFactory creates agents based on configuration
type AgentFactory struct {
	config       *ADKConfig
	toolRegistry *ToolRegistry
	hookRegistry *hooks.Registry
	logger       *zap.Logger
}

// NewAgentFactory creates a new agent factory
func NewAgentFactory(config *ADKConfig, toolRegistry *ToolRegistry, hookRegistry *hooks.Registry, logger *zap.Logger) *AgentFactory {
	if logger == nil {
		logger = zap.NewNop()
	}
	return &AgentFactory{
		config:       config,
		toolRegistry: toolRegistry,
		hookRegistry: hookRegistry,
		logger:       logger,
	}
}

// CreateAgent creates an agent based on the agent type
func (f *AgentFactory) CreateAgent(agentType AgentType) (Agent, error) {
	config, ok := f.config.Agents[agentType]
	if !ok {
		return nil, fmt.Errorf("no configuration for agent type: %s", agentType)
	}

	return f.CreateAgentFromConfig(config)
}

// CreateAgentFromConfig creates an agent from a configuration
func (f *AgentFactory) CreateAgentFromConfig(config *AgentConfig) (Agent, error) {
	if err := config.Validate(); err != nil {
		return nil, fmt.Errorf("invalid agent configuration: %w", err)
	}

	var hookIntegrator *ADKHookIntegrator
	if f.hookRegistry != nil {
		hookIntegrator = NewADKHookIntegrator(f.hookRegistry, f.logger)
	}

	agent := NewBaseAgent(config, f.toolRegistry, hookIntegrator, f.logger)

	f.logger.Info("agent created",
		zap.String("agent_id", config.ID),
		zap.String("agent_type", string(config.Type)),
		zap.String("model", config.Model.ModelID),
	)

	return agent, nil
}

// CreateAllAgents creates all configured agents
func (f *AgentFactory) CreateAllAgents() (map[AgentType]Agent, error) {
	agents := make(map[AgentType]Agent)

	for agentType := range f.config.Agents {
		agent, err := f.CreateAgent(agentType)
		if err != nil {
			return nil, fmt.Errorf("failed to create agent %s: %w", agentType, err)
		}
		agents[agentType] = agent
	}

	return agents, nil
}

// AgentPool manages a pool of agents for parallel execution
type AgentPool struct {
	agents   map[AgentType]Agent
	logger   *zap.Logger
	maxConcurrent int
	sem      chan struct{}
	mu       sync.RWMutex
}

// NewAgentPool creates a new agent pool
func NewAgentPool(agents map[AgentType]Agent, maxConcurrent int, logger *zap.Logger) *AgentPool {
	if logger == nil {
		logger = zap.NewNop()
	}
	if maxConcurrent <= 0 {
		maxConcurrent = 5
	}

	return &AgentPool{
		agents:        agents,
		logger:        logger,
		maxConcurrent: maxConcurrent,
		sem:           make(chan struct{}, maxConcurrent),
	}
}

// ExecuteParallel executes multiple agents in parallel
func (p *AgentPool) ExecuteParallel(ctx context.Context, inputs map[AgentType]*AgentInput) map[AgentType]*AgentOutput {
	results := make(map[AgentType]*AgentOutput)
	var wg sync.WaitGroup
	var mu sync.Mutex

	for agentType, input := range inputs {
		agent, ok := p.agents[agentType]
		if !ok {
			p.logger.Warn("agent not found in pool", zap.String("agent_type", string(agentType)))
			continue
		}

		wg.Add(1)
		go func(at AgentType, a Agent, in *AgentInput) {
			defer wg.Done()

			// Acquire semaphore
			p.sem <- struct{}{}
			defer func() { <-p.sem }()

			output, err := a.Run(ctx, in)
			if err != nil {
				p.logger.Error("agent execution failed",
					zap.String("agent_type", string(at)),
					zap.Error(err),
				)
				output = &AgentOutput{
					Success: false,
					Error:   err.Error(),
				}
			}

			mu.Lock()
			results[at] = output
			mu.Unlock()
		}(agentType, agent, input)
	}

	wg.Wait()
	return results
}

// GetAgent retrieves an agent from the pool
func (p *AgentPool) GetAgent(agentType AgentType) (Agent, bool) {
	p.mu.RLock()
	defer p.mu.RUnlock()

	agent, ok := p.agents[agentType]
	return agent, ok
}

// AddAgent adds an agent to the pool
func (p *AgentPool) AddAgent(agent Agent) {
	p.mu.Lock()
	defer p.mu.Unlock()

	p.agents[agent.Type()] = agent
}

// RemoveAgent removes an agent from the pool
func (p *AgentPool) RemoveAgent(agentType AgentType) {
	p.mu.Lock()
	defer p.mu.Unlock()

	delete(p.agents, agentType)
}

// GetAllAgents returns all agents in the pool
func (p *AgentPool) GetAllAgents() map[AgentType]Agent {
	p.mu.RLock()
	defer p.mu.RUnlock()

	result := make(map[AgentType]Agent)
	for k, v := range p.agents {
		result[k] = v
	}
	return result
}

// GetStatus returns the status of all agents
func (p *AgentPool) GetStatus() map[AgentType]*AgentStatus {
	p.mu.RLock()
	defer p.mu.RUnlock()

	result := make(map[AgentType]*AgentStatus)
	for k, v := range p.agents {
		result[k] = v.Status()
	}
	return result
}
