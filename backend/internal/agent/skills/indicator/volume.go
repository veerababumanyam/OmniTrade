// Copyright (c) 2026 OmniTrade
// Volume Indicators Implementation

package indicator

import (
	"fmt"

	"github.com/cinar/indicator/v2/volume"
)

// calculateVolume handles all volume indicator calculations
func (s *Service) calculateVolume(ctx context.Context, req *CalculationRequest) (*IndicatorResult, error) {
	switch req.Name {
	case "obv":
		return s.calculateOBV(req)
	case "ad":
		return s.calculateAD(req)
	case "cmf":
		return s.calculateCMF(req)
	case "vwap":
		return s.calculateVWAP(req)
	default:
		return nil, fmt.Errorf("unknown volume indicator: %s", req.Name)
	}
}

// calculateOBV calculates On-Balance Volume
func (s *Service) calculateOBV(req *CalculationRequest) (*IndicatorResult, error) {
	obv := volume.NewObv[float64]()
	closes := sliceToChannel(req.Data.Close)
	volumes := sliceToChannel(req.Data.Volume)
	output := obv.Compute(closes, volumes)
	values := channelToSlice(output)

	last := lastValue(values)

	// Determine trend based on OBV direction
	var signal string
	if len(values) > 1 {
		prev := values[len(values)-2]
		switch {
		case last > prev:
			signal = "bullish"
		case last < prev:
			signal = "bearish"
		default:
			signal = "neutral"
		}
	} else {
		signal = "neutral"
	}

	return &IndicatorResult{
		Type:      IndicatorVolume,
		Name:      "OBV",
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

// calculateAD calculates Accumulation/Distribution Line
func (s *Service) calculateAD(req *CalculationRequest) (*IndicatorResult, error) {
	ad := volume.NewAd[float64]()
	highs := sliceToChannel(req.Data.High)
	lows := sliceToChannel(req.Data.Low)
	closes := sliceToChannel(req.Data.Close)
	volumes := sliceToChannel(req.Data.Volume)
	output := ad.Compute(highs, lows, closes, volumes)
	values := channelToSlice(output)

	last := lastValue(values)

	// Determine trend based on AD direction
	var signal string
	if len(values) > 1 {
		prev := values[len(values)-2]
		switch {
		case last > prev:
			signal = "accumulation"
		case last < prev:
			signal = "distribution"
		default:
			signal = "neutral"
		}
	} else {
		signal = "neutral"
	}

	return &IndicatorResult{
		Type:      IndicatorVolume,
		Name:      "Accumulation/Distribution",
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

// calculateCMF calculates Chaikin Money Flow
func (s *Service) calculateCMF(req *CalculationRequest) (*IndicatorResult, error) {
	period := 20
	if p, ok := req.Params["period"].(int); ok && p > 0 {
		period = p
	}

	cmf := volume.NewCmf[float64]()
	highs := sliceToChannel(req.Data.High)
	lows := sliceToChannel(req.Data.Low)
	closes := sliceToChannel(req.Data.Close)
	volumes := sliceToChannel(req.Data.Volume)
	output := cmf.Compute(highs, lows, closes, volumes)
	values := channelToSlice(output)

	last := lastValue(values)

	var signal string
	switch {
	case last > 0.1:
		signal = "strong_buying"
	case last > 0:
		signal = "buying"
	case last > -0.1:
		signal = "selling"
	default:
		signal = "strong_selling"
	}

	return &IndicatorResult{
		Type:      IndicatorVolume,
		Name:      "Chaikin Money Flow",
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

// calculateVWAP calculates Volume Weighted Average Price
func (s *Service) calculateVWAP(req *CalculationRequest) (*IndicatorResult, error) {
	vwap := volume.NewVwap[float64]()
	highs := sliceToChannel(req.Data.High)
	lows := sliceToChannel(req.Data.Low)
	closes := sliceToChannel(req.Data.Close)
	volumes := sliceToChannel(req.Data.Volume)
	output := vwap.Compute(highs, lows, closes, volumes)
	values := channelToSlice(output)

	last := lastValue(values)
	currentPrice := lastValue(req.Data.Close)

	var signal string
	switch {
	case currentPrice > last:
		signal = "above_vwap"
	case currentPrice < last:
		signal = "below_vwap"
	default:
		signal = "at_vwap"
	}

	return &IndicatorResult{
		Type:      IndicatorVolume,
		Name:      "VWAP",
		Values:    values,
		LastValue: last,
		Signals: map[string]float64{
			"value":         last,
			"current_price": currentPrice,
		},
		Metadata: map[string]any{
			"signal":        signal,
			"current_price": currentPrice,
		},
	}, nil
}
