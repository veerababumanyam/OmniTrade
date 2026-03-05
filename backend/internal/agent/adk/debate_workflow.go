// Copyright 2026 OmniTrade Authors
// SPDX-License-Identifier: Apache-2.0

package adk

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"
)

// DebateWorkflow orchestrates parallel multi-agent analysis with conflict resolution.
// Unlike the sequential TradingWorkflow, DebateWorkflow runs RAGAnalysis and
// RiskAssessment in parallel, then uses a Mediator to resolve conflicts before
// synthesizing the final proposal via PortfolioManager.
type DebateWorkflow struct {
	agents   *TradingAgents
	mediator *MediatorAgent
	cache    SemanticCache
	memory   MemoryService
}

// DebateWorkflowConfig holds configuration for creating a debate workflow.
type DebateWorkflowConfig struct {
	Agents   *TradingAgents
	Mediator *MediatorAgent
	Cache    SemanticCache
	Memory   MemoryService
}

// NewDebateWorkflow creates a new debate workflow with parallel execution.
func NewDebateWorkflow(cfg DebateWorkflowConfig) (*DebateWorkflow, error) {
	if cfg.Agents == nil {
		return nil, fmt.Errorf("agents are required")
	}

	if err := cfg.Agents.Validate(); err != nil {
		return nil, fmt.Errorf("invalid agents: %w", err)
	}

	// Use default mediator if not provided
	mediator := cfg.Mediator
	if mediator == nil {
		mediator = NewMediatorAgent()
	}

	return &DebateWorkflow{
		agents:   cfg.Agents,
		mediator: mediator,
		cache:    cfg.Cache,
		memory:   cfg.Memory,
	}, nil
}

// Run executes the debate workflow to generate a trade proposal.
// The workflow follows these phases:
//  1. DataFetcher (sequential) - fetches market data
//  2. RAGAnalysis + RiskAssessment (parallel) - generates opinions concurrently
//  3. Mediator - resolves conflicts between analyst opinions
//  4. PortfolioManager - synthesizes final proposal
func (w *DebateWorkflow) Run(ctx context.Context, input TradeProposalInput) (*TradeProposalOutput, error) {
	startTime := time.Now()

	log.Printf("[DebateWorkflow] Starting parallel debate analysis for %s (Strategy: %s)", input.Symbol, input.Strategy)

	// Step 1: Check semantic cache
	if w.cache != nil {
		queryFingerprint := fmt.Sprintf("debate|%s|%s", input.Symbol, input.Strategy)
		if cachedOutput, hit := w.cache.CheckCache(ctx, queryFingerprint); hit {
			log.Printf("[DebateWorkflow] Cache HIT for %s - returning cached result", input.Symbol)
			if w.memory != nil {
				w.memory.SaveWorkingMemory(ctx, input.Symbol, MemoryEntry{
					Role:      "system",
					Content:   fmt.Sprintf("Cache HIT for %s debate. Bypassed LLM.", input.Symbol),
					Timestamp: time.Now(),
				})
			}
			return cachedOutput, nil
		}
	}

	// Step 2: Save initial task intent to working memory
	if w.memory != nil {
		w.memory.SaveWorkingMemory(ctx, input.Symbol, MemoryEntry{
			Role:      "user",
			Content:   fmt.Sprintf("Analyze %s using %s strategy with debate workflow.", input.Symbol, input.Strategy),
			Timestamp: time.Now(),
		})
	}

	// Step 3: Execute DataFetcher phase (sequential - required for subsequent analysis)
	marketData := w.executeDataFetcherPhase(ctx, input)

	// Check for context cancellation
	if err := ctx.Err(); err != nil {
		return nil, fmt.Errorf("workflow cancelled after data fetch: %w", err)
	}

	// Step 4: Execute RAGAnalysis and RiskAssessment in parallel
	debateContext := w.executeParallelAnalystPhase(ctx, input, marketData)

	// Check for context cancellation
	if err := ctx.Err(); err != nil {
		return nil, fmt.Errorf("workflow cancelled after parallel analysis: %w", err)
	}

	// Step 5: Execute Mediator phase to resolve conflicts
	mediatorDecision := w.executeMediatorPhase(ctx, debateContext)

	// Check for context cancellation
	if err := ctx.Err(); err != nil {
		return nil, fmt.Errorf("workflow cancelled after mediation: %w", err)
	}

	// Step 6: Execute Portfolio Manager phase with mediated decision
	output := w.executePortfolioManagerPhase(ctx, input, marketData, debateContext, mediatorDecision)

	// Step 7: Save to episodic memory
	if w.memory != nil {
		userID := input.UserID
		if userID == "" {
			userID = "default_user"
		}
		w.memory.SaveEpisodicMemory(ctx, userID, MemoryEntry{
			Role:      "assistant",
			Content:   fmt.Sprintf("Generated %s signal for %s with %.2f confidence via debate workflow. Strategy: %s. Reasoning: %s", output.Action, output.Symbol, output.ConfidenceScore, mediatorDecision.Strategy, output.Reasoning),
			Timestamp: time.Now(),
		})
	}

	// Step 8: Cache the result
	if w.cache != nil {
		queryFingerprint := fmt.Sprintf("debate|%s|%s", input.Symbol, input.Strategy)
		if err := w.cache.SetCache(ctx, queryFingerprint, output); err != nil {
			log.Printf("[DebateWorkflow] Warning: Failed to cache result: %v", err)
		}
	}

	elapsed := time.Since(startTime)
	log.Printf("[DebateWorkflow] Completed debate analysis for %s in %v (Action: %s, Confidence: %.2f, Strategy: %s)",
		input.Symbol, elapsed, output.Action, output.ConfidenceScore, mediatorDecision.Strategy)

	return output, nil
}

