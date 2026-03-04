package adk

import (
	"context"
	"testing"
	"time"

	"github.com/omnitrade/backend/internal/agent/hooks"
	"go.uber.org/zap"
)

// TestConfig tests the configuration building
func TestConfigBuilder(t *testing.T) {
	config := NewConfigBuilder().
		WithGeminiModel().
		WithGlobalTimeout(60 * time.Second).
		WithTracing(true).
		WithLogging(true).
		WithMaxConcurrentAgents(10).
		WithCaching(true, 10*time.Minute).
		MustBuild()

	if config.DefaultModel.Provider != ModelProviderGemini {
		t.Errorf("expected Gemini provider, got %s", config.DefaultModel.Provider)
	}

	if config.GlobalTimeout != 60*time.Second {
		t.Errorf("expected 60s timeout, got %v", config.GlobalTimeout)
	}

	if config.MaxConcurrentAgents != 10 {
		t.Errorf("expected 10 concurrent agents, got %d", config.MaxConcurrentAgents)
	}
}

// TestAgentConfigBuilder tests agent configuration building
func TestAgentConfigBuilder(t *testing.T) {
	config := NewAgentConfigBuilder(AgentTypeFundamentalAnalyst).
		WithID("test-agent-001").
		WithName("Test Fundamental Analyst").
		WithDescription("Test agent for fundamental analysis").
		WithSystemPrompt("You are a test agent").
		WithTools("get_financial_data", "get_earnings_data").
		WithMaxIterations(15).
		WithTimeout(45 * time.Second).
		MustBuild()

	if config.ID != "test-agent-001" {
		t.Errorf("expected test-agent-001, got %s", config.ID)
	}

	if config.Type != AgentTypeFundamentalAnalyst {
		t.Errorf("expected FundamentalAnalyst type, got %s", config.Type)
	}

	if len(config.Tools) != 2 {
		t.Errorf("expected 2 tools, got %d", len(config.Tools))
	}
}

// TestDefaultAgentConfigs tests that default configs are valid
func TestDefaultAgentConfigs(t *testing.T) {
	configs := DefaultAgentConfigs()

	expectedTypes := []AgentType{
		AgentTypeFundamentalAnalyst,
		AgentTypeTechnicalAnalyst,
		AgentTypeSentimentAnalyst,
		AgentTypeRiskManager,
		AgentTypePortfolioManager,
	}

	for _, expectedType := range expectedTypes {
		config, ok := configs[expectedType]
		if !ok {
			t.Errorf("missing default config for agent type: %s", expectedType)
			continue
		}

		if err := config.Validate(); err != nil {
			t.Errorf("invalid default config for %s: %v", expectedType, err)
		}
	}
}

// TestFunctionTool tests function tool creation and execution
func TestFunctionTool(t *testing.T) {
	handler := func(ctx context.Context, params map[string]interface{}) (interface{}, error) {
		return map[string]interface{}{
			"result": "success",
			"value":  params["input"],
		}, nil
	}

	tool := NewFunctionTool("test_tool", handler,
		WithToolDescription("A test tool"),
		WithToolRequired("input"),
		WithToolTimeout(10*time.Second),
	)

	if tool.Name != "test_tool" {
		t.Errorf("expected test_tool, got %s", tool.Name)
	}

	result := tool.Execute(context.Background(), map[string]interface{}{
		"input": "test_value",
	})

	if !result.Success {
		t.Errorf("tool execution failed: %s", result.Error)
	}
}

// TestFunctionToolValidation tests tool parameter validation
func TestFunctionToolValidation(t *testing.T) {
	handler := func(ctx context.Context, params map[string]interface{}) (interface{}, error) {
		return "ok", nil
	}

	tool := NewFunctionTool("test_tool", handler,
		WithToolRequired("required_param"),
	)

	// Test missing required parameter
	result := tool.Execute(context.Background(), map[string]interface{}{})
	if result.Success {
		t.Error("expected validation failure for missing required parameter")
	}

	// Test with required parameter
	result = tool.Execute(context.Background(), map[string]interface{}{
		"required_param": "value",
	})
	if !result.Success {
		t.Errorf("expected success with required parameter, got: %s", result.Error)
	}
}

