package examples

import (
	"context"
	"fmt"
	"net/http"

	"github.com/google/genkit/go/genkit"
)

type MarketAnalysisInput struct {
	Symbol string `json:"symbol"`
}

type MarketAnalysisOutput struct {
	Confidence float64 `json:"confidence"`
	Reasoning  string  `json:"reasoning"`
}

func RegisterMarketAnalysisFlow() {
	genkit.DefineFlow("marketAnalysisFlow", func(ctx context.Context, input MarketAnalysisInput) (MarketAnalysisOutput, error) {
		// 1. Get current market data (Data Plane)
		price, _ := genkit.RunAsTool(ctx, "getPrice", MarketAnalysisInput{Symbol: input.Symbol})

		// 2. Perform analysis (Intelligence Plane)
		// ... logic for analysis ...

		return MarketAnalysisOutput{
			Confidence: 0.85,
			Reasoning:  fmt.Sprintf("Price of %s at $%v shows bullish breakout pattern.", input.Symbol, price),
		}, nil
	})
}

// Define GetPrice Tool
func DefineGetPriceTool() {
	genkit.DefineTool("getPrice", "gets current asset price", func(ctx context.Context, input MarketAnalysisInput) (float64, error) {
		// Mock price fetching logic
		return 50000.00, nil
	})
}
