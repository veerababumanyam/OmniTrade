// Copyright (c) 2026 OmniTrade
// Indicator Skills Service - Wrapper for indicator/v2

package indicator

import (
	"context"
	"fmt"
	"sync"
)

// Service provides indicator calculation capabilities for AI agents
type Service struct {
	mu sync.RWMutex
}

// NewService creates a new indicator service
func NewService() *Service {
	return &Service{}
}

// IndicatorType represents the type of indicator
type IndicatorType string

const (
	IndicatorTrend      IndicatorType = "trend"
	IndicatorMomentum   IndicatorType = "momentum"
	IndicatorVolatility IndicatorType = "volatility"
	IndicatorVolume     IndicatorType = "volume"
)

// IndicatorResult represents the result of an indicator calculation
type IndicatorResult struct {
	Type      IndicatorType      `json:"type"`
	Name      string             `json:"name"`
	Values    []float64          `json:"values,omitempty"`
	LastValue float64            `json:"last_value,omitempty"`
	Signals   map[string]float64 `json:"signals,omitempty"`
	Metadata  map[string]any     `json:"metadata,omitempty"`
}

// CalculationRequest represents a request to calculate an indicator
type CalculationRequest struct {
	Indicator IndicatorType  `json:"indicator"`
	Name      string         `json:"name"`
	Params    map[string]any `json:"params"`
	Data      *OHLCVData     `json:"data"`
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

// Calculate executes an indicator calculation
func (s *Service) Calculate(ctx context.Context, req *CalculationRequest) (*IndicatorResult, error) {
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}

	switch req.Indicator {
	case IndicatorTrend:
		return s.calculateTrend(ctx, req)
	case IndicatorMomentum:
		return s.calculateMomentum(ctx, req)
	case IndicatorVolatility:
		return s.calculateVolatility(ctx, req)
	case IndicatorVolume:
		return s.calculateVolume(ctx, req)
	default:
		return nil, fmt.Errorf("unknown indicator type: %s", req.Indicator)
	}
}

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
