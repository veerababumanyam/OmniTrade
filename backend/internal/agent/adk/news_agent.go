// Copyright 2026 OmniTrade Authors
// SPDX-License-Identifier: Apache-2.0

package adk

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/firebase/genkit/go/ai"
	"github.com/firebase/genkit/go/genkit"
)

// ──────────────────────────────────────────────
// Z.ai Web Search / Reader HTTP Client
// ──────────────────────────────────────────────

// ZaiClient provides access to Z.ai MCP tools via direct HTTP.
type ZaiClient struct {
	apiKey     string
	httpClient *http.Client
}

// NewZaiClient creates a client for the Z.ai MCP endpoints.
// Falls back to ZAI_API_KEY env var if apiKey is empty.
func NewZaiClient(apiKey string) *ZaiClient {
	if apiKey == "" {
		apiKey = os.Getenv("ZAI_API_KEY")
	}
	return &ZaiClient{
		apiKey: apiKey,
		httpClient: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

// zaiMCPRequest is the JSON-RPC body sent to Z.ai MCP endpoints.
type zaiMCPRequest struct {
	JSONRPC string      `json:"jsonrpc"`
	ID      int         `json:"id"`
	Method  string      `json:"method"`
	Params  interface{} `json:"params"`
}

// zaiMCPResponse is the generic response envelope.
type zaiMCPResponse struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      int             `json:"id"`
	Result  json.RawMessage `json:"result,omitempty"`
	Error   *struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// SearchResult holds a search result with citation metadata.
type SearchResult struct {
	Title     string `json:"title"`
	URL       string `json:"url"`
	Summary   string `json:"summary"`
	Source    string `json:"source"`
	Published string `json:"published_at,omitempty"`
}

// WebSearch calls the Z.ai webSearchPrime tool.
func (c *ZaiClient) WebSearch(ctx context.Context, query string) ([]SearchResult, error) {
	if c.apiKey == "" {
		return nil, fmt.Errorf("ZAI_API_KEY not configured")
	}

	body := zaiMCPRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  "tools/call",
		Params: map[string]interface{}{
			"name": "webSearchPrime",
			"arguments": map[string]string{
				"query": query,
			},
		},
	}

	result, err := c.callMCP(ctx, "https://api.z.ai/api/mcp/web_search_prime/mcp", body)
	if err != nil {
		return nil, fmt.Errorf("web search failed: %w", err)
	}

	// Try to parse as array of objects
	var rawResults []map[string]interface{}
	if err := json.Unmarshal(result, &rawResults); err != nil {
		// Try as wrapper with "content" key
		var wrapper map[string]interface{}
		if err2 := json.Unmarshal(result, &wrapper); err2 == nil {
			if content, ok := wrapper["content"].([]interface{}); ok {
				for _, item := range content {
					if m, ok := item.(map[string]interface{}); ok {
						rawResults = append(rawResults, m)
					}
				}
			}
		}
		if len(rawResults) == 0 {
			return nil, fmt.Errorf("failed to parse search results: %w (raw: %s)", err, string(result))
		}
	}

	var results []SearchResult
	for _, r := range rawResults {
		sr := SearchResult{
			Title:   fmt.Sprintf("%v", r["title"]),
			URL:     fmt.Sprintf("%v", r["url"]),
			Summary: fmt.Sprintf("%v", r["summary"]),
		}
		if sn, ok := r["siteName"].(string); ok {
			sr.Source = sn
		}
		if pub, ok := r["publishedAt"].(string); ok {
			sr.Published = pub
		}
		results = append(results, sr)
	}

	return results, nil
}

// WebRead calls the Z.ai webReader tool to fetch a webpage.
func (c *ZaiClient) WebRead(ctx context.Context, url string) (string, error) {
	if c.apiKey == "" {
		return "", fmt.Errorf("ZAI_API_KEY not configured")
	}

	body := zaiMCPRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  "tools/call",
		Params: map[string]interface{}{
			"name": "webReader",
			"arguments": map[string]string{
				"url": url,
			},
		},
	}

	result, err := c.callMCP(ctx, "https://api.z.ai/api/mcp/web_reader/mcp", body)
	if err != nil {
		return "", fmt.Errorf("web read failed: %w", err)
	}

	return string(result), nil
}

// callMCP is the low-level HTTP transport to Z.ai MCP endpoints.
func (c *ZaiClient) callMCP(ctx context.Context, endpoint string, payload zaiMCPRequest) (json.RawMessage, error) {
	jsonBody, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewReader(jsonBody))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Z.ai returned HTTP %d: %s", resp.StatusCode, string(respBody))
	}

	var mcpResp zaiMCPResponse
	if err := json.Unmarshal(respBody, &mcpResp); err != nil {
		// Non-JSON-RPC response, return raw body
		return respBody, nil
	}
	if mcpResp.Error != nil {
		return nil, fmt.Errorf("Z.ai MCP error %d: %s", mcpResp.Error.Code, mcpResp.Error.Message)
	}

	return mcpResp.Result, nil
}