// executeDataFetcherPhase fetches market data sequentially.
// This phase must complete before parallel analyst phases can begin.
func (w *DebateWorkflow) executeDataFetcherPhase(ctx context.Context, input TradeProposalInput) map[string]interface{} {
	log.Printf("[DebateWorkflow] Phase 1: DataFetcher for %s", input.Symbol)

	// Simulated data fetching (matches existing workflow pattern)
	price := simulateFetchPrice(input.Symbol)
	volume := simulateFetchVolume(input.Symbol)

	data := map[string]interface{}{
		"symbol":     input.Symbol,
		"price":      price,
		"volume_24h": volume,
		"timestamp":  time.Now().Format(time.RFC3339),
	}

	// Save to working memory
	if w.memory != nil {
		w.memory.SaveWorkingMemory(ctx, input.Symbol, MemoryEntry{
			Role:      "data_fetcher",
			Content:   fmt.Sprintf("Fetched market data for %s: price=%.2f, volume=%.0f", input.Symbol, price, volume),
			Timestamp: time.Now(),
		})
	}

	return data
}

// parallelAnalystResult holds the result from a parallel analyst execution.
type parallelAnalystResult struct {
	AgentName string
	Opinion   AgentOpinion
	Error     error
}

// executeParallelAnalystPhase runs RAGAnalysis and RiskAssessment concurrently.
// Uses goroutines with sync.WaitGroup for parallel execution.
func (w *DebateWorkflow) executeParallelAnalystPhase(ctx context.Context, input TradeProposalInput, marketData map[string]interface{}) *DebateContext {
	log.Printf("[DebateWorkflow] Phase 2: Parallel Analyst Execution for %s", input.Symbol)

	debateContext := &DebateContext{
		SessionID:     input.SessionID,
		Symbol:        input.Symbol,
		MarketData:    marketData,
		AgentOpinions: make([]AgentOpinion, 0),
		Conflicts:     make([]ConflictPoint, 0),
		DebateRound:   1,
		MaxRounds:     1,
	}

	if debateContext.SessionID == "" {
		debateContext.SessionID = fmt.Sprintf("debate-%d", time.Now().UnixNano())
	}

	// Channel to collect results from parallel goroutines
	resultsChan := make(chan parallelAnalystResult, 2)

	// WaitGroup for synchronizing parallel goroutines
	var wg sync.WaitGroup

	// Launch RAGAnalysis goroutine
	wg.Add(1)
	go func() {
		defer wg.Done()
		opinion := w.executeRAGAnalysis(ctx, input)
		resultsChan <- parallelAnalystResult{
			AgentName: "rag_analysis",
			Opinion:   opinion,
		}
	}()

	// Launch RiskAssessment goroutine
	wg.Add(1)
	go func() {
		defer wg.Done()
		opinion := w.executeRiskAssessment(ctx, input, marketData)
		resultsChan <- parallelAnalystResult{
			AgentName: "risk_assessment",
			Opinion:   opinion,
		}
	}()

	// Wait for all goroutines to complete in a separate goroutine
	go func() {
		wg.Wait()
		close(resultsChan)
	}()

	// Collect results from channel
	for result := range resultsChan {
		if result.Error != nil {
			log.Printf("[DebateWorkflow] Warning: %s returned error: %v", result.AgentName, result.Error)
			continue
		}
		debateContext.AgentOpinions = append(debateContext.AgentOpinions, result.Opinion)
		log.Printf("[DebateWorkflow] Collected opinion from %s: Action=%s, Confidence=%.2f",
			result.AgentName, result.Opinion.ActionRecommendation, result.Opinion.ConfidenceScore)
	}

	// Save parallel execution summary to memory
	if w.memory != nil {
		w.memory.SaveWorkingMemory(ctx, input.Symbol, MemoryEntry{
			Role:      "system",
			Content:   fmt.Sprintf("Parallel analysis complete. Collected %d agent opinions.", len(debateContext.AgentOpinions)),
			Timestamp: time.Now(),
		})
	}

	return debateContext
}

