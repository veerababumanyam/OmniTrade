// Copyright (c) 2026 OmniTrade
// Trend Indicators Implementation

package indicator

import (
	"context"
	"fmt"

	"github.com/cinar/indicator/v2/helper"
	"github.com/cinar/indicator/v2/trend"
)

// calculateTrend handles all trend indicator calculations
func (s *Service) calculateTrend(ctx context.Context, req *CalculationRequest) (*IndicatorResult, error) {
	switch req.Name {
	case "sma":
		return s.calculateSMA(req)
	case "ema":
		return s.calculateEMA(req)
	case "macd":
		return s.calculateMACD(req)
	case "rsi":
		return s.calculateRSI(req)
	case "bollinger_bands":
		return s.calculateBollingerBands(req)
	case "atr":
		return s.calculateATR(req)
	default:
		return nil, fmt.Errorf("unknown trend indicator: %s", req.Name)
	}
}

// calculateSMA calculates Simple Moving Average
func (s *Service) calculateSMA(req *CalculationRequest) (*IndicatorResult, error) {
	period := 20
	if p, ok := req.Params["period"].(int); ok && p > 0 {
		period = p
	}

	sma := trend.NewSmaWithPeriod[float64](period)
	input := sliceToChannel(req.Data.Close)
	output := sma.Compute(input)
	values := channelToSlice(output)

	return &IndicatorResult{
		Type:      IndicatorTrend,
		Name:      "SMA",
		Values:    values,
		LastValue: lastValue(values),
		Metadata: map[string]any{
			"period": period,
		},
	}, nil
}

// calculateEMA calculates Exponential Moving Average
func (s *Service) calculateEMA(req *CalculationRequest) (*IndicatorResult, error) {
	period := 20
	if p, ok := req.Params["period"].(int); ok && p > 0 {
		period = p
	}

	ema := trend.NewEmaWithPeriod[float64](period)
	input := sliceToChannel(req.Data.Close)
	output := ema.Compute(input)
	values := channelToSlice(output)

	return &IndicatorResult{
		Type:      IndicatorTrend,
		Name:      "EMA",
		Values:    values,
		LastValue: lastValue(values),
		Metadata: map[string]any{
			"period": period,
		},
	}, nil
}

// calculateMACD calculates Moving Average Convergence Divergence
func (s *Service) calculateMACD(req *CalculationRequest) (*IndicatorResult, error) {
	fast := 12
	slow := 26
	signal := 9

	if f, ok := req.Params["fast_period"].(int); ok && f > 0 {
		fast = f
	}
	if s, ok := req.Params["slow_period"].(int); ok && s > 0 {
		slow = s
	}
	if sp, ok := req.Params["signal_period"].(int); ok && sp > 0 {
		signal = sp
	}

	macd := trend.NewMacdWithPeriod[float64](fast, slow, signal)
	input := sliceToChannel(req.Data.Close)
	macdLine, signalLine := macd.Compute(input)

	macdValues := channelToSlice(macdLine)
	signalValues := channelToSlice(signalLine)

	// Calculate histogram
	histogram := make([]float64, len(macdValues))
	for i := 0; i < len(macdValues) && i < len(signalValues); i++ {
		histogram[i] = macdValues[i] - signalValues[i]
	}

	return &IndicatorResult{
		Type:   IndicatorTrend,
		Name:   "MACD",
		Values: macdValues,
		Signals: map[string]float64{
			"macd_line":   lastValue(macdValues),
			"signal_line": lastValue(signalValues),
			"histogram":   lastValue(histogram),
		},
		Metadata: map[string]any{
			"fast_period":   fast,
			"slow_period":   slow,
			"signal_period": signal,
			"macd_values":   macdValues,
			"signal_values": signalValues,
			"histogram":     histogram,
		},
	}, nil
}

