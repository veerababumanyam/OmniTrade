package adk

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/omnitrade/backend/internal/agent/hooks"
	"go.uber.org/zap"
)

// ADKHookIntegrator integrates the hooks system with ADK agent execution
type ADKHookIntegrator struct {
	registry *hooks.Registry
	executor *hooks.Executor
	logger   *zap.Logger
	mu       sync.RWMutex
}

// NewADKHookIntegrator creates a new hook integrator for ADK
func NewADKHookIntegrator(registry *hooks.Registry, logger *zap.Logger) *ADKHookIntegrator {
	if logger == nil {
		logger = zap.NewNop()
	}

	executor := hooks.NewExecutor(hooks.ExecutorConfig{
		Registry: registry,
		Logger:   logger,
		Timeout:  30 * time.Second,
	})

	return &ADKHookIntegrator{
		registry: registry,
		executor: executor,
		logger:   logger,
	}
}

// BeforeAgentRun executes hooks before an agent runs
func (i *ADKHookIntegrator) BeforeAgentRun(ctx context.Context, agentID string, agentType AgentType, input map[string]interface{}) (*hooks.ExecutionResult, error) {
	payload := &hooks.AgentRunPayload{
		AgentID:   agentID,
		AgentType: string(agentType),
		Input:     stringifyMap(input),
	}

	event := hooks.NewEventWithContext(ctx, hooks.EventBeforeAgentRun, "adk_integrator", payload)
	event.SetMetadata("agent_type", string(agentType))

	result := i.executor.Execute(ctx, event)

	if result.Stopped {
		i.logger.Warn("before agent run hooks stopped execution",
			zap.String("agent_id", agentID),
			zap.String("reason", result.StopReason),
		)
	}

	return result, nil
}

// AfterAgentRun executes hooks after an agent completes
func (i *ADKHookIntegrator) AfterAgentRun(ctx context.Context, agentID string, agentType AgentType, output map[string]interface{}, duration time.Duration, success bool, errMsg string) (*hooks.ExecutionResult, error) {
	payload := &hooks.AgentRunPayload{
		AgentID:      agentID,
		AgentType:    string(agentType),
		Output:       stringifyMap(output),
		Duration:     duration,
		Success:      success,
		ErrorMessage: errMsg,
	}

	event := hooks.NewEventWithContext(ctx, hooks.EventAfterAgentRun, "adk_integrator", payload)
	event.SetMetadata("agent_type", string(agentType))
	event.SetMetadata("duration_ms", duration.Milliseconds())

	result := i.executor.Execute(ctx, event)

	return result, nil
}

// BeforeToolExecution executes hooks before a tool is executed
func (i *ADKHookIntegrator) BeforeToolExecution(ctx context.Context, toolName string, params map[string]interface{}) (*hooks.ExecutionResult, error) {
	payload := &hooks.BasePayload{
		Data: map[string]interface{}{
			"tool_name": toolName,
			"params":    params,
		},
	}

	event := hooks.NewEventWithContext(ctx, hooks.EventBeforeDataFetch, "adk_integrator", payload)
	event.SetMetadata("tool_name", toolName)

	result := i.executor.Execute(ctx, event)

	if result.Stopped {
		i.logger.Warn("before tool execution hooks stopped",
			zap.String("tool_name", toolName),
			zap.String("reason", result.StopReason),
		)
	}

	return result, nil
}

// AfterToolExecution executes hooks after a tool completes
func (i *ADKHookIntegrator) AfterToolExecution(ctx context.Context, toolName string, result *ToolResult) (*hooks.ExecutionResult, error) {
	payload := &hooks.BasePayload{
		Data: map[string]interface{}{
			"tool_name": toolName,
			"success":   result.Success,
			"error":     result.Error,
			"duration":  result.Duration.String(),
		},
	}

	event := hooks.NewEventWithContext(ctx, hooks.EventAfterDataFetch, "adk_integrator", payload)
	event.SetMetadata("tool_name", toolName)
	event.SetMetadata("success", result.Success)

	execResult := i.executor.Execute(ctx, event)

	return execResult, nil
}

// OnSignalGenerated executes hooks when a trading signal is generated
func (i *ADKHookIntegrator) OnSignalGenerated(ctx context.Context, agentID string, signal *TradingSignal) (*hooks.ExecutionResult, error) {
	payload := &hooks.BasePayload{
		Data: map[string]interface{}{
			"signal_id":    signal.ID,
			"symbol":       signal.Symbol,
			"signal_type":  signal.Type,
			"confidence":   signal.Confidence,
			"agent_id":     agentID,
			"timestamp":    signal.Timestamp,
			"reasoning":    signal.Reasoning,
		},
	}

	event := hooks.NewEventWithContext(ctx, hooks.EventOnSignalGenerated, "adk_integrator", payload)
	event.SetMetadata("signal_type", signal.Type)
	event.SetMetadata("symbol", signal.Symbol)

	result := i.executor.Execute(ctx, event)

	return result, nil
}