// ──────────────────────────────────────────────
// NewsAnalyst Execution (integrated into DebateWorkflow)
// ──────────────────────────────────────────────

// NewsAnalysisResult holds parsed results from the news agent.
type NewsAnalysisResult struct {
	Symbol       string         `json:"symbol"`
	Sentiment    float64        `json:"sentiment_score"`
	Confidence   float64        `json:"confidence"`
	MarketMood   string         `json:"market_mood"`
	Headlines    []string       `json:"key_headlines"`
	ArticleCount int            `json:"articles_analyzed"`
	Citations    []SearchResult `json:"citations,omitempty"`
	Source       string         `json:"source"`
}

// ──────────────────────────────────────────────
// DB + Redis Persistence for News Analysis
// ──────────────────────────────────────────────

// saveNewsToCache persists news analysis to Redis (4h TTL) and PostgreSQL.
func (w *DebateWorkflow) saveNewsToCache(ctx context.Context, result *NewsAnalysisResult, rawSearchResults []SearchResult) {
	// ── Redis Cache (fast path) ──
	if w.fmp != nil && w.fmp.Redis() != nil && w.fmp.Redis().Client != nil {
		cacheKey := fmt.Sprintf("news:analysis:%s", result.Symbol)
		jsonData, err := json.Marshal(result)
		if err == nil {
			w.fmp.Redis().Client.Set(ctx, cacheKey, string(jsonData), 4*time.Hour)
			log.Printf("[NewsAnalyst] Cached analysis for %s in Redis (4h TTL)", result.Symbol)
		}
	}

	// ── PostgreSQL (durable with citations) ──
	if w.fmp != nil && w.fmp.DB() != nil {
		db := w.fmp.DB()
		headlinesJSON, _ := json.Marshal(result.Headlines)
		citationsJSON, _ := json.Marshal(result.Citations)
		rawResultsJSON, _ := json.Marshal(rawSearchResults)

		query := `
			INSERT INTO news_analysis_cache
				(symbol, sentiment_score, confidence, market_mood, action_recommendation,
				 reasoning, headlines, citations, raw_search_results, articles_analyzed,
				 model_used, source, expires_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW() + INTERVAL '4 hours')
			ON CONFLICT (symbol, analysis_date)
			DO UPDATE SET
				sentiment_score = EXCLUDED.sentiment_score,
				confidence = EXCLUDED.confidence,
				market_mood = EXCLUDED.market_mood,
				action_recommendation = EXCLUDED.action_recommendation,
				reasoning = EXCLUDED.reasoning,
				headlines = EXCLUDED.headlines,
				citations = EXCLUDED.citations,
				raw_search_results = EXCLUDED.raw_search_results,
				articles_analyzed = EXCLUDED.articles_analyzed,
				model_used = EXCLUDED.model_used,
				source = EXCLUDED.source,
				expires_at = NOW() + INTERVAL '4 hours'`

		action := "HOLD"
		switch result.MarketMood {
		case "bullish":
			action = "BUY"
		case "bearish":
			action = "SELL"
		}

		reasoning := fmt.Sprintf("Sentiment: %.2f (%s). %d articles. Headlines: %s",
			result.Sentiment, result.MarketMood, result.ArticleCount,
			strings.Join(result.Headlines, "; "))

		_, err := db.Exec(query,
			result.Symbol, result.Sentiment, result.Confidence, result.MarketMood, action,
			reasoning, headlinesJSON, citationsJSON, rawResultsJSON, result.ArticleCount,
			"gemini-2.5-pro", result.Source,
		)
		if err != nil {
			log.Printf("[NewsAnalyst] Failed to persist to DB: %v", err)
		} else {
			log.Printf("[NewsAnalyst] Persisted analysis for %s to PostgreSQL with %d citations", result.Symbol, len(result.Citations))
		}
	}
}

