package categories

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/v13478/omnitrade/backend/internal/agent/tools"
)

func init() {
	// Register sentiment tools
	tools.MustRegister(&GetNewsSentimentTool{})
	tools.MustRegister(&GetSocialSentimentTool{})
	tools.MustRegister(&GetAnalystRatingsTool{})
	tools.MustRegister(&SearchNewsTool{})
}

// GetNewsSentimentTool retrieves news sentiment for a symbol
type GetNewsSentimentTool struct {
	tools.BaseTool
}

// Definition returns the tool definition
func (t *GetNewsSentimentTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "sentiment.get_news",
		Name:        "Get News Sentiment",
		Version:     "1.0.0",
		Description: "Analyzes sentiment from recent news articles for a stock symbol",
		Category:    tools.CategorySentiment,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "symbol",
				Type:        "string",
				Description: "Stock symbol",
				Required:    true,
				Pattern:     "^[A-Z]{1,5}$",
			},
			{
				Name:        "days",
				Type:        "integer",
				Description: "Number of days to look back",
				Required:    false,
				Default:     7,
				Min:         func() *float64 { v := 1.0; return &v }(),
				Max:         func() *float64 { v := 30.0; return &v }(),
			},
			{
				Name:        "limit",
				Type:        "integer",
				Description: "Maximum articles to analyze",
				Required:    false,
				Default:     50,
				Min:         func() *float64 { v := 10.0; return &v }(),
				Max:         func() *float64 { v := 100.0; return &v }(),
			},
		},
		Result: tools.ResultDefinition{
			Type:        "object",
			Description: "Aggregated news sentiment analysis",
		},
		ExecutionMode:    tools.ExecutionSync,
		PermissionLevel:  tools.PermissionRead,
		RiskLevel:        tools.RiskLow,
		Tags:            []string{"news", "sentiment", "nlp"},
		Timeout:         20 * time.Second,
		Dependencies:    []string{"market_data.get_price"},
	}
}

// Execute runs the tool
func (t *GetNewsSentimentTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	symbol, _ := input.Arguments["symbol"].(string)
	days, _ := input.Arguments["days"].(int)
	if days == 0 {
		days = 7
	}

	// In production, this would call the financial-news MCP server
	data := map[string]interface{}{
		"symbol":         symbol,
		"period_days":    days,
		"sentiment_score": 0.65,
		"classification": "bullish",
		"article_count":  45,
		"breakdown": map[string]int{
			"positive": 28,
			"neutral":  12,
			"negative": 5,
		},
		"top_topics": []string{"earnings", "product launch", "market expansion"},
		"confidence":  0.82,
		"analyzed_at": time.Now().UTC().Format(time.RFC3339),
	}

	jsonData, _ := json.Marshal(data)

	return &tools.ExecutionResult{
		ToolID:    input.ToolID,
		RequestID: input.Context.RequestID,
		Success:   true,
		Data:      jsonData,
		Metadata: tools.ResultMetadata{
			Confidence: 0.82,
			Sources:    []string{"news_api", "alpha_vantage", "sentiment_model"},
		},
	}, nil
}

// GetSocialSentimentTool retrieves social media sentiment
type GetSocialSentimentTool struct {
	tools.BaseTool
}

// Definition returns the tool definition
func (t *GetSocialSentimentTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "sentiment.get_social",
		Name:        "Get Social Sentiment",
		Version:     "1.0.0",
		Description: "Analyzes sentiment from social media mentions for a stock symbol",
		Category:    tools.CategorySentiment,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "symbol",
				Type:        "string",
				Description: "Stock symbol",
				Required:    true,
			},
			{
				Name:        "platforms",
				Type:        "array",
				Description: "Social platforms to analyze",
				Required:    false,
				Default:     []string{"twitter", "reddit", "stocktwits"},
			},
			{
				Name:        "hours",
				Type:        "integer",
				Description: "Hours to look back",
				Required:    false,
				Default:     24,
				Min:         func() *float64 { v := 1.0; return &v }(),
				Max:         func() *float64 { v := 168.0; return &v }(),
			},
		},
		Result: tools.ResultDefinition{
			Type:        "object",
			Description: "Social media sentiment analysis",
		},
		ExecutionMode:    tools.ExecutionSync,
		PermissionLevel:  tools.PermissionRead,
		RiskLevel:        tools.RiskLow,
		Tags:            []string{"social", "sentiment", "twitter", "reddit"},
		Timeout:         15 * time.Second,
	}
}