// OnPatternDetected executes hooks when a pattern is detected
func (i *ADKHookIntegrator) OnPatternDetected(ctx context.Context, agentID string, pattern *DetectedPattern) (*hooks.ExecutionResult, error) {
	payload := &hooks.BasePayload{
		Data: map[string]interface{}{
			"pattern_id":   pattern.ID,
			"pattern_type": pattern.Type,
			"symbol":       pattern.Symbol,
			"confidence":   pattern.Confidence,
			"agent_id":     agentID,
			"timestamp":    pattern.Timestamp,
		},
	}

	event := hooks.NewEventWithContext(ctx, hooks.EventOnPatternDetected, "adk_integrator", payload)
	event.SetMetadata("pattern_type", pattern.Type)

	result := i.executor.Execute(ctx, event)

	return result, nil
}

// OnRiskCalculated executes hooks when risk is calculated
func (i *ADKHookIntegrator) OnRiskCalculated(ctx context.Context, agentID string, risk *RiskAssessment) (*hooks.ExecutionResult, error) {
	payload := &hooks.BasePayload{
		Data: map[string]interface{}{
			"assessment_id": risk.ID,
			"risk_level":    risk.Level,
			"risk_score":    risk.Score,
			"agent_id":      agentID,
			"timestamp":     risk.Timestamp,
			"factors":       risk.Factors,
		},
	}

	event := hooks.NewEventWithContext(ctx, hooks.EventOnRiskCalculated, "adk_integrator", payload)
	event.SetMetadata("risk_level", risk.Level)

	result := i.executor.Execute(ctx, event)

	return result, nil
}

// OnConfidenceScore executes hooks when a confidence score is calculated
func (i *ADKHookIntegrator) OnConfidenceScore(ctx context.Context, agentID string, score float64, breakdown map[string]float64) (*hooks.ExecutionResult, error) {
	payload := &hooks.BasePayload{
		Data: map[string]interface{}{
			"confidence_score": score,
			"breakdown":        breakdown,
			"agent_id":         agentID,
		},
	}

	event := hooks.NewEventWithContext(ctx, hooks.EventOnConfidenceScore, "adk_integrator", payload)
	event.SetMetadata("confidence_score", score)

	result := i.executor.Execute(ctx, event)

	return result, nil
}

// BeforeTradeProposal executes hooks before a trade proposal is created
func (i *ADKHookIntegrator) BeforeTradeProposal(ctx context.Context, proposal *TradeProposal) (*hooks.ExecutionResult, error) {
	payload := &hooks.TradeProposalPayload{
		ProposalID: proposal.ID,
		Symbol:     proposal.Symbol,
		Side:       proposal.Side,
		Quantity:   proposal.Quantity,
		Price:      proposal.Price,
		Strategy:   proposal.Strategy,
		Confidence: proposal.Confidence,
		AgentID:    proposal.AgentID,
		Reasoning:  proposal.Reasoning,
		RiskScore:  proposal.RiskScore,
		ExpiresAt:  proposal.ExpiresAt,
	}

	event := hooks.NewEventWithContext(ctx, hooks.EventBeforeTradeProposal, "adk_integrator", payload)

	result := i.executor.Execute(ctx, event)

	// Check if the event was cancelled (trade proposal rejected by hooks)
	if event.IsCancelled() {
		i.logger.Info("trade proposal cancelled by hooks",
			zap.String("proposal_id", proposal.ID),
			zap.String("reason", event.CancelReason()),
		)
	}

	return result, nil
}

// AfterTradeProposal executes hooks after a trade proposal is created
func (i *ADKHookIntegrator) AfterTradeProposal(ctx context.Context, proposal *TradeProposal, success bool, errMsg string) (*hooks.ExecutionResult, error) {
	payload := &hooks.TradeProposalPayload{
		ProposalID: proposal.ID,
		Symbol:     proposal.Symbol,
		Side:       proposal.Side,
		Quantity:   proposal.Quantity,
		Price:      proposal.Price,
		Strategy:   proposal.Strategy,
		Confidence: proposal.Confidence,
		AgentID:    proposal.AgentID,
		Reasoning:  proposal.Reasoning,
		RiskScore:  proposal.RiskScore,
		ExpiresAt:  proposal.ExpiresAt,
	}

	event := hooks.NewEventWithContext(ctx, hooks.EventAfterTradeProposal, "adk_integrator", payload)
	event.SetMetadata("success", success)
	if errMsg != "" {
		event.SetMetadata("error", errMsg)
	}

	result := i.executor.Execute(ctx, event)

	return result, nil
}

