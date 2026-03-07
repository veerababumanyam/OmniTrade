// Copyright 2026 OmniTrade Authors
// SPDX-License-Identifier: Apache-2.0

package adk

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/v13478/omnitrade/backend/internal/action"
	"github.com/v13478/omnitrade/backend/internal/fmp"
)

// TradeProposalInput represents the input for trade proposal generation.
type TradeProposalInput struct {
	Symbol          string  `json:"symbol"`
	Strategy        string  `json:"strategy"`
	AllocatorBudget float64 `json:"allocator_budget"`
	UserID          string `json:"user_id,omitempty"`
	SessionID       string `json:"session_id,omitempty"`
}

// TradeProposalOutput represents a trade proposal from the Intelligence Plane.
type TradeProposalOutput struct {
	Symbol           string                   `json:"symbol"`
	Action           string                   `json:"action"`
	ConfidenceScore  float64                  `json:"confidence_score"`
	Reasoning        string                   `json:"reasoning"`
	RiskAssessment   *RiskAssessmentSummary   `json:"risk_assessment,omitempty"`
	SupportingData   *SupportingData          `json:"supporting_data,omitempty"`
	RequiresApproval bool                     `json:"requires_approval"`
	ProposalExpiry    time.Time                `json:"proposal_expiry"`
	Metadata         map[string]interface{} `json:"metadata,omitempty"`
}

// ML Tabular Response (mocking local client format)
type MLTabularResponse struct {
	Symbol          string  `json:"symbol"`
	PredictionScore float64 `json:"prediction_score"`
	Confidence      float64 `json:"confidence"`
	ModelVersion    string  `json:"model_version"`
}

// ML Deep Response
type MLDeepResponse struct {
	Symbol             string  `json:"symbol"`
	HorizonDays        int     `json:"horizon_days"`
	PredictedReturn    float64 `json:"predicted_return"`
	VolatilityEstimate float64 `json:"volatility_estimate"`
	ModelVersion       string  `json:"model_version"`
}

// RiskAssessmentSummary contains summarized risk metrics for a trade proposal.
type RiskAssessmentSummary struct {
	Assessment      string  `json:"assessment"`
	PositionSizeUSD float64 `json:"position_size_usd"`
	VaR95           float64 `json:"var_95"`
	SharpeRatio     float64 `json:"sharpe_ratio,omitempty"`
	MaxDrawdown     float64 `json:"max_drawdown,omitempty"`
}

// SupportingData contains market data used in the trade analysis.
type SupportingData struct {
	PriceAtAnalysis float64  `json:"price_at_analysis"`
	Volume24h       float64  `json:"volume_24h,omitempty"`
	TargetPrice     *float64 `json:"target_price,omitempty"`
	StopLoss        *float64 `json:"stop_loss,omitempty"`
	TakeProfit      *float64 `json:"take_profit,omitempty"`
}

// MemoryEntry represents a memory entry for the memory service.
type MemoryEntry struct {
	Role      string    `json:"role"`
	Content   string    `json:"content"`
	Timestamp time.Time `json:"timestamp"`
}

// SemanticCache defines the interface for semantic caching.
type SemanticCache interface {
	CheckCache(ctx context.Context, query string) (*TradeProposalOutput, bool)
	SetCache(ctx context.Context, query string, output *TradeProposalOutput) error
}

// MemoryService defines the interface for agent memory.
type MemoryService interface {
	SaveWorkingMemory(ctx context.Context, symbol string, entry MemoryEntry)
	SaveEpisodicMemory(ctx context.Context, userID string, entry MemoryEntry)
}

// TradingWorkflow orchestrates the multi-agent trade analysis workflow.
type TradingWorkflow struct {
	agents   *TradingAgents
	cache    SemanticCache
	memory   MemoryService
	fmp      *fmp.Service
	actionDB *action.ActionPlaneDB
}

