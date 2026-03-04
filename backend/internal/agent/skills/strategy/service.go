// Copyright (c) 2026 OmniTrade
// Strategy Skills Service - Trading Strategy Execution

package strategy

import (
	"context"
	"fmt"
	"sync"

	"github.com/cinar/indicator/v2/strategy"
	"github.com/cinar/indicator/v2/strategy/compound"
)

// Service provides strategy execution capabilities for AI agents
type Service struct {
	mu sync.RWMutex
}

// NewService creates a new strategy service
func NewService() *Service {
	return &Service{}
}

// StrategyType represents the type of trading strategy
type StrategyType string

const (
	StrategyBuyAndHold StrategyType = "buy_and_hold"
	StrategyMACDRSI    StrategyType = "macd_rsi"
	StrategyAnd        StrategyType = "and"
	StrategyOr         StrategyType = "or"
	StrategyMajority   StrategyType = "majority"
)

// Action represents the trading action
type Action string

const (
	ActionBuy  Action = "buy"
	ActionSell Action = "sell"
	ActionHold Action = "hold"
)

// StrategyResult represents the result of a strategy execution
type StrategyResult struct {
	Name      string              `json:"name"`
	Actions   []Action            `json:"actions"`
	LastAction Action             `json:"last_action"`
	Signals   map[string]any      `json:"signals"`
	Metadata  map[string]any      `json:"metadata,omitempty"`
}

// ExecutionRequest represents a request to execute a strategy
type ExecutionRequest struct {
	Strategy StrategyType  `json:"strategy"`
	Params   map[string]any `json:"params"`
	Data     *OHLCVData     `json:"data"`
}

// OHLCVData represents Open, High, Low, Close, Volume data
type OHLCVData struct {
	Symbol    string    `json:"symbol"`
	Timestamp []int64   `json:"timestamp"`
	Open      []float64 `json:"open"`
	High      []float64 `json:"high"`
	Low       []float64 `json:"low"`
	Close     []float64 `json:"close"`
	Volume    []float64 `json:"volume"`
}

// Execute executes a trading strategy
func (s *Service) Execute(ctx context.Context, req *ExecutionRequest) (*StrategyResult, error) {
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}

	switch req.Strategy {
	case StrategyBuyAndHold:
		return s.executeBuyAndHold(ctx, req)
	case StrategyMACDRSI:
		return s.executeMACDRSI(ctx, req)
	default:
		return nil, fmt.Errorf("unknown strategy type: %s", req.Strategy)
	}
}

// actionToAction converts strategy.Action to Action
func actionToAction(a strategy.Action) Action {
	switch a {
	case strategy.Buy:
		return ActionBuy
	case strategy.Sell:
		return ActionSell
	default:
		return ActionHold
	}
}