// OnMultiAgentSync executes hooks during multi-agent synchronization
func (i *ADKHookIntegrator) OnMultiAgentSync(ctx context.Context, syncID string, agentOutputs map[string]interface{}) (*hooks.ExecutionResult, error) {
	payload := &hooks.BasePayload{
		Data: map[string]interface{}{
			"sync_id":       syncID,
			"agent_outputs": agentOutputs,
			"agent_count":   len(agentOutputs),
		},
	}

	event := hooks.NewEventWithContext(ctx, hooks.EventOnMultiAgentSync, "adk_integrator", payload)
	event.SetMetadata("sync_id", syncID)

	result := i.executor.Execute(ctx, event)

	return result, nil
}

// OnAuditLog creates an audit log entry via hooks
func (i *ADKHookIntegrator) OnAuditLog(ctx context.Context, actor, action, resource string, details map[string]interface{}) error {
	payload := &hooks.AuditLogPayload{
		Actor:     actor,
		Action:    action,
		Resource:  resource,
		Extra:     details,
	}

	event := hooks.NewEventWithContext(ctx, hooks.EventOnAuditLog, "adk_integrator", payload)

	result := i.executor.Execute(ctx, event)

	if result.HooksFailed > 0 {
		return fmt.Errorf("%d audit hooks failed", result.HooksFailed)
	}

	return nil
}

// RegisterAgentHooks registers default hooks for agent lifecycle events
func (i *ADKHookIntegrator) RegisterAgentHooks() error {
	// Hook: Log agent runs
	loggingHook := hooks.NewHookBuilder().
		WithID("agent-logging-hook").
		WithName("Agent Logging Hook").
		WithDescription("Logs all agent execution events").
		WithEvents(
			hooks.EventBeforeAgentRun,
			hooks.EventAfterAgentRun,
		).
		WithPriority(hooks.PriorityMonitors).
		WithHandler(func(ctx context.Context, event *hooks.Event) *hooks.HookResult {
			if payload, ok := event.Payload.(*hooks.AgentRunPayload); ok {
				i.logger.Info("agent event",
					zap.String("event_type", string(event.Type)),
					zap.String("agent_id", payload.AgentID),
					zap.String("agent_type", payload.AgentType),
					zap.Bool("success", payload.Success),
					zap.Duration("duration", payload.Duration),
				)
			}
			return hooks.NewHookResult()
		}).
		MustBuild()

	if err := i.registry.Register(loggingHook); err != nil {
		return fmt.Errorf("failed to register logging hook: %w", err)
	}

	// Hook: Validate confidence threshold
	confidenceHook := hooks.NewHookBuilder().
		WithID("confidence-threshold-hook").
		WithName("Confidence Threshold Hook").
		WithDescription("Validates that trade proposals meet minimum confidence threshold").
		WithEvents(hooks.EventBeforeTradeProposal).
		WithPriority(hooks.PriorityHigh).
		WithHandler(func(ctx context.Context, event *hooks.Event) *hooks.HookResult {
			if payload, ok := event.Payload.(*hooks.TradeProposalPayload); ok {
				minConfidence := 0.7 // Minimum confidence threshold
				if payload.Confidence < minConfidence {
					event.Cancel(fmt.Sprintf("confidence %.2f below minimum threshold %.2f", payload.Confidence, minConfidence))
					return hooks.StopResult("confidence below threshold")
				}
			}
			return hooks.NewHookResult()
		}).
		MustBuild()

	if err := i.registry.Register(confidenceHook); err != nil {
		return fmt.Errorf("failed to register confidence hook: %w", err)
	}

	// Hook: Risk score validation
	riskHook := hooks.NewHookBuilder().
		WithID("risk-score-hook").
		WithName("Risk Score Hook").
		WithDescription("Validates risk scores for trade proposals").
		WithEvents(hooks.EventBeforeTradeProposal).
		WithPriority(hooks.PriorityHigh).
		WithHandler(func(ctx context.Context, event *hooks.Event) *hooks.HookResult {
			if payload, ok := event.Payload.(*hooks.TradeProposalPayload); ok {
				maxRiskScore := 0.8 // Maximum acceptable risk score
				if payload.RiskScore > maxRiskScore {
					event.Cancel(fmt.Sprintf("risk score %.2f exceeds maximum %.2f", payload.RiskScore, maxRiskScore))
					return hooks.StopResult("risk score too high")
				}
			}
			return hooks.NewHookResult()
		}).
		MustBuild()

	if err := i.registry.Register(riskHook); err != nil {
		return fmt.Errorf("failed to register risk hook: %w", err)
	}

	// Hook: Audit trail
	auditHook := hooks.NewHookBuilder().
		WithID("audit-trail-hook").
		WithName("Audit Trail Hook").
		WithDescription("Creates audit trail for all events").
		WithEvents(
			hooks.EventBeforeTradeProposal,
			hooks.EventAfterTradeProposal,
			hooks.EventOnSignalGenerated,
			hooks.EventOnRiskCalculated,
		).
		WithPriority(hooks.PriorityMonitors).
		WithHandler(func(ctx context.Context, event *hooks.Event) *hooks.HookResult {
			i.logger.Info("audit trail",
				zap.String("event_id", event.ID),
				zap.String("event_type", string(event.Type)),
				zap.String("source", event.Source),
				zap.Time("timestamp", event.Timestamp),
			)
			return hooks.NewHookResult()
		}).
		MustBuild()

	if err := i.registry.Register(auditHook); err != nil {
		return fmt.Errorf("failed to register audit hook: %w", err)
	}

	i.logger.Info("default agent hooks registered")
	return nil
}