// loadNewsFromCache tries to load cached news from Redis first, then PostgreSQL.
func (w *DebateWorkflow) loadNewsFromCache(ctx context.Context, symbol string) *NewsAnalysisResult {
	// ── Redis first (fast path) ──
	if w.fmp != nil && w.fmp.Redis() != nil && w.fmp.Redis().Client != nil {
		cacheKey := fmt.Sprintf("news:analysis:%s", symbol)
		cached, err := w.fmp.Redis().Client.Get(ctx, cacheKey).Result()
		if err == nil && cached != "" {
			var result NewsAnalysisResult
			if err := json.Unmarshal([]byte(cached), &result); err == nil {
				log.Printf("[NewsAnalyst] Cache HIT for %s from Redis", symbol)
				return &result
			}
		}
	}

	// ── PostgreSQL fallback (if within TTL) ──
	if w.fmp != nil && w.fmp.DB() != nil {
		db := w.fmp.DB()
		query := `
			SELECT sentiment_score, confidence, market_mood, headlines, citations,
			       articles_analyzed, source
			FROM news_analysis_cache
			WHERE symbol = $1 AND expires_at > NOW()
			ORDER BY created_at DESC
			LIMIT 1`

		var sentiment, confidence float64
		var mood, source string
		var headlinesJSON, citationsJSON string
		var articleCount int

		err := db.QueryRow(query, symbol).Scan(&sentiment, &confidence, &mood, &headlinesJSON, &citationsJSON, &articleCount, &source)
		if err == nil {
			var headlines []string
			var citations []SearchResult
			json.Unmarshal([]byte(headlinesJSON), &headlines)
			json.Unmarshal([]byte(citationsJSON), &citations)

			result := &NewsAnalysisResult{
				Symbol:       symbol,
				Sentiment:    sentiment,
				Confidence:   confidence,
				MarketMood:   mood,
				Headlines:    headlines,
				ArticleCount: articleCount,
				Citations:    citations,
				Source:       source + " (cached)",
			}
			log.Printf("[NewsAnalyst] Cache HIT for %s from PostgreSQL", symbol)
			return result
		}
	}

	return nil
}