// TestToolRegistry tests tool registry operations
func TestToolRegistry(t *testing.T) {
	logger := zap.NewNop()
	registry := hooks.NewRegistry(hooks.RegistryConfig{Logger: logger})
	toolRegistry := NewToolRegistry(logger, registry)

	handler := func(ctx context.Context, params map[string]interface{}) (interface{}, error) {
		return "ok", nil
	}

	tool := NewFunctionTool("test_tool", handler)

	// Test registration
	if err := toolRegistry.Register(tool); err != nil {
		t.Fatalf("failed to register tool: %v", err)
	}

	// Test retrieval
	retrieved, ok := toolRegistry.Get("test_tool")
	if !ok {
		t.Error("failed to retrieve registered tool")
	}
	if retrieved.Name != "test_tool" {
		t.Errorf("expected test_tool, got %s", retrieved.Name)
	}

	// Test duplicate registration
	if err := toolRegistry.Register(tool); err == nil {
		t.Error("expected error for duplicate registration")
	}

	// Test unregistration
	if err := toolRegistry.Unregister("test_tool"); err != nil {
		t.Fatalf("failed to unregister tool: %v", err)
	}

	// Test retrieval after unregistration
	_, ok = toolRegistry.Get("test_tool")
	if ok {
		t.Error("expected tool to be unregistered")
	}
}

// TestToolBuilder tests the tool builder
func TestToolBuilder(t *testing.T) {
	handler := func(ctx context.Context, params map[string]interface{}) (interface{}, error) {
		return params["symbol"], nil
	}

	tool := NewToolBuilder("stock_lookup").
		WithDescription("Look up stock information").
		WithHandler(handler).
		WithStringParam("symbol", "Stock symbol to look up", true).
		WithIntegerParam("limit", "Maximum results to return", false).
		WithTimeout(15 * time.Second).
		MustBuild()

	if tool.Name != "stock_lookup" {
		t.Errorf("expected stock_lookup, got %s", tool.Name)
	}

	if len(tool.Required) != 1 || tool.Required[0] != "symbol" {
		t.Errorf("expected symbol as required, got %v", tool.Required)
	}
}

// TestBaseAgent tests base agent creation and execution
func TestBaseAgent(t *testing.T) {
	logger := zap.NewNop()
	hookRegistry := hooks.NewRegistry(hooks.RegistryConfig{Logger: logger})
	toolRegistry := NewToolRegistry(logger, hookRegistry)
	hookIntegrator := NewADKHookIntegrator(hookRegistry, logger)

	config := NewAgentConfigBuilder(AgentTypeFundamentalAnalyst).
		WithID("test-fundamental").
		WithName("Test Fundamental").
		WithSystemPrompt("You are a test agent").
		MustBuild()

	agent := NewBaseAgent(config, toolRegistry, hookIntegrator, logger)

	// Test basic properties
	if agent.ID() != "test-fundamental" {
		t.Errorf("expected test-fundamental, got %s", agent.ID())
	}

	if agent.Type() != AgentTypeFundamentalAnalyst {
		t.Errorf("expected FundamentalAnalyst, got %s", agent.Type())
	}

	// Test status
	status := agent.Status()
	if status.State != AgentStateIdle {
		t.Errorf("expected idle state, got %s", status.State)
	}

	// Test execution
	input := &AgentInput{
		Symbol: "AAPL",
		Query:  "Analyze fundamentals",
	}

	output, err := agent.Run(context.Background(), input)
	if err != nil {
		t.Fatalf("agent run failed: %v", err)
	}

	if !output.Success {
		t.Errorf("expected successful output, got error: %s", output.Error)
	}

	if output.Metadata["analyst_type"] != "fundamental" {
		t.Errorf("expected fundamental analyst type in metadata")
	}
}