// calculateRSI calculates Relative Strength Index
func (s *Service) calculateRSI(req *CalculationRequest) (*IndicatorResult, error) {
	period := 14
	if p, ok := req.Params["period"].(int); ok && p > 0 {
		period = p
	}

	rsi := momentum.NewRsiWithPeriod[float64](period)
	input := sliceToChannel(req.Data.Close)
	output := rsi.Compute(input)
	values := channelToSlice(output)

	last := lastValue(values)

	// Determine signal
	var signal string
	var overbought, oversold bool
	switch {
	case last > 70:
		signal = "overbought"
		overbought = true
	case last < 30:
		signal = "oversold"
		oversold = true
	default:
		signal = "neutral"
	}

	return &IndicatorResult{
		Type:      IndicatorTrend,
		Name:      "RSI",
		Values:    values,
		LastValue: last,
		Signals: map[string]float64{
			"value": last,
		},
		Metadata: map[string]any{
			"period":     period,
			"signal":     signal,
			"overbought": overbought,
			"oversold":   oversold,
		},
	}, nil
}

// calculateBollingerBands calculates Bollinger Bands
func (s *Service) calculateBollingerBands(req *CalculationRequest) (*IndicatorResult, error) {
	period := 20
	stdDev := 2.0

	if p, ok := req.Params["period"].(int); ok && p > 0 {
		period = p
	}
	if sd, ok := req.Params["std_dev"].(float64); ok && sd > 0 {
		stdDev = sd
	}

	bb := volatility.NewBollingerBands[float64]()
	input := sliceToChannel(req.Data.Close)
	upper, middle, lower := bb.Compute(input)

	upperValues := channelToSlice(upper)
	middleValues := channelToSlice(middle)
	lowerValues := channelToSlice(lower)

	lastUpper := lastValue(upperValues)
	lastMiddle := lastValue(middleValues)
	lastLower := lastValue(lowerValues)
	currentPrice := lastValue(req.Data.Close)

	// Calculate %B and bandwidth
	percentB := (currentPrice - lastLower) / (lastUpper - lastLower)
	bandwidth := (lastUpper - lastLower) / lastMiddle * 100

	// Determine squeeze
	squeeze := bandwidth < 10 // Low bandwidth indicates squeeze

	var signal string
	switch {
	case currentPrice > lastUpper:
		signal = "above_upper"
	case currentPrice < lastLower:
		signal = "below_lower"
	case percentB > 0.8:
		signal = "near_upper"
	case percentB < 0.2:
		signal = "near_lower"
	default:
		signal = "neutral"
	}

	return &IndicatorResult{
		Type:      IndicatorTrend,
		Name:      "Bollinger Bands",
		LastValue: lastMiddle,
		Signals: map[string]float64{
			"upper_band":  lastUpper,
			"middle_band": lastMiddle,
			"lower_band":  lastLower,
			"percent_b":   percentB,
			"bandwidth":   bandwidth,
		},
		Metadata: map[string]any{
			"period":        period,
			"std_dev":       stdDev,
			"signal":        signal,
			"squeeze":       squeeze,
			"current_price": currentPrice,
			"upper_values":  upperValues,
			"middle_values": middleValues,
			"lower_values":  lowerValues,
		},
	}, nil
}

// calculateATR calculates Average True Range
func (s *Service) calculateATR(req *CalculationRequest) (*IndicatorResult, error) {
	period := 14
	if p, ok := req.Params["period"].(int); ok && p > 0 {
		period = p
	}

	atr := volatility.NewAtrWithPeriod[float64](period)
	highs := sliceToChannel(req.Data.High)
	lows := sliceToChannel(req.Data.Low)
	closes := sliceToChannel(req.Data.Close)
	output := atr.Compute(highs, lows, closes)
	values := channelToSlice(output)

	last := lastValue(values)

	return &IndicatorResult{
		Type:      IndicatorTrend,
		Name:      "ATR",
		Values:    values,
		LastValue: last,
		Metadata: map[string]any{
			"period": period,
		},
	}, nil
}

// lastValue returns the last value from a slice or 0 if empty
func lastValue[T any](values []T) T {
	var zero T
	if len(values) == 0 {
		return zero
	}
	return values[len(values)-1]
}