// Data types for hook payloads

// TradingSignal represents a trading signal from an agent
type TradingSignal struct {
	ID         string                 `json:"id"`
	Symbol     string                 `json:"symbol"`
	Type       string                 `json:"type"` // buy, sell, hold
	Confidence float64                `json:"confidence"`
	Timestamp  time.Time              `json:"timestamp"`
	Reasoning  string                 `json:"reasoning"`
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
}

// DetectedPattern represents a detected technical pattern
type DetectedPattern struct {
	ID           string                 `json:"id"`
	Type         string                 `json:"type"` // head_and_shoulders, double_top, etc.
	Symbol       string                 `json:"symbol"`
	Confidence   float64                `json:"confidence"`
	Timestamp    time.Time              `json:"timestamp"`
	PriceLevel   string                 `json:"price_level,omitempty"`
	Direction    string                 `json:"direction"` // bullish, bearish
	TargetPrice  string                 `json:"target_price,omitempty"`
	StopLoss     string                 `json:"stop_loss,omitempty"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
}

// RiskAssessment represents a risk assessment from the risk manager
type RiskAssessment struct {
	ID          string                 `json:"id"`
	Level       string                 `json:"level"` // low, medium, high, critical
	Score       float64                `json:"score"`
	Timestamp   time.Time              `json:"timestamp"`
	Factors     map[string]interface{} `json:"factors"`
	Var95       string                 `json:"var_95,omitempty"` // Value at Risk 95%
	MaxDrawdown string                 `json:"max_drawdown,omitempty"`
	Volatility  string                 `json:"volatility,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// TradeProposal represents a trade proposal from the portfolio manager
type TradeProposal struct {
	ID           string                 `json:"id"`
	Symbol       string                 `json:"symbol"`
	Side         string                 `json:"side"` // buy, sell
	Quantity     string                 `json:"quantity"`
	Price        string                 `json:"price"`
	Strategy     string                 `json:"strategy"`
	Confidence   float64                `json:"confidence"`
	AgentID      string                 `json:"agent_id"`
	Reasoning    string                 `json:"reasoning"`
	RiskScore    float64                `json:"risk_score"`
	ExpiresAt    time.Time              `json:"expires_at,omitempty"`
	TargetPrice  string                 `json:"target_price,omitempty"`
	StopLoss     string                 `json:"stop_loss,omitempty"`
	CreatedAt    time.Time              `json:"created_at"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
}

// Helper functions

// stringifyMap converts a map with interface values to string values
func stringifyMap(m map[string]interface{}) map[string]string {
	if m == nil {
		return nil
	}
	result := make(map[string]string)
	for k, v := range m {
		result[k] = fmt.Sprintf("%v", v)
	}
	return result
}

// HookAwareTool wraps a FunctionTool with hook integration
type HookAwareTool struct {
	*FunctionTool
	integrator *ADKHookIntegrator
}

// NewHookAwareTool creates a tool that triggers hooks on execution
func NewHookAwareTool(tool *FunctionTool, integrator *ADKHookIntegrator) *HookAwareTool {
	return &HookAwareTool{
		FunctionTool: tool,
		integrator:   integrator,
	}
}

// Execute runs the tool with hook integration
func (t *HookAwareTool) Execute(ctx context.Context, params map[string]interface{}) *ToolResult {
	// Execute before hooks
	if t.integrator != nil {
		hookResult, err := t.integrator.BeforeToolExecution(ctx, t.Name, params)
		if err != nil {
			t.logger.Error("before tool execution hooks failed", zap.Error(err))
		}
		if hookResult != nil && hookResult.Stopped {
			return &ToolResult{
				Success: false,
				Error:   fmt.Sprintf("execution stopped by hooks: %s", hookResult.StopReason),
			}
		}
	}

	// Execute the actual tool
	result := t.FunctionTool.Execute(ctx, params)

	// Execute after hooks
	if t.integrator != nil {
		_, err := t.integrator.AfterToolExecution(ctx, t.Name, result)
		if err != nil {
			t.logger.Error("after tool execution hooks failed", zap.Error(err))
		}
	}

	return result
}