// TestAgentFactory tests agent factory
func TestAgentFactory(t *testing.T) {
	logger := zap.NewNop()
	hookRegistry := hooks.NewRegistry(hooks.RegistryConfig{Logger: logger})
	toolRegistry := NewToolRegistry(logger, hookRegistry)

	adkConfig := DefaultADKConfig()
	adkConfig.Agents = DefaultAgentConfigs()

	factory := NewAgentFactory(adkConfig, toolRegistry, hookRegistry, logger)

	// Test creating single agent
	agent, err := factory.CreateAgent(AgentTypeFundamentalAnalyst)
	if err != nil {
		t.Fatalf("failed to create agent: %v", err)
	}

	if agent.Type() != AgentTypeFundamentalAnalyst {
		t.Errorf("expected FundamentalAnalyst, got %s", agent.Type())
	}

	// Test creating all agents
	agents, err := factory.CreateAllAgents()
	if err != nil {
		t.Fatalf("failed to create all agents: %v", err)
	}

	if len(agents) != 5 {
		t.Errorf("expected 5 agents, got %d", len(agents))
	}
}

// TestAgentPool tests agent pool operations
func TestAgentPool(t *testing.T) {
	logger := zap.NewNop()

	// Create agents
	agents := make(map[AgentType]Agent)
	for agentType, config := range DefaultAgentConfigs() {
		agents[agentType] = NewBaseAgent(config, nil, nil, logger)
	}

	pool := NewAgentPool(agents, 3, logger)

	// Test parallel execution
	inputs := map[AgentType]*AgentInput{
		AgentTypeFundamentalAnalyst: {Symbol: "AAPL"},
		AgentTypeTechnicalAnalyst:   {Symbol: "AAPL"},
		AgentTypeSentimentAnalyst:   {Symbol: "AAPL"},
	}

	results := pool.ExecuteParallel(context.Background(), inputs)

	if len(results) != 3 {
		t.Errorf("expected 3 results, got %d", len(results))
	}

	for agentType, output := range results {
		if !output.Success {
			t.Errorf("agent %s execution failed", agentType)
		}
	}

	// Test status retrieval
	statuses := pool.GetStatus()
	if len(statuses) != 5 {
		t.Errorf("expected 5 statuses, got %d", len(statuses))
	}
}

// TestFlowRegistry tests flow registration and execution
func TestFlowRegistry(t *testing.T) {
	logger := zap.NewNop()

	// Create agent pool
	agents := make(map[AgentType]Agent)
	for agentType, config := range DefaultAgentConfigs() {
		agents[agentType] = NewBaseAgent(config, nil, nil, logger)
	}
	agentPool := NewAgentPool(agents, 5, logger)

	// Create registries
	hookRegistry := hooks.NewRegistry(hooks.RegistryConfig{Logger: logger})
	toolRegistry := NewToolRegistry(logger, hookRegistry)

	// Create flow registry
	flowRegistry := NewFlowRegistry(agentPool, toolRegistry, hookRegistry, logger)

	// Test default flow registration
	flows := []string{"multi_agent_analysis", "single_agent_analysis", "trade_proposal_flow"}
	for _, flowName := range flows {
		if _, ok := flowRegistry.Get(flowName); !ok {
			t.Errorf("default flow %s not registered", flowName)
		}
	}

	// Test custom flow registration
	customFlow := DefineFlow("custom_test_flow").
		WithDescription("A custom test flow").
		WithTimeout(30 * time.Second).
		AddAgentStep("step1", "Analysis Step", AgentTypeFundamentalAnalyst, 20*time.Second).
		Build()

	if err := flowRegistry.Register(customFlow); err != nil {
		t.Fatalf("failed to register custom flow: %v", err)
	}

	if _, ok := flowRegistry.Get("custom_test_flow"); !ok {
		t.Error("custom flow not found after registration")
	}
}