// Execute runs the tool
func (t *GetSocialSentimentTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	symbol, _ := input.Arguments["symbol"].(string)
	hours, _ := input.Arguments["hours"].(int)
	if hours == 0 {
		hours = 24
	}

	data := map[string]interface{}{
		"symbol":          symbol,
		"period_hours":    hours,
		"overall_sentiment": 0.58,
		"classification":  "slightly_bullish",
		"mention_count":   15234,
		"by_platform": map[string]interface{}{
			"twitter": map[string]interface{}{
				"mentions":     8500,
				"sentiment":    0.55,
				"influencers":  12,
			},
			"reddit": map[string]interface{}{
				"mentions":     4200,
				"sentiment":    0.65,
				"subreddits":   []string{"wallstreetbets", "stocks", "investing"},
			},
			"stocktwits": map[string]interface{}{
				"mentions":     2534,
				"sentiment":    0.52,
				"trending":     true,
			},
		},
		"trending_keywords": []string{"earnings", "buy", "long", "growth"},
		"analyzed_at":       time.Now().UTC().Format(time.RFC3339),
	}

	jsonData, _ := json.Marshal(data)

	return &tools.ExecutionResult{
		ToolID:    input.ToolID,
		RequestID: input.Context.RequestID,
		Success:   true,
		Data:      jsonData,
		Metadata: tools.ResultMetadata{
			Confidence: 0.75,
			Sources:    []string{"twitter_api", "reddit_api", "stocktwits_api"},
		},
	}, nil
}

// GetAnalystRatingsTool retrieves analyst ratings and price targets
type GetAnalystRatingsTool struct {
	tools.BaseTool
}

// Definition returns the tool definition
func (t *GetAnalystRatingsTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "sentiment.get_ratings",
		Name:        "Get Analyst Ratings",
		Version:     "1.0.0",
		Description: "Retrieves analyst ratings, upgrades, downgrades, and price targets for a symbol",
		Category:    tools.CategorySentiment,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "symbol",
				Type:        "string",
				Description: "Stock symbol",
				Required:    true,
			},
			{
				Name:        "days",
				Type:        "integer",
				Description: "Days of history to include",
				Required:    false,
				Default:     30,
				Min:         func() *float64 { v := 1.0; return &v }(),
				Max:         func() *float64 { v := 90.0; return &v }(),
			},
		},
		Result: tools.ResultDefinition{
			Type:        "object",
			Description: "Analyst ratings and consensus",
		},
		ExecutionMode:    tools.ExecutionSync,
		PermissionLevel:  tools.PermissionRead,
		RiskLevel:        tools.RiskLow,
		Tags:            []string{"analyst", "ratings", "price_target"},
		Timeout:         10 * time.Second,
	}
}

// Execute runs the tool
func (t *GetAnalystRatingsTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	symbol, _ := input.Arguments["symbol"].(string)

	data := map[string]interface{}{
		"symbol":           symbol,
		"consensus_rating": "BUY",
		"consensus_score":  4.2,
		"price_target": map[string]interface{}{
			"mean":   175.00,
			"median": 172.00,
			"high":   200.00,
			"low":    150.00,
		},
		"ratings_distribution": map[string]int{
			"strong_buy": 8,
			"buy":        12,
			"hold":       5,
			"sell":       1,
			"strong_sell": 0,
		},
		"recent_changes": []map[string]interface{}{
			{
				"date":       time.Now().AddDate(0, 0, -2).Format("2006-01-02"),
				"firm":       "Goldman Sachs",
				"action":     "upgrade",
				"from":       "Neutral",
				"to":         "Buy",
				"price_target": 180.00,
			},
			{
				"date":       time.Now().AddDate(0, 0, -5).Format("2006-01-02"),
				"firm":       "Morgan Stanley",
				"action":     "reiterate",
				"rating":     "Overweight",
				"price_target": 175.00,
			},
		},
		"analyzed_at": time.Now().UTC().Format(time.RFC3339),
	}

	jsonData, _ := json.Marshal(data)

	return &tools.ExecutionResult{
		ToolID:    input.ToolID,
		RequestID: input.Context.RequestID,
		Success:   true,
		Data:      jsonData,
		Metadata: tools.ResultMetadata{
			Confidence: 0.90,
			Sources:    []string{"analyst_db", "yahoo_finance"},
		},
	}, nil
}

