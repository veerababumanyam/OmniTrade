// Copyright (c) 2026 OmniTrade
// Momentum Indicators Implementation

package indicator

import (
	"context"
	"fmt"

	"indicator/v2/momentum"
	"indicator/v2/trend"
	"indicator/v2/volume"
)

// calculateMomentum handles all momentum indicator calculations
func (s *Service) calculateMomentum(ctx context.Context, req *CalculationRequest) (*IndicatorResult, error) {
	switch req.Name {
	case "stochastic":
		return s.calculateStochastic(req)
	case "williams_r":
		return s.calculateWilliamsR(req)
	case "awesome_oscillator":
		return s.calculateAwesomeOscillator(req)
	case "cci":
		return s.calculateCCI(req)
	case "mfi":
		return s.calculateMFI(req)
	default:
		return nil, fmt.Errorf("unknown momentum indicator: %s", req.Name)
	}
}

// calculateStochastic calculates Stochastic Oscillator
func (s *Service) calculateStochastic(req *CalculationRequest) (*IndicatorResult, error) {
	period := 14
	if p, ok := req.Params["period"].(int); ok && p > 0 {
		period = p
	}

	stoch := momentum.NewStochasticOscillator[float64]()
	highs := sliceToChannel(req.Data.High)
	lows := sliceToChannel(req.Data.Low)
	closes := sliceToChannel(req.Data.Close)
	kLine, dLine := stoch.Compute(highs, lows, closes)
	kValues := channelToSlice(kLine)
	dValues := channelToSlice(dLine)

	lastK := lastValue(kValues)
	lastD := lastValue(dValues)

	var signal string
	switch {
	case lastK > 80:
		signal = "overbought"
	case lastK < 20:
		signal = "oversold"
	default:
		signal = "neutral"
	}

	return &IndicatorResult{
		Type:      IndicatorMomentum,
		Name:      "Stochastic",
		Values:    kValues,
		LastValue: lastK,
		Signals: map[string]float64{
			"k_line": lastK,
			"d_line": lastD,
		},
		Metadata: map[string]any{
			"period": period,
			"signal": signal,
		},
	}, nil
}

// calculateWilliamsR calculates Williams %R
func (s *Service) calculateWilliamsR(req *CalculationRequest) (*IndicatorResult, error) {
	period := 14
	if p, ok := req.Params["period"].(int); ok && p > 0 {
		period = p
	}

	wr := momentum.NewWilliamsR[float64]()
	highs := sliceToChannel(req.Data.High)
	lows := sliceToChannel(req.Data.Low)
	closes := sliceToChannel(req.Data.Close)
	output := wr.Compute(highs, lows, closes)
	values := channelToSlice(output)

	last := lastValue(values)

	var signal string
	switch {
	case last > -20:
		signal = "overbought"
	case last < -80:
		signal = "oversold"
	default:
		signal = "neutral"
	}

	return &IndicatorResult{
		Type:      IndicatorMomentum,
		Name:      "Williams %R",
		Values:    values,
		LastValue: last,
		Signals: map[string]float64{
			"value": last,
		},
		Metadata: map[string]any{
			"period": period,
			"signal": signal,
		},
	}, nil
}

// calculateAwesomeOscillator calculates Awesome Oscillator
func (s *Service) calculateAwesomeOscillator(req *CalculationRequest) (*IndicatorResult, error) {
	ao := momentum.NewAwesomeOscillator[float64]()
	highs := sliceToChannel(req.Data.High)
	lows := sliceToChannel(req.Data.Low)
	output := ao.Compute(highs, lows)
	values := channelToSlice(output)

	last := lastValue(values)

	var signal string
	switch {
	case last > 0:
		signal = "bullish"
	default:
		signal = "bearish"
	}

	return &IndicatorResult{
		Type:      IndicatorMomentum,
		Name:      "Awesome Oscillator",
		Values:    values,
		LastValue: last,
		Signals: map[string]float64{
			"value": last,
		},
		Metadata: map[string]any{
			"signal": signal,
		},
	}, nil
}

// calculateCCI calculates Commodity Channel Index
func (s *Service) calculateCCI(req *CalculationRequest) (*IndicatorResult, error) {
	period := 20
	if p, ok := req.Params["period"].(int); ok && p > 0 {
		period = p
	}

	cci := trend.NewCci[float64]()
	highs := sliceToChannel(req.Data.High)
	lows := sliceToChannel(req.Data.Low)
	closes := sliceToChannel(req.Data.Close)
	output := cci.Compute(highs, lows, closes)
	values := channelToSlice(output)

	last := lastValue(values)

	var signal string
	switch {
	case last > 100:
		signal = "overbought"
	case last < -100:
		signal = "oversold"
	default:
		signal = "neutral"
	}

	return &IndicatorResult{
		Type:      IndicatorMomentum,
		Name:      "CCI",
		Values:    values,
		LastValue: last,
		Signals: map[string]float64{
			"value": last,
		},
		Metadata: map[string]any{
			"period": period,
			"signal": signal,
		},
	}, nil
}

// calculateMFI calculates Money Flow Index
func (s *Service) calculateMFI(req *CalculationRequest) (*IndicatorResult, error) {
	period := 14
	if p, ok := req.Params["period"].(int); ok && p > 0 {
		period = p
	}

	mfi := volume.NewMfi[float64]()
	highs := sliceToChannel(req.Data.High)
	lows := sliceToChannel(req.Data.Low)
	closes := sliceToChannel(req.Data.Close)
	volumes := sliceToChannel(req.Data.Volume)
	output := mfi.Compute(highs, lows, closes, volumes)
	values := channelToSlice(output)

	last := lastValue(values)

	var signal string
	switch {
	case last > 80:
		signal = "overbought"
	case last < 20:
		signal = "oversold"
	default:
		signal = "neutral"
	}

	return &IndicatorResult{
		Type:      IndicatorMomentum,
		Name:      "Money Flow Index",
		Values:    values,
		LastValue: last,
		Signals: map[string]float64{
			"value": last,
		},
		Metadata: map[string]any{
			"period": period,
			"signal": signal,
		},
	}, nil
}
