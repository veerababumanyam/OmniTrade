// Copyright (c) 2026 OmniTrade
// Trading Strategy Implementations

package strategy

import (
	"context"
	"fmt"
	"time"

	"indicator/v2/asset"
	"indicator/v2/momentum"
	"indicator/v2/strategy"
	"indicator/v2/strategy/compound"
	"indicator/v2/trend"
)

// sliceToChannel converts a slice to a channel for indicator library
func sliceToChannel[T any](values []T) <-chan T {
	ch := make(chan T, len(values))
	for _, v := range values {
		ch <- v
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

// lastValue returns the last value from a slice
func lastValue[T comparable](values []T) T {
	var zero T
	if len(values) == 0 {
		return zero
	}
	return values[len(values)-1]
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

// executeBuyAndHold implements a simple buy and hold strategy
func (s *Service) executeBuyAndHold(ctx context.Context, req *ExecutionRequest) (*StrategyResult, error) {
	bs := strategy.NewBuyAndHoldStrategy()
	snapshots := dataToSnapshots(req.Data)
	actions := bs.Compute(snapshots)
	actionValues := channelToSlice(actions)

	// Convert strategy actions
	actionsList := make([]Action, len(actionValues))
	for i, a := range actionValues {
		actionsList[i] = actionToAction(a)
	}

	lastAction := ActionHold
	if len(actionsList) > 0 {
		lastAction = actionsList[len(actionsList)-1]
	}

	return &StrategyResult{
		Name:       "Buy and Hold",
		Actions:    actionsList,
		LastAction: lastAction,
		Signals: map[string]any{
			"recommendation": string(lastAction),
			"reason":         "always buy on first bar, hold thereafter",
		},
		Metadata: map[string]any{
			"type": "benchmark",
		},
	}, nil
}

// executeMACDRSI implements a combined MACD + RSI strategy
func (s *Service) executeMACDRSI(ctx context.Context, req *ExecutionRequest) (*StrategyResult, error) {
	// Get parameters with defaults
	fastPeriod := 12
	slowPeriod := 26
	signalPeriod := 9
	rsiPeriod := 14

	if f, ok := req.Params["fast_period"].(int); ok && f > 0 {
		fastPeriod = f
	}
	if sv, ok := req.Params["slow_period"].(int); ok && sv > 0 {
		slowPeriod = sv
	}
	if sp, ok := req.Params["signal_period"].(int); ok && sp > 0 {
		signalPeriod = sp
	}
	if rp, ok := req.Params["rsi_period"].(int); ok && rp > 0 {
		rsiPeriod = rp
	}

	// Use default MACD+RSI strategy (no period params in constructor)
	macdRsiStrategy := compound.NewMacdRsiStrategy()

	snapshots := dataToSnapshots(req.Data)
	actions := macdRsiStrategy.Compute(snapshots)
	actionValues := channelToSlice(actions)

	// Convert strategy actions
	actionsList := make([]Action, len(actionValues))
	for i, a := range actionValues {
		actionsList[i] = actionToAction(a)
	}

	lastAction := ActionHold
	if len(actionsList) > 0 {
		lastAction = actionsList[len(actionsList)-1]
	}

	// Calculate MACD and RSI for signal info
	macd := trend.NewMacdWithPeriod[float64](fastPeriod, slowPeriod, signalPeriod)
	rsi := momentum.NewRsiWithPeriod[float64](rsiPeriod)

	closes2 := sliceToChannel(req.Data.Close)
	macdLine, signalLine := macd.Compute(closes2)

	closes3 := sliceToChannel(req.Data.Close)
	rsiValues := rsi.Compute(closes3)

	macdSlice := channelToSlice(macdLine)
	signalSlice := channelToSlice(signalLine)
	rsiSlice := channelToSlice(rsiValues)

	lastMACD := lastValue(macdSlice)
	lastSignal := lastValue(signalSlice)
	lastRSI := lastValue(rsiSlice)

	histogram := lastMACD - lastSignal

	recommendation := string(lastAction)
	var reason string
	switch lastAction {
	case ActionBuy:
		reason = fmt.Sprintf("MACD bullish (histogram: %.2f) and RSI not overbought (%.2f)", histogram, lastRSI)
	case ActionSell:
		reason = fmt.Sprintf("MACD bearish (histogram: %.2f) or RSI overbought (%.2f)", histogram, lastRSI)
	default:
		reason = "no clear signal"
	}

	return &StrategyResult{
		Name:       "MACD + RSI",
		Actions:    actionsList,
		LastAction: lastAction,
		Signals: map[string]any{
			"recommendation": recommendation,
			"reason":         reason,
			"macd":           lastMACD,
			"signal":         lastSignal,
			"histogram":      histogram,
			"rsi":            lastRSI,
		},
		Metadata: map[string]any{
			"fast_period":   fastPeriod,
			"slow_period":   slowPeriod,
			"signal_period": signalPeriod,
			"rsi_period":    rsiPeriod,
			"type":          "momentum",
		},
	}, nil
}