// executeNewsAnalysis fetches real-time news sentiment using Z.ai search + Genkit LLM.
func (w *DebateWorkflow) executeNewsAnalysis(ctx context.Context, input TradeProposalInput, marketData map[string]interface{}) AgentOpinion {
	log.Printf("[DebateWorkflow] NewsAnalyst starting for %s", input.Symbol)

	// Check for context cancellation
	if err := ctx.Err(); err != nil {
		return AgentOpinion{
			AgentName:            "news_analyst",
			ActionRecommendation: "HOLD",
			ConfidenceScore:      0.0,
			Reasoning:            fmt.Sprintf("News analysis cancelled: %v", err),
		}
	}

	// ── Step 0: Check cache first ──
	if cached := w.loadNewsFromCache(ctx, input.Symbol); cached != nil {
		action := "HOLD"
		switch cached.MarketMood {
		case "bullish":
			action = "BUY"
		case "bearish":
			action = "SELL"
		}
		return AgentOpinion{
			AgentName:            "news_analyst",
			ActionRecommendation: action,
			ConfidenceScore:      cached.Confidence,
			Reasoning: fmt.Sprintf(
				"[CACHED] News sentiment for %s: %.2f (%s). %d articles. Source: %s. Headlines: %s",
				input.Symbol, cached.Sentiment, cached.MarketMood,
				cached.ArticleCount, cached.Source, strings.Join(cached.Headlines, "; ")),
			SupportingData: map[string]interface{}{
				"sentiment_score":   cached.Sentiment,
				"market_mood":       cached.MarketMood,
				"headlines":         cached.Headlines,
				"citations":         cached.Citations,
				"articles_analyzed": cached.ArticleCount,
				"source":            cached.Source,
			},
		}
	}

	// ── Step 1: Fetch news via Z.ai web search ──
	zai := NewZaiClient("")
	var allResults []SearchResult
	var rawArticles string

	searchResults, err := zai.WebSearch(ctx, fmt.Sprintf("%s stock news analysis last 48 hours", input.Symbol))
	if err != nil {
		log.Printf("[NewsAnalyst] Z.ai search failed: %v. Trying FMP news fallback.", err)
	} else {
		for i, sr := range searchResults {
			if i >= 10 {
				break
			}
			allResults = append(allResults, sr)
			rawArticles += fmt.Sprintf("- %s: %s (source: %s, url: %s)\n", sr.Title, sr.Summary, sr.Source, sr.URL)
		}
		log.Printf("[NewsAnalyst] Fetched %d results for %s via Z.ai", len(allResults), input.Symbol)
	}

	// ── Step 2: Fallback — try FMP stock news if Z.ai yielded nothing ──
	newsSource := "z.ai"
	if len(allResults) == 0 && w.fmp != nil {
		newsSource = "fmp"
		if newsData, err := w.fmp.GetData(ctx, input.Symbol, "stock_news"); err == nil && newsData != nil {
			if dataList, ok := newsData.Data.([]interface{}); ok {
				for i, item := range dataList {
					if i >= 10 {
						break
					}
					if article, ok := item.(map[string]interface{}); ok {
						title, _ := article["title"].(string)
						text, _ := article["text"].(string)
						url, _ := article["url"].(string)
						site, _ := article["site"].(string)
						pub, _ := article["publishedDate"].(string)
						if title != "" {
							sr := SearchResult{
								Title:     title,
								URL:       url,
								Source:    site,
								Published: pub,
							}
							snippet := text
							if len(snippet) > 200 {
								snippet = snippet[:200] + "..."
							}
							sr.Summary = snippet
							allResults = append(allResults, sr)
							rawArticles += fmt.Sprintf("- %s: %s (source: %s, url: %s)\n", title, snippet, site, url)
						}
					}
				}
			}
		}
		log.Printf("[NewsAnalyst] Fetched %d results for %s via FMP fallback", len(allResults), input.Symbol)
	}

	// ── Step 3: Use Genkit LLM to analyze sentiment ──
	var analysisResult *NewsAnalysisResult
	price := 0.0
	if p, ok := marketData["price"].(float64); ok {
		price = p
	}

	if w.gk != nil && len(allResults) > 0 {
		prompt := fmt.Sprintf(
			"%s\n\nAnalyze the following recent news for %s (current price: $%.2f):\n\n%s\n\n"+
				"Respond ONLY with valid JSON matching this schema:\n"+
				`{"symbol":"%s","sentiment_score":<-1.0 to 1.0>,"confidence":<0.0 to 1.0>,"market_mood":"bullish|bearish|neutral","key_headlines":["headline1","headline2"],"articles_analyzed":<int>}`,
			NewsAnalystInstruction, input.Symbol, price, rawArticles, input.Symbol,
		)

		response, err := genkit.Generate(ctx, w.gk,
			ai.WithModelName("googleai/gemini-2.5-pro"),
			ai.WithPrompt(prompt),
		)
		if err == nil && response != nil {
			text := response.Text()
			text = strings.TrimSpace(text)
			text = strings.TrimPrefix(text, "```json")
			text = strings.TrimPrefix(text, "```")
			text = strings.TrimSuffix(text, "```")
			text = strings.TrimSpace(text)

			var parsed NewsAnalysisResult
			if err := json.Unmarshal([]byte(text), &parsed); err == nil {
				parsed.Citations = allResults
				parsed.Source = newsSource
				analysisResult = &parsed
			} else {
				log.Printf("[NewsAnalyst] Failed to parse LLM JSON: %v. Raw: %s", err, text)
			}
		} else if err != nil {
			log.Printf("[NewsAnalyst] Genkit generation failed: %v", err)
		}
	}

	// ── Step 4: Build opinion + persist ──
	if analysisResult != nil {
		// Persist to DB + Redis cache with citations
		w.saveNewsToCache(ctx, analysisResult, allResults)

		action := "HOLD"
		switch analysisResult.MarketMood {
		case "bullish":
			action = "BUY"
		case "bearish":
			action = "SELL"
		}

		opinion := AgentOpinion{
			AgentName:            "news_analyst",
			ActionRecommendation: action,
			ConfidenceScore:      analysisResult.Confidence,
			Reasoning: fmt.Sprintf(
				"News sentiment for %s: %.2f (%s). %d articles analyzed via %s. Top headlines: %s",
				input.Symbol, analysisResult.Sentiment, analysisResult.MarketMood,
				analysisResult.ArticleCount, newsSource, strings.Join(analysisResult.Headlines, "; ")),
			SupportingData: map[string]interface{}{
				"sentiment_score":   analysisResult.Sentiment,
				"market_mood":       analysisResult.MarketMood,
				"headlines":         analysisResult.Headlines,
				"citations":         analysisResult.Citations,
				"articles_analyzed": analysisResult.ArticleCount,
				"source":            newsSource,
			},
		}

		if w.memory != nil {
			w.memory.SaveWorkingMemory(ctx, input.Symbol, MemoryEntry{
				Role:      "news_analyst",
				Content:   fmt.Sprintf("News analysis: %s mood (%.2f sentiment, %d articles, %d citations)", analysisResult.MarketMood, analysisResult.Sentiment, analysisResult.ArticleCount, len(analysisResult.Citations)),
				Timestamp: time.Now(),
			})
		}

		return opinion
	}

	// Fallback: no news data available
	log.Printf("[NewsAnalyst] No news data available for %s, returning neutral", input.Symbol)
	return AgentOpinion{
		AgentName:            "news_analyst",
		ActionRecommendation: "HOLD",
		ConfidenceScore:      0.3,
		Reasoning:            fmt.Sprintf("No recent news data available for %s. Defaulting to neutral.", input.Symbol),
		SupportingData: map[string]interface{}{
			"sentiment_score": 0.0,
			"market_mood":     "neutral",
			"source":          "fallback",
		},
	}
}
