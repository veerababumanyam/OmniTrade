// Copyright (c) 2026 OmniTrade
// The 5 Lynch Criteria Strategy Implementation

package strategy

import (
	"context"
	"fmt"

	"indicator/v2/trend"
)

// ExecuteLynch5 implements The 5 Lynch Criteria Strategy
// 1. Prior Linearity (Uptrend)
// 2. Young Trend (Not extended)
// 3. No Deep Breakdowns (Shallow pullbacks)
// 4. Not Extended (Consolidating)
// 5. Strong Close (Breakout on volume)
func (s *Service) executeLynch5(ctx context.Context, req *ExecutionRequest) (*StrategyResult, error) {
	data := req.Data
	if len(data.Close) < 200 {
		return nil, fmt.Errorf("insufficient data for Lynch 5 strategy (need 200 periods)")
	}

	// 1. Trend Analysis (SMA 50 > SMA 200)
	sma50 := trend.NewSmaWithPeriod[float64](50)
	sma200 := trend.NewSmaWithPeriod[float64](200)

	closes50 := sliceToChannel(data.Close)
	closes200 := sliceToChannel(data.Close)

	sma50Values := channelToSlice(sma50.Compute(closes50))
	sma200Values := channelToSlice(sma200.Compute(closes200))

	lastIdx := len(data.Close) - 1
	isUptrend := sma50Values[len(sma50Values)-1] > sma200Values[len(sma200Values)-1]

	// 2. Volatility Contraction / Pullback Depth
	// Simple proxy: check if max pullback in last 20 days is < 15%
	maxPrice := 0.0
	for i := lastIdx - 20; i <= lastIdx; i++ {
		if data.High[i] > maxPrice {
			maxPrice = data.High[i]
		}
	}
	pullback := (maxPrice - data.Low[lastIdx]) / maxPrice
	isShallow := pullback < 0.15

	// 3. Breakout confirmation
	// Close > recent 20-day high and Volume > 1.5x average
	recentMax := 0.0
	avgVol := 0.0
	for i := lastIdx - 20; i < lastIdx; i++ {
		if data.High[i] > recentMax {
			recentMax = data.High[i]
		}
		avgVol += data.Volume[i]
	}
	avgVol /= 20

	isBreakout := data.Close[lastIdx] > recentMax
	isHighVolume := data.Volume[lastIdx] > (avgVol * 1.5)
	nearDayHigh := (data.High[lastIdx]-data.Close[lastIdx])/(data.High[lastIdx]-data.Low[lastIdx]) < 0.1

	action := ActionHold
	if isUptrend && isShallow && isBreakout && isHighVolume && nearDayHigh {
		action = ActionBuy
	}

	return &StrategyResult{
		Name:       "Lynch 5 Criteria",
		LastAction: action,
		Signals: map[string]any{
			"is_uptrend":     isUptrend,
			"is_shallow":     isShallow,
			"is_breakout":    isBreakout,
			"is_high_volume": isHighVolume,
		},
	}, nil
}
