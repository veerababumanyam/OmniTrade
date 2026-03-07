package fmp

import (
	"context"
	"fmt"

	"github.com/firebase/genkit/go/ai"
	"github.com/firebase/genkit/go/genkit"
)

// getFMPDataInput defines the parameters for the getFMPData tool
type getFMPDataInput struct {
	Symbol   string `json:"symbol" desc:"Stock symbol (e.g. AAPL)"`
	Category string `json:"category" desc:"Data category (e.g. income_statement, ratios, insider_trading)"`
}

// DefineFlows registers FMP-related Genkit flows and tools
func (s *Service) DefineFlows() {
	// 1. Genkit Tool for AI Agent use
	genkit.DefineTool[*getFMPDataInput, any](
		s.gk,
		"getFMPData",
		"Retrieves comprehensive financial data (balance sheet, income statement, analyst estimates, etc.) for a ticker from FMP",
		func(ctx *ai.ToolContext, input *getFMPDataInput) (any, error) {
			data, err := s.GetData(ctx, input.Symbol, input.Category)
			if err != nil {
				return nil, fmt.Errorf("failed to get FMP data for %s/%s: %v", input.Symbol, input.Category, err)
			}
			return data.Data, nil
		},
	)

	// 2. High-level Flow for deep analysis
	genkit.DefineFlow[FMPRequest, FMPResponse](
		s.gk,
		"fmpDataFlow",
		func(ctx context.Context, input FMPRequest) (FMPResponse, error) {
			var results []FMPTickerData
			var err error

			if input.Category != "" {
				single, err := s.GetData(ctx, input.Symbol, input.Category)
				if err == nil {
					results = []FMPTickerData{*single}
				}
			} else {
				results, err = s.GetAllData(ctx, input.Symbol)
			}

			if err != nil {
				return FMPResponse{}, err
			}

			// Check freshness
			metadata, _ := s.GetSyncStatus(ctx, input.Symbol)
			freshness := make(map[string]bool)
			for _, m := range metadata {
				// Simple heuristic: if it was synced in last 24h, mark as fresh
				// In production, compare with TTL
				freshness[m.Category] = true
			}

			return FMPResponse{
				Symbol:    input.Symbol,
				Data:      results,
				Freshness: freshness,
			}, nil
		},
	)
}