// TestFlowExecutor tests the flow executor
func TestFlowExecutor(t *testing.T) {
	logger := zap.NewNop()

	// Setup
	agents := make(map[AgentType]Agent)
	for agentType, config := range DefaultAgentConfigs() {
		agents[agentType] = NewBaseAgent(config, nil, nil, logger)
	}
	agentPool := NewAgentPool(agents, 5, logger)
	hookRegistry := hooks.NewRegistry(hooks.RegistryConfig{Logger: logger})
	toolRegistry := NewToolRegistry(logger, hookRegistry)
	flowRegistry := NewFlowRegistry(agentPool, toolRegistry, hookRegistry, logger)

	executor := NewFlowExecutor(flowRegistry, logger)

	// Test single agent execution
	execution, err := executor.RunSingleAgent(
		context.Background(),
		AgentTypeFundamentalAnalyst,
		"AAPL",
		"Analyze fundamentals",
	)
	if err != nil {
		t.Fatalf("single agent execution failed: %v", err)
	}

	if execution.Status != FlowStatusComplete {
		t.Errorf("expected complete status, got %s", execution.Status)
	}
}

// TestHookIntegrator tests hook integration
func TestHookIntegrator(t *testing.T) {
	logger := zap.NewNop()
	registry := hooks.NewRegistry(hooks.RegistryConfig{Logger: logger})
	integrator := NewADKHookIntegrator(registry, logger)

	// Register default hooks
	if err := integrator.RegisterAgentHooks(); err != nil {
		t.Fatalf("failed to register agent hooks: %v", err)
	}

	// Test before agent run hooks
	_, err := integrator.BeforeAgentRun(
		context.Background(),
		"test-agent",
		AgentTypeFundamentalAnalyst,
		map[string]interface{}{"symbol": "AAPL"},
	)
	if err != nil {
		t.Errorf("BeforeAgentRun failed: %v", err)
	}

	// Test after agent run hooks
	_, err = integrator.AfterAgentRun(
		context.Background(),
		"test-agent",
		AgentTypeFundamentalAnalyst,
		map[string]interface{}{"result": "success"},
		100*time.Millisecond,
		true,
		"",
	)
	if err != nil {
		t.Errorf("AfterAgentRun failed: %v", err)
	}
}

// TestHookAwareTool tests hook-aware tool wrapper
func TestHookAwareTool(t *testing.T) {
	logger := zap.NewNop()
	registry := hooks.NewRegistry(hooks.RegistryConfig{Logger: logger})
	integrator := NewADKHookIntegrator(registry, logger)

	handler := func(ctx context.Context, params map[string]interface{}) (interface{}, error) {
		return map[string]interface{}{"price": 150.0}, nil
	}

	baseTool := NewFunctionTool("get_price", handler)
	hookAwareTool := NewHookAwareTool(baseTool, integrator)

	result := hookAwareTool.Execute(context.Background(), map[string]interface{}{
		"symbol": "AAPL",
	})

	if !result.Success {
		t.Errorf("hook-aware tool execution failed: %s", result.Error)
	}
}

// TestTradingSignalPayload tests trading signal creation
func TestTradingSignalPayload(t *testing.T) {
	signal := &TradingSignal{
		ID:         "sig_001",
		Symbol:     "AAPL",
		Type:       "buy",
		Confidence: 0.85,
		Timestamp:  time.Now(),
		Reasoning:  "Strong fundamentals and positive sentiment",
		Metadata: map[string]interface{}{
			"source": "multi_agent_analysis",
		},
	}

	if signal.ID != "sig_001" {
		t.Errorf("expected sig_001, got %s", signal.ID)
	}

	if signal.Confidence < 0.7 {
		t.Error("confidence should be above minimum threshold")
	}
}

// TestTradeProposalPayload tests trade proposal creation
func TestTradeProposalPayload(t *testing.T) {
	proposal := &TradeProposal{
		ID:         "prop_001",
		Symbol:     "AAPL",
		Side:       "buy",
		Quantity:   "100",
		Price:      "150.00",
		Strategy:   "momentum",
		Confidence: 0.78,
		AgentID:    "portfolio-manager-001",
		Reasoning:  "Multi-agent consensus indicates strong buy signal",
		RiskScore:  0.35,
		CreatedAt:  time.Now(),
		ExpiresAt:  time.Now().Add(24 * time.Hour),
	}

	if proposal.Confidence < 0.7 {
		t.Error("proposal confidence should meet minimum threshold")
	}

	if proposal.RiskScore > 0.8 {
		t.Error("proposal risk score should be below maximum threshold")
	}
}