// executeRAGAnalysis performs RAG-based analysis for the given input.
func (w *DebateWorkflow) executeRAGAnalysis(ctx context.Context, input TradeProposalInput) AgentOpinion {
	log.Printf("[DebateWorkflow] RAGAnalysis starting for %s", input.Symbol)

	// Check for context cancellation
	if err := ctx.Err(); err != nil {
		return AgentOpinion{
			AgentName:            "rag_analysis",
			ActionRecommendation: "HOLD",
			ConfidenceScore:      0.0,
			Reasoning:            fmt.Sprintf("RAG analysis cancelled: %v", err),
		}
	}

	// Simulated RAG analysis (matches existing workflow pattern)
	sentimentScore := 0.65
	if input.Strategy == "lynch" {
		sentimentScore = 0.75
	}

	action := "HOLD"
	if sentimentScore > 0.6 {
		action = "BUY"
	}

	confidence := 0.75 + (sentimentScore-0.5)*0.2
	if confidence > 0.95 {
		confidence = 0.95
	}

	opinion := AgentOpinion{
		AgentName:            "rag_analysis",
		ActionRecommendation: action,
		ConfidenceScore:      confidence,
		Reasoning: fmt.Sprintf(
			"Sentiment analysis indicates %s direction with score %.2f. Historical patterns show 72%% success rate.",
			"bullish", sentimentScore),
		SupportingData: map[string]interface{}{
			"sentiment_score":     sentimentScore,
			"historical_success":  0.72,
			"avg_return":          0.08,
			"analysis_timestamp":  time.Now().Format(time.RFC3339),
		},
	}

	// Save to working memory
	if w.memory != nil {
		w.memory.SaveWorkingMemory(ctx, input.Symbol, MemoryEntry{
			Role:      "rag_analysis",
			Content:   fmt.Sprintf("RAG analysis complete: %s with %.2f confidence", action, confidence),
			Timestamp: time.Now(),
		})
	}

	return opinion
}

