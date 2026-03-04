// Copyright (c) 2026 OmniTrade
// Volatility Indicators Implementation

package indicator

import (
	"context"
	"fmt"

	"indicator/v2/volatility"
)

// calculateVolatility handles all volatility indicator calculations
func (s *Service) calculateVolatility(ctx context.Context, req *CalculationRequest) (*IndicatorResult, error) {
	switch req.Name {
	case "atr":
		return s.calculateATR(req)
	case "keltner_channel":
		return s.calculateKeltnerChannel(req)
	case "donchian_channel":
		return s.calculateDonchianChannel(req)
	case "ulcer_index":
		return s.calculateUlcerIndex(req)
	default:
		return nil, fmt.Errorf("unknown volatility indicator: %s", req.Name)
	}
}

// calculateKeltnerChannel calculates Keltner Channel
func (s *Service) calculateKeltnerChannel(req *CalculationRequest) (*IndicatorResult, error) {
	period := 20
	multiplier := 2.0

	if p, ok := req.Params["period"].(int); ok && p > 0 {
		period = p
	}
	if m, ok := req.Params["multiplier"].(float64); ok && m > 0 {
		multiplier = m
	}

	kc := volatility.NewKeltnerChannel[float64]()
	highs := sliceToChannel(req.Data.High)
	lows := sliceToChannel(req.Data.Low)
	closes := sliceToChannel(req.Data.Close)
	upper, middle, lower := kc.Compute(highs, lows, closes)

	upperValues := channelToSlice(upper)
	middleValues := channelToSlice(middle)
	lowerValues := channelToSlice(lower)

	lastUpper := lastValue(upperValues)
	lastMiddle := lastValue(middleValues)
	lastLower := lastValue(lowerValues)
	currentPrice := lastValue(req.Data.Close)

	var signal string
	switch {
	case currentPrice > lastUpper:
		signal = "above_upper"
	case currentPrice < lastLower:
		signal = "below_lower"
	default:
		signal = "within_bands"
	}

	return &IndicatorResult{
		Type:      IndicatorVolatility,
		Name:      "Keltner Channel",
		LastValue: lastMiddle,
		Signals: map[string]float64{
			"upper_band":  lastUpper,
			"middle_band": lastMiddle,
			"lower_band":  lastLower,
		},
		Metadata: map[string]any{
			"period":        period,
			"multiplier":    multiplier,
			"signal":        signal,
			"current_price": currentPrice,
		},
	}, nil
}

// calculateDonchianChannel calculates Donchian Channel
func (s *Service) calculateDonchianChannel(req *CalculationRequest) (*IndicatorResult, error) {
	period := 20
	if p, ok := req.Params["period"].(int); ok && p > 0 {
		period = p
	}

	dc := volatility.NewDonchianChannel[float64]()
	closes := sliceToChannel(req.Data.Close)
	upper, lower, middle := dc.Compute(closes)

	upperValues := channelToSlice(upper)
	lowerValues := channelToSlice(lower)
	middleValues := channelToSlice(middle)

	lastUpper := lastValue(upperValues)
	lastLower := lastValue(lowerValues)
	lastMiddle := lastValue(middleValues)
	currentPrice := lastValue(req.Data.Close)

	var signal string
	switch {
	case currentPrice > lastUpper:
		signal = "breakout_up"
	case currentPrice < lastLower:
		signal = "breakdown_down"
	default:
		signal = "within_range"
	}

	return &IndicatorResult{
		Type:      IndicatorVolatility,
		Name:      "Donchian Channel",
		LastValue: lastMiddle,
		Signals: map[string]float64{
			"upper_band":  lastUpper,
			"middle_band": lastMiddle,
			"lower_band":  lastLower,
		},
		Metadata: map[string]any{
			"period":        period,
			"signal":        signal,
			"current_price": currentPrice,
		},
	}, nil
}

// calculateUlcerIndex calculates Ulcer Index
func (s *Service) calculateUlcerIndex(req *CalculationRequest) (*IndicatorResult, error) {
	period := 14
	if p, ok := req.Params["period"].(int); ok && p > 0 {
		period = p
	}

	ui := volatility.NewUlcerIndex[float64]()
	closes := sliceToChannel(req.Data.Close)
	output := ui.Compute(closes)
	values := channelToSlice(output)

	last := lastValue(values)

	// Ulcer Index below 3 is good, above 10 is poor
	var risk string
	switch {
	case last < 3:
		risk = "low"
	case last < 7:
		risk = "moderate"
	default:
		risk = "high"
	}

	return &IndicatorResult{
		Type:      IndicatorVolatility,
		Name:      "Ulcer Index",
		Values:    values,
		LastValue: last,
		Signals: map[string]float64{
			"value": last,
		},
		Metadata: map[string]any{
			"period": period,
			"risk":   risk,
		},
	}, nil
}