// TestModelConfiguration tests model configuration
func TestModelConfiguration(t *testing.T) {
	geminiConfig := DefaultGeminiConfig()
	if geminiConfig.Provider != ModelProviderGemini {
		t.Errorf("expected Gemini provider, got %s", geminiConfig.Provider)
	}

	claudeConfig := DefaultClaudeConfig()
	if claudeConfig.Provider != ModelProviderClaude {
		t.Errorf("expected Claude provider, got %s", claudeConfig.Provider)
	}

	// Test custom model config
	customConfig := &ModelConfig{
		Provider:    ModelProviderGemini,
		ModelID:     "gemini-1.5-flash",
		Temperature: 0.5,
		MaxTokens:   2048,
	}

	if customConfig.Temperature < 0 || customConfig.Temperature > 1 {
		t.Error("temperature should be between 0 and 1")
	}
}

// TestContextPropagation tests context propagation through the system
func TestContextPropagation(t *testing.T) {
	ctx := context.Background()

	// Test ADK config in context
	adkConfig := DefaultADKConfig()
	ctx = WithADKConfig(ctx, adkConfig)

	retrievedConfig, ok := GetADKConfig(ctx)
	if !ok {
		t.Error("failed to retrieve ADK config from context")
	}
	if retrievedConfig != adkConfig {
		t.Error("retrieved config does not match original")
	}

	// Test agent config in context
	agentConfig := NewAgentConfigBuilder(AgentTypeFundamentalAnalyst).MustBuild()
	ctx = WithAgentConfig(ctx, agentConfig)

	retrievedAgentConfig, ok := GetAgentConfigFromContext(ctx)
	if !ok {
		t.Error("failed to retrieve agent config from context")
	}
	if retrievedAgentConfig != agentConfig {
		t.Error("retrieved agent config does not match original")
	}

	// Test logger in context
	logger := zap.NewNop()
	ctx = WithLogger(ctx, logger)

	retrievedLogger, ok := GetLogger(ctx)
	if !ok {
		t.Error("failed to retrieve logger from context")
	}
	if retrievedLogger != logger {
		t.Error("retrieved logger does not match original")
	}
}

// TestToolToADKFormat tests ADK format conversion
func TestToolToADKFormat(t *testing.T) {
	handler := func(ctx context.Context, params map[string]interface{}) (interface{}, error) {
		return nil, nil
	}

	tool := NewFunctionTool("test_tool", handler,
		WithToolDescription("Test tool description"),
		WithStringParam("symbol", "Stock symbol", true),
	)

	adkFormat := tool.ToADKFormat()

	if adkFormat["type"] != "function" {
		t.Error("expected function type in ADK format")
	}

	functionMap, ok := adkFormat["function"].(map[string]interface{})
	if !ok {
		t.Fatal("expected function map in ADK format")
	}

	if functionMap["name"] != "test_tool" {
		t.Errorf("expected test_tool name, got %v", functionMap["name"])
	}
}

// BenchmarkAgentExecution benchmarks agent execution
func BenchmarkAgentExecution(b *testing.B) {
	logger := zap.NewNop()
	config := NewAgentConfigBuilder(AgentTypeFundamentalAnalyst).MustBuild()
	agent := NewBaseAgent(config, nil, nil, logger)

	input := &AgentInput{
		Symbol: "AAPL",
		Query:  "Analyze fundamentals",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = agent.Run(context.Background(), input)
	}
}

// BenchmarkParallelExecution benchmarks parallel agent execution
func BenchmarkParallelExecution(b *testing.B) {
	logger := zap.NewNop()

	agents := make(map[AgentType]Agent)
	for agentType, config := range DefaultAgentConfigs() {
		agents[agentType] = NewBaseAgent(config, nil, nil, logger)
	}

	pool := NewAgentPool(agents, 5, logger)

	inputs := map[AgentType]*AgentInput{
		AgentTypeFundamentalAnalyst: {Symbol: "AAPL"},
		AgentTypeTechnicalAnalyst:   {Symbol: "AAPL"},
		AgentTypeSentimentAnalyst:   {Symbol: "AAPL"},
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = pool.ExecuteParallel(context.Background(), inputs)
	}
}