// executeRiskAssessment performs risk analysis for the given input.
func (w *DebateWorkflow) executeRiskAssessment(ctx context.Context, input TradeProposalInput, marketData map[string]interface{}) AgentOpinion {
	log.Printf("[DebateWorkflow] RiskAssessment starting for %s", input.Symbol)

	// Check for context cancellation
	if err := ctx.Err(); err != nil {
		return AgentOpinion{
			AgentName:            "risk_assessment",
			ActionRecommendation: "HOLD",
			ConfidenceScore:      0.0,
			Reasoning:            fmt.Sprintf("Risk assessment cancelled: %v", err),
		}
	}

	// Simulated risk assessment (matches existing workflow pattern)
	positionSize := input.AllocatorBudget * 0.02
	var95 := positionSize * 0.05
	sharpeRatio := 1.25
	volatility := 0.22

	// Risk-based action recommendation
	action := "HOLD"
	confidence := 0.70

	// Conservative approach: only BUY if risk is acceptable
	if sharpeRatio > 1.0 && volatility < 0.30 {
		action = "BUY"
		confidence = 0.75
	} else if volatility > 0.40 {
		action = "SELL"
		confidence = 0.65
	}

	opinion := AgentOpinion{
		AgentName:            "risk_assessment",
		ActionRecommendation: action,
		ConfidenceScore:      confidence,
		Reasoning: fmt.Sprintf(
			"Risk assessment: medium. VaR(95)=$%.2f, Sharpe Ratio=%.2f, Volatility=%.2f. Recommended position: $%.2f",
			var95, sharpeRatio, volatility, positionSize),
		SupportingData: map[string]interface{}{
			"var_95":            var95,
			"var_99":            positionSize * 0.08,
			"sharpe_ratio":      sharpeRatio,
			"volatility":        volatility,
			"max_drawdown":      0.12,
			"recommended_size":  positionSize,
			"analysis_timestamp": time.Now().Format(time.RFC3339),
		},
	}

	// Save to working memory
	if w.memory != nil {
		w.memory.SaveWorkingMemory(ctx, input.Symbol, MemoryEntry{
			Role:      "risk_assessment",
			Content:   fmt.Sprintf("Risk assessment complete: %s with %.2f confidence", action, confidence),
			Timestamp: time.Now(),
		})
	}

	return opinion
}

// executeMediatorPhase resolves conflicts between agent opinions.
func (w *DebateWorkflow) executeMediatorPhase(ctx context.Context, debateContext *DebateContext) *MediatorDecision {
	log.Printf("[DebateWorkflow] Phase 3: Mediator for %s (%d opinions)", debateContext.Symbol, len(debateContext.AgentOpinions))

	// Check for context cancellation
	if err := ctx.Err(); err != nil {
		return &MediatorDecision{
			FinalAction:         "HOLD",
			FinalConfidence:     0.0,
			ResolutionReasoning: fmt.Sprintf("Mediation cancelled: %v", err),
			ConflictSummary:     "Workflow cancelled during mediation",
			Strategy:            "ESCALATED",
		}
	}

	// Handle case with no opinions
	if len(debateContext.AgentOpinions) == 0 {
		return &MediatorDecision{
			FinalAction:         "HOLD",
			FinalConfidence:     0.0,
			ResolutionReasoning: "No agent opinions available for mediation",
			ConflictSummary:     "No opinions collected from parallel analysis",
			Strategy:            "ESCALATED",
		}
	}

	// Execute mediator resolution
	decision, err := w.mediator.Resolve(ctx, debateContext)
	if err != nil {
		log.Printf("[DebateWorkflow] Mediator error: %v", err)
		return &MediatorDecision{
			FinalAction:         "HOLD",
			FinalConfidence:     0.0,
			ResolutionReasoning: fmt.Sprintf("Mediation failed: %v", err),
			ConflictSummary:     "Mediator resolution failed",
			Strategy:            "ESCALATED",
		}
	}

	// Save mediation result to memory
	if w.memory != nil {
		w.memory.SaveWorkingMemory(ctx, debateContext.Symbol, MemoryEntry{
			Role:      "mediator",
			Content:   fmt.Sprintf("Mediation complete: %s with %.2f confidence using %s strategy", decision.FinalAction, decision.FinalConfidence, decision.Strategy),
			Timestamp: time.Now(),
		})
	}

	log.Printf("[DebateWorkflow] Mediator decision: Action=%s, Confidence=%.2f, Strategy=%s",
		decision.FinalAction, decision.FinalConfidence, decision.Strategy)

	return decision
}

