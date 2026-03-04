// Copyright (c) 2026 OmniTrade
// Backtest Skills Service - Strategy Backtesting

package backtest

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/cinar/indicator/v2/asset"
	"github.com/cinar/indicator/v2/strategy"
)

// Service provides backtesting capabilities for AI agents
type Service struct {
	mu sync.RWMutex
}

// NewService creates a new backtest service
func NewService() *Service {
	return &Service{}
}

// BacktestRequest represents a backtesting request
type BacktestRequest struct {
	Name        string         `json:"name"`
	Strategy    any            `json:"strategy"` // strategy.Strategy interface
	InitialCash float64        `json:"initial_cash"`
	Data        *OHLCVData     `json:"data"`
	Params      map[string]any `json:"params"`
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

// BacktestResult represents the results of a backtest
type BacktestResult struct {
	Name         string             `json:"name"`
	Symbol       string             `json:"symbol"`
	StartDate    string             `json:"start_date"`
	EndDate      string             `json:"end_date"`
	Trades       int                `json:"trades"`
	WinRate      float64            `json:"win_rate"`
	TotalReturn  float64            `json:"total_return"`
	MaxDrawdown  float64            `json:"max_drawdown"`
	SharpeRatio  float64            `json:"sharpe_ratio"`
	FinalCash    float64            `json:"final_cash"`
	Positions    []*PositionResult  `json:"positions,omitempty"`
	EquityCurve  []float64          `json:"equity_curve,omitempty"`
	Metadata     map[string]any     `json:"metadata,omitempty"`
}

// PositionResult represents a single trade position
type PositionResult struct {
	EntryPrice float64   `json:"entry_price"`
	ExitPrice  float64   `json:"exit_price"`
	EntryDate  string    `json:"entry_date"`
	ExitDate   string    `json:"exit_date"`
	Shares     int       `json:"shares"`
	PnL        float64   `json:"pnl"`
	PnLPct     float64   `json:"pnl_pct"`
}

// Run executes a backtest
func (s *Service) Run(ctx context.Context, req *BacktestRequest) (*BacktestResult, error) {
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}

	// Get the strategy from the request
	strat, ok := req.Strategy.(strategy.Strategy)
	if !ok {
		return nil, fmt.Errorf("invalid strategy type: expected strategy.Strategy")
	}

	// Convert data to snapshots for the strategy
	snapshots := dataToSnapshots(req.Data)

	// Compute actions using the strategy
	actions := strat.Compute(snapshots)
	actionSlice := channelToSlice(actions)

	// Calculate basic metrics
	startDate := time.Unix(req.Data.Timestamp[0], 0).Format("2006-01-02")
	endDate := time.Unix(req.Data.Timestamp[len(req.Data.Timestamp)-1], 0).Format("2006-01-02")

	// Count trades (buy/sell actions)
	trades := 0
	for _, a := range actionSlice {
		if a == strategy.Buy || a == strategy.Sell {
			trades++
		}
	}

	return &BacktestResult{
		Name:        req.Name,
		Symbol:      req.Data.Symbol,
		StartDate:   startDate,
		EndDate:     endDate,
		Trades:      trades,
		WinRate:     0.0, // Would need more complex calculation
		TotalReturn: 0.0, // Would need more complex calculation
		MaxDrawdown: 0.0, // Would need more complex calculation
		SharpeRatio: 0.0, // Would need more complex calculation
		FinalCash:   req.InitialCash,
		Positions:   nil,
		EquityCurve: []float64{req.InitialCash},
		Metadata: map[string]any{
			"initial_cash": req.InitialCash,
			"actions":      len(actionSlice),
			"status":       "completed",
		},
	}, nil
}

// dataToSnapshots converts OHLCVData to asset.Snapshot channel
func dataToSnapshots(data *OHLCVData) <-chan *asset.Snapshot {
	ch := make(chan *asset.Snapshot, len(data.Close))
	for i := 0; i < len(data.Close); i++ {
		ch <- &asset.Snapshot{
			Date:   time.Unix(data.Timestamp[i], 0),
			Open:   data.Open[i],
			High:   data.High[i],
			Low:    data.Low[i],
			Close:  data.Close[i],
			Volume: data.Volume[i],
		}
	}
	close(ch)
	return ch
}

// channelToSlice converts a channel to a slice
func channelToSlice[T any](ch <-chan T) []T {
	var result []T
	for v := range ch {
		result = append(result, v)
	}
	return result
}

// Summary returns a summary of the backtest results
func (r *BacktestResult) Summary() string {
	return fmt.Sprintf(
		"Backtest: %s on %s from %s to %s\n"+
			"Trades: %d | Win Rate: %.2f%%\n"+
			"Total Return: %.2f%% | Max Drawdown: %.2f%%\n"+
			"Sharpe Ratio: %.2f | Final Cash: $%.2f",
		r.Name,
		r.Symbol,
		r.StartDate,
		r.EndDate,
		r.Trades,
		r.WinRate*100,
		r.TotalReturn*100,
		r.MaxDrawdown*100,
		r.SharpeRatio,
		r.FinalCash,
	)
}

// Validate validates the backtest results
func (r *BacktestResult) Validate() error {
	if r.FinalCash < 0 {
		return fmt.Errorf("final cash cannot be negative: %.2f", r.FinalCash)
	}
	if r.WinRate < 0 || r.WinRate > 1 {
		return fmt.Errorf("win rate must be between 0 and 1: %.2f", r.WinRate)
	}
	if len(r.EquityCurve) == 0 {
		return fmt.Errorf("equity curve is empty")
	}
	return nil
}