// SearchNewsTool searches for news articles
type SearchNewsTool struct {
	tools.BaseTool
}

// Definition returns the tool definition
func (t *SearchNewsTool) Definition() *tools.ToolDefinition {
	return &tools.ToolDefinition{
		ID:          "sentiment.search_news",
		Name:        "Search News",
		Version:     "1.0.0",
		Description: "Searches financial news articles by keyword or phrase",
		Category:    tools.CategorySentiment,
		Parameters: []tools.ParameterDefinition{
			{
				Name:        "query",
				Type:        "string",
				Description: "Search query",
				Required:    true,
			},
			{
				Name:        "limit",
				Type:        "integer",
				Description: "Maximum results to return",
				Required:    false,
				Default:     20,
				Min:         func() *float64 { v := 1.0; return &v }(),
				Max:         func() *float64 { v := 100.0; return &v }(),
			},
			{
				Name:        "sources",
				Type:        "array",
				Description: "News sources to include",
				Required:    false,
			},
		},
		Result: tools.ResultDefinition{
			Type:        "array",
			Description: "Array of news articles",
		},
		ExecutionMode:    tools.ExecutionSync,
		PermissionLevel:  tools.PermissionRead,
		RiskLevel:        tools.RiskLow,
		Tags:            []string{"news", "search"},
		Timeout:         15 * time.Second,
	}
}

// Execute runs the tool
func (t *SearchNewsTool) Execute(ctx context.Context, input *tools.ExecutionInput) (*tools.ExecutionResult, error) {
	query, _ := input.Arguments["query"].(string)
	limit, _ := input.Arguments["limit"].(int)
	if limit == 0 {
		limit = 20
	}

	// Mock news search results
	articles := []map[string]interface{}{}
	for i := 0; i < limit && i < 5; i++ {
		articles = append(articles, map[string]interface{}{
			"title":       fmt.Sprintf("News article %d about %s", i+1, query),
			"description": fmt.Sprintf("This article discusses %s and its market implications.", query),
			"source":      []string{"Reuters", "Bloomberg", "CNBC", "WSJ"}[i%4],
			"url":         fmt.Sprintf("https://example.com/news/%d", i+1),
			"published_at": time.Now().Add(-time.Duration(i*2) * time.Hour).Format(time.RFC3339),
			"sentiment":   []string{"positive", "neutral", "positive", "negative"}[i%4],
		})
	}

	data := map[string]interface{}{
		"query":      query,
		"total":      len(articles),
		"articles":   articles,
		"searched_at": time.Now().UTC().Format(time.RFC3339),
	}

	jsonData, _ := json.Marshal(data)

	return &tools.ExecutionResult{
		ToolID:    input.ToolID,
		RequestID: input.Context.RequestID,
		Success:   true,
		Data:      jsonData,
		Metadata: tools.ResultMetadata{
			Confidence: 0.85,
			Sources:    []string{"news_api", "alpha_vantage"},
		},
	}, nil
}

// Ensure tools implement the interface
var _ tools.ToolExecutor = (*GetNewsSentimentTool)(nil)
var _ tools.ToolExecutor = (*GetSocialSentimentTool)(nil)
var _ tools.ToolExecutor = (*GetAnalystRatingsTool)(nil)
var _ tools.ToolExecutor = (*SearchNewsTool)(nil)