// executePortfolioManagerPhase synthesizes the final trade proposal.
func (w *DebateWorkflow) executePortfolioManagerPhase(ctx context.Context, input TradeProposalInput, marketData map[string]interface{}, debateContext *DebateContext, decision *MediatorDecision) *TradeProposalOutput {
	log.Printf("[DebateWorkflow] Phase 4: PortfolioManager for %s", input.Symbol)

	price := marketData["price"].(float64)
	volume := marketData["volume_24h"].(float64)

	// Extract risk metrics from risk assessment opinion if available
	var positionSizeUSD float64
	var var95 float64
	var sharpeRatio float64
	var maxDrawdown float64 = 0.12
	var riskLevel string = "medium"

	for _, opinion := range debateContext.AgentOpinions {
		if opinion.AgentName == "risk_assessment" && opinion.SupportingData != nil {
			if v, ok := opinion.SupportingData["recommended_size"].(float64); ok {
				positionSizeUSD = v
			}
			if v, ok := opinion.SupportingData["var_95"].(float64); ok {
				var95 = v
			}
			if v, ok := opinion.SupportingData["sharpe_ratio"].(float64); ok {
				sharpeRatio = v
			}
			if v, ok := opinion.SupportingData["max_drawdown"].(float64); ok {
				maxDrawdown = v
			}
			break
		}
	}

	// Default values if not found
	if positionSizeUSD == 0 {
		positionSizeUSD = input.AllocatorBudget * 0.02
	}
	if var95 == 0 {
		var95 = positionSizeUSD * 0.05
	}
	if sharpeRatio == 0 {
		sharpeRatio = 1.25
	}

	// Determine risk level based on volatility and drawdown
	if maxDrawdown > 0.20 {
		riskLevel = "high"
	} else if maxDrawdown < 0.10 {
		riskLevel = "low"
	}

	// Calculate target price and stop loss
	targetPrice := price * 1.10
	stopLoss := price * 0.95

	// Build reasoning from mediator decision and agent opinions
	reasoning := fmt.Sprintf(
		"Debate workflow analysis for %s using %s strategy. Mediator resolved to %s with %.2f confidence (%s strategy). "+
			"Market price: $%.2f, Volume: %.0f. Risk assessment: %s (VaR95: $%.2f, Sharpe: %.2f). "+
			"Position size: $%.2f. %s",
		input.Symbol, input.Strategy, decision.FinalAction, decision.FinalConfidence, decision.Strategy,
		price, volume, riskLevel, var95, sharpeRatio, positionSizeUSD,
		decision.ResolutionReasoning)

	// Check if escalation is required
	requiresApproval := true
	if decision.Strategy == "ESCALATED" {
		requiresApproval = true // Always require approval for escalated decisions
	}

	output := &TradeProposalOutput{
		Symbol:          input.Symbol,
		Action:          decision.FinalAction,
		ConfidenceScore: decision.FinalConfidence,
		Reasoning:       reasoning,
		RiskAssessment: &RiskAssessmentSummary{
			Assessment:      riskLevel,
			PositionSizeUSD: positionSizeUSD,
			VaR95:           var95,
			SharpeRatio:     sharpeRatio,
			MaxDrawdown:     maxDrawdown,
		},
		SupportingData: &SupportingData{
			PriceAtAnalysis: price,
			Volume24h:       volume,
			TargetPrice:     &targetPrice,
			StopLoss:        &stopLoss,
		},
		RequiresApproval: requiresApproval,
		ProposalExpiry:   time.Now().Add(24 * time.Hour),
		Metadata: map[string]interface{}{
			"workflow_type":      "debate",
			"mediation_strategy": decision.Strategy,
			"conflict_summary":   decision.ConflictSummary,
			"agent_count":        len(debateContext.AgentOpinions),
			"debate_round":       debateContext.DebateRound,
		},
	}

	// Save to working memory
	if w.memory != nil {
		w.memory.SaveWorkingMemory(ctx, input.Symbol, MemoryEntry{
			Role:      "portfolio_manager",
			Content:   fmt.Sprintf("Final proposal: %s %s with %.2f confidence", decision.FinalAction, input.Symbol, decision.FinalConfidence),
			Timestamp: time.Now(),
		})
	}

	return output
}

// GetAgents returns the trading agents used by this workflow.
func (w *DebateWorkflow) GetAgents() *TradingAgents {
	return w.agents
}

// GetMediator returns the mediator agent used by this workflow.
func (w *DebateWorkflow) GetMediator() *MediatorAgent {
	return w.mediator
}