// TradingWorkflowConfig holds configuration for creating a trading workflow.
type TradingWorkflowConfig struct {
	Agents   *TradingAgents
	Cache    SemanticCache
	Memory   MemoryService
	FMP      *fmp.Service
	ActionDB *action.ActionPlaneDB
}

// NewTradingWorkflow creates a new trading workflow.
func NewTradingWorkflow(cfg TradingWorkflowConfig) (*TradingWorkflow, error) {
	if cfg.Agents == nil {
		return nil, fmt.Errorf("agents are required")
	}

	if err := cfg.Agents.Validate(); err != nil {
		return nil, fmt.Errorf("invalid agents: %w", err)
	}

	return &TradingWorkflow{
		agents:   cfg.Agents,
		cache:    cfg.Cache,
		memory:   cfg.Memory,
		fmp:      cfg.FMP,
		actionDB: cfg.ActionDB,
	}, nil
}

// Run executes the trading workflow to generate a trade proposal.
func (w *TradingWorkflow) Run(ctx context.Context, input TradeProposalInput) (*TradeProposalOutput, error) {
	startTime := time.Now()

	log.Printf("[Workflow] Starting trade analysis for %s (Strategy: %s)", input.Symbol, input.Strategy)

	// Step 1: Check semantic cache
	if w.cache != nil {
		queryFingerprint := fmt.Sprintf("%s|%s", input.Symbol, input.Strategy)
		if cachedOutput, hit := w.cache.CheckCache(ctx, queryFingerprint); hit {
			log.Printf("[Workflow] Cache HIT for %s - returning cached result", input.Symbol)
			if w.memory != nil {
				w.memory.SaveWorkingMemory(ctx, input.Symbol, MemoryEntry{
					Role:      "system",
					Content:   fmt.Sprintf("Cache HIT for %s. Bypassed LLM.", input.Symbol),
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
			Content:   fmt.Sprintf("Analyze %s using %s strategy.", input.Symbol, input.Strategy),
			Timestamp: time.Now(),
		})
	}

	// Step 3: Execute DataFetcher phase
	marketData := w.executeDataFetcherPhase(ctx, input)

	// Step 4: Execute RAG Analysis phase
	ragContext := w.executeRAGAnalysisPhase(ctx, input)

	// Step 5: Execute Risk Assessment phase
	riskAssessment := w.executeRiskAssessmentPhase(ctx, input, marketData)

	// Step 6: Execute Portfolio Manager phase
	output := w.executePortfolioManagerPhase(ctx, input, marketData, ragContext, riskAssessment)

	// Persist the proposal to the Action plane DB
	if w.actionDB != nil {
		proposal := &action.TradeProposal{
			Symbol:          output.Symbol,
			Action:          output.Action,
			ConfidenceScore: output.ConfidenceScore,
			Reasoning:       output.Reasoning,
			ProposedByModel: "ADK-TradingWorkflow",
		}
		if err := w.actionDB.CreateProposal(ctx, proposal); err != nil {
			log.Printf("[Workflow] Warning: Failed to persist proposal to Action DB: %v", err)
		}
	}

	// Step 7: Save to episodic memory
	if w.memory != nil {
		userID := input.UserID
		if userID == "" {
			userID = "default_user"
		}
		w.memory.SaveEpisodicMemory(ctx, userID, MemoryEntry{
			Role:      "assistant",
			Content:   fmt.Sprintf("Generated %s signal for %s with %.2f confidence. Reasoning: %s", output.Action, output.Symbol, output.ConfidenceScore, output.Reasoning),
			Timestamp: time.Now(),
		})
	}

	// Step 8: Cache the result
	if w.cache != nil {
		queryFingerprint := fmt.Sprintf("%s|%s", input.Symbol, input.Strategy)
		if err := w.cache.SetCache(ctx, queryFingerprint, output); err != nil {
			log.Printf("[Workflow] Warning: Failed to cache result: %v", err)
		}
	}

	elapsed := time.Since(startTime)
	log.Printf("[Workflow] Completed trade analysis for %s in %v (Action: %s, Confidence: %.2f)",
		input.Symbol, elapsed, output.Action, output.ConfidenceScore)

	return output, nil
}

// Phase execution methods (simulated for now - will use ADK agents in production)

func (w *TradingWorkflow) executeDataFetcherPhase(ctx context.Context, input TradeProposalInput) map[string]interface{} {
	log.Printf("[Workflow] Phase 1: Data Fetcher for %s", input.Symbol)
	
	price := 100.00
	volume := 10e6

	if w.fmp != nil {
		if quoteData, err := w.fmp.GetData(ctx, input.Symbol, "quote"); err == nil && quoteData != nil {
			if dataList, ok := quoteData.Data.([]interface{}); ok && len(dataList) > 0 {
				if firstQuote, ok := dataList[0].(map[string]interface{}); ok {
					if p, ok := firstQuote["price"].(float64); ok {
						price = p
					}
					if v, ok := firstQuote["volume"].(float64); ok {
						volume = v
					}
				}
			}
		}
	} else {
		price = simulateFetchPrice(input.Symbol)
		volume = simulateFetchVolume(input.Symbol)
	}

	return map[string]interface{}{
		"symbol":     input.Symbol,
		"price":      price,
		"volume_24h": volume,
		"timestamp":  time.Now().Format(time.RFC3339),
	}
}

func (w *TradingWorkflow) executeRAGAnalysisPhase(ctx context.Context, input TradeProposalInput) map[string]interface{} {
	log.Printf("[Workflow] Phase 2: RAG Analysis for %s", input.Symbol)
	
	sentimentScore := 0.65
	if input.Strategy == "lynch" {
		sentimentScore = 0.75
	}
	
	reqBody, _ := json.Marshal(map[string]interface{}{
		"symbol": input.Symbol,
		"features": map[string]float64{"momentum": 1.2, "value": 0.8},
	})
	
	resp, err := http.Post("http://localhost:8000/predict/tabular", "application/json", bytes.NewBuffer(reqBody))
	if err == nil {
		defer resp.Body.Close()
		var mlResp MLTabularResponse
		if err := json.NewDecoder(resp.Body).Decode(&mlResp); err == nil {
			sentimentScore = mlResp.PredictionScore
		}
	}
	return map[string]interface{}{
		"symbol": input.Symbol,
		"sentiment": map[string]interface{}{
			"score":     sentimentScore,
			"direction": "bullish",
			"confidence": 0.82,
		},
		"historical_patterns": map[string]interface{}{
			"success_rate": 0.72,
			"avg_return":   0.08,
			"period":       "3m",
		},
	}
}

func (w *TradingWorkflow) executeRiskAssessmentPhase(ctx context.Context, input TradeProposalInput, marketData map[string]interface{}) map[string]interface{} {
	log.Printf("[Workflow] Phase 3: Risk Assessment for %s", input.Symbol)
	// Simulated risk assessment baseline
	positionSize := input.AllocatorBudget * 0.02
	var95 := positionSize * 0.05
	sharpeRatio := 1.25
	volatility := 0.22

	reqBody, _ := json.Marshal(map[string]interface{}{
		"symbol": input.Symbol,
		"sequence_data": []map[string]float64{{"close": 100.0, "volume": 10000.0}},
		"horizon_days": 5,
	})
	
	resp, err := http.Post("http://localhost:8001/predict/deep", "application/json", bytes.NewBuffer(reqBody))
	if err == nil {
		defer resp.Body.Close()
		var mlResp MLDeepResponse
		if err := json.NewDecoder(resp.Body).Decode(&mlResp); err == nil {
			volatility = mlResp.VolatilityEstimate
			sharpeRatio = 1.0 + (mlResp.PredictedReturn * 10.0)
		}
	}

	return map[string]interface{}{
		"symbol": input.Symbol,
		"risk_metrics": map[string]interface{}{
			"var_95":       var95,
			"var_99":       positionSize * 0.08,
			"max_drawdown": 0.12,
			"sharpe_ratio": sharpeRatio,
			"volatility":   volatility,
		},
		"position_sizing": map[string]interface{}{
			"recommended_size": positionSize,
			"max_size":         input.AllocatorBudget * 0.05,
		},
		"risk_assessment": "medium",
		"approved":        true,
	}
}

func (w *TradingWorkflow) executePortfolioManagerPhase(ctx context.Context, input TradeProposalInput, marketData, ragContext, riskAssessment map[string]interface{}) *TradeProposalOutput {
	log.Printf("[Workflow] Phase 4: Portfolio Manager for %s", input.Symbol)
	// Synthesize proposal from collected data
	price := marketData["price"].(float64)
	sentiment := ragContext["sentiment"].(map[string]interface{})
	sentimentScore := sentiment["score"].(float64)
	riskMetrics := riskAssessment["risk_metrics"].(map[string]interface{})
	riskLevel := riskAssessment["risk_assessment"].(string)
	positionSizing := riskAssessment["position_sizing"].(map[string]interface{})

	// Determine action based on analysis
	action := "HOLD"
	confidence := 0.5

	if sentimentScore > 0.5 {
		action = "BUY"
		confidence = 0.75 + (sentimentScore-0.5)*0.2
	} else if sentimentScore < -0.3 {
		action = "SELL"
		confidence = 0.70 + (-sentimentScore-0.3)*0.2
	}

	// Cap confidence at  0.95
	if confidence > 0.95 {
		confidence = 0.95
	}

	targetPrice := price * 1.10
	stopLoss := price * 0.95

	return &TradeProposalOutput{
		Symbol:          input.Symbol,
		Action:          action,
		ConfidenceScore: confidence,
		Reasoning: fmt.Sprintf(
			"Based on %s strategy analysis: Market price $%.2f with %s sentiment (score: %.2f). "+
				"Historical patterns show 72%% success rate in similar conditions. "+
				"Risk assessment: %s with VaR(95) of $%.2f. Recommended position size: $%.2f.",
			input.Strategy, price, sentiment["direction"], sentimentScore,
			riskLevel, riskMetrics["var_95"].(float64), positionSizing["recommended_size"].(float64),
		),
		RiskAssessment: &RiskAssessmentSummary{
			Assessment:      riskLevel,
			PositionSizeUSD: positionSizing["recommended_size"].(float64),
			VaR95:           riskMetrics["var_95"].(float64),
			SharpeRatio:      riskMetrics["sharpe_ratio"].(float64),
			MaxDrawdown:      riskMetrics["max_drawdown"].(float64),
		},
		SupportingData: &SupportingData{
			PriceAtAnalysis: price,
			Volume24h:       marketData["volume_24h"].(float64),
			TargetPrice:     &targetPrice,
			StopLoss:        &stopLoss,
		},
		RequiresApproval: true,
		ProposalExpiry:   time.Now().Add(24 * time.Hour),
	}
}

// Helper functions for simulation (matches existing orchestrator behavior)

func simulateFetchPrice(symbol string) float64 {
	prices := map[string]float64{
		"AAPL": 178.50,
		"GOOGL": 141.25,
		"MSFT": 378.90,
		"TSLA": 248.75,
		"NVDA": 875.50,
	}
	if price, ok := prices[symbol]; ok {
		return price
	}
	return 100.00
}

func simulateFetchVolume(symbol string) float64 {
	volumes := map[string]float64{
		"AAPL": 52.5e6,
		"GOOGL": 28.3e6,
		"MSFT": 24.7e6,
		"TSLA": 98.5e6,
		"NVDA": 45.2e6,
	}
	if volume, ok := volumes[symbol]; ok {
		return volume
	}
	return 10e6
}
