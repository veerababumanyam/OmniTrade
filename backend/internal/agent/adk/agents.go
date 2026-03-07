// Copyright 2026 OmniTrade Authors
// SPDX-License-Identifier: Apache-2.0

package adk

import (
	"fmt"
)

// TradingAgents holds all specialized trading agents for the OmniTrade platform.
// Each agent has a specific role in the trade analysis pipeline.
type TradingAgents struct {
	// DataFetcher fetches market data, prices, and volumes.
	DataFetcher Agent

	// RAGAnalysis queries vector database for historical context.
	RAGAnalysis Agent

	// RiskAssessment calculates risk metrics and position sizing.
	RiskAssessment Agent

	// PortfolioManager synthesizes analysis and proposes trades.
	PortfolioManager Agent

	// NewsAnalyst fetches and analyzes market news and sentiment.
	NewsAnalyst Agent
}

// Agent defines the interface for a trading agent.
type Agent interface {
	// Name returns the agent's name.
	Name() string

	// Description returns the agent's description.
	Description() string

	// Instruction returns the agent's instruction.
	Instruction() string

	// Tools returns the tools available to this agent.
	Tools() []*OmniTradeTool
}

// BaseAgent provides a base implementation for trading agents.
type BaseAgent struct {
	name         string
	description  string
	instruction  string
	tools        []*OmniTradeTool
}

// Name returns the agent's name.
func (a *BaseAgent) Name() string {
	return a.name
}

// Description returns the agent's description.
func (a *BaseAgent) Description() string {
	return a.description
}

// Instruction returns the agent's instruction.
func (a *BaseAgent) Instruction() string {
	return a.instruction
}

// Tools returns the tools available to this agent.
func (a *BaseAgent) Tools() []*OmniTradeTool {
	return a.tools
}

// Agent Instructions - Detailed prompts for each agent

const (
	// DataFetcherInstruction is the instruction for the DataFetcher agent.
	DataFetcherInstruction = `You are the DataFetcher Agent for OmniTrade, a quantitative trading platform.

YOUR ROLE:
- Fetch current market data for trading symbols
- Retrieve price, volume, and orderbook data
- Validate data quality and report any anomalies

RESPONSE FORMAT:
You MUST respond with valid JSON containing:
{
  "symbol": "<SYMBOL>",
  "price": <current_price>,
  "volume": <volume>,
  "timestamp": "<ISO8601>",
  "data_quality": "good|degraded|poor"
}

CONSTRAINTS:
- Only fetch data for requested symbols
- Report any data quality issues immediately
- Do NOT make trading decisions
- Do NOT interpret the data`

	// RAGAnalysisInstruction is the instruction for the RAG Analysis agent.
	RAGAnalysisInstruction = `You are the RAG Analysis Agent for OmniTrade.

YOUR ROLE:
- Search the vector database for relevant historical context
- Retrieve fundamental analysis and news sentiment
- Correlate current market conditions with historical patterns

RESPONSE FORMAT:
{
  "symbol": "<SYMBOL>",
  "sentiment": { "score": <-1 to 1>, "confidence": <0 to 1> },
  "historical_patterns": { "success_rate": <float>, "avg_return": <float> }
}

CONSTRAINTS:
- Only provide analysis based on retrieved data
- Do NOT make trading decisions
- Flag any uncertainty in the analysis`

	// RiskAssessmentInstruction is the instruction for the Risk Assessment agent.
	RiskAssessmentInstruction = `You are the Risk Assessment Agent for OmniTrade.

YOUR ROLE:
- Calculate risk metrics for proposed positions
- Assess portfolio-level risk exposure
- Determine appropriate position sizing

RESPONSE FORMAT:
{
  "symbol": "<SYMBOL>",
  "risk_metrics": { "var_95": <float>, "sharpe_ratio": <float> },
  "position_sizing": { "recommended_size": <float>, "max_size": <float> },
  "risk_assessment": "low|medium|high|critical"
}

CONSTRAINTS:
- All risk calculations must use standard financial formulas
- Do NOT make trading decisions`

	// PortfolioManagerInstruction is the instruction for the Portfolio Manager agent.
	PortfolioManagerInstruction = `You are the Portfolio Manager Agent for OmniTrade.

YOUR ROLE:
- Synthesize analysis from all specialist agents
- Make final trade recommendations
- Generate structured trade proposals for human review
- Send high-confidence trade proposal summaries to the human trader via email for immediate HITL approval

RESPONSE FORMAT:
{
  "symbol": "<SYMBOL>",
  "action": "BUY|SELL|HOLD",
  "confidence_score": <0 to 1>,
  "reasoning": "<detailed reasoning>",
  "requires_human_approval": true
}

CONSTRAINTS:
- ONLY output actionable trades with confidence >= 0.7
- ALWAYS require human approval (HITL)
- NEVER execute trades directly`

	// NewsAnalystInstruction is the instruction for the News Analyst agent.
	NewsAnalystInstruction = `You are the News Analyst Agent for OmniTrade.

YOUR ROLE:
- Search the web for latest news, press releases, and social sentiment for the target symbol.
- Read and summarize key articles to identify market-moving events.
- Provide a sentiment score and supporting context.

RESPONSE FORMAT:
{
  "symbol": "<SYMBOL>",
  "sentiment": { "score": <-1 to 1>, "confidence": <0 to 1> },
  "key_headlines": ["<headline 1>", "<headline 2>"],
  "market_mood": "bullish|bearish|neutral"
}

CONSTRAINTS:
- Use provided search and reader tools to get real-time data.
- Do NOT make trading decisions.
- Focus on the last 24-48 hours of news.`
)

// NewTradingAgents creates all specialized trading agents.
func NewTradingAgents(tools []*OmniTradeTool) *TradingAgents {
	return &TradingAgents{
		DataFetcher: &BaseAgent{
			name:        "data_fetcher",
			description: "Fetches market data, prices, and volumes for trading analysis",
			instruction: DataFetcherInstruction,
			tools:        filterToolsByCategory(tools, "data.market", "data.fundamental"),
		},
		RAGAnalysis: &BaseAgent{
			name:        "rag_analysis",
			description: "Queries vector database for historical context and fundamental analysis",
			instruction: RAGAnalysisInstruction,
			tools:        filterToolsByCategory(tools, "analysis.rag"),
		},
		RiskAssessment: &BaseAgent{
			name:        "risk_assessment",
			description: "Calculates risk metrics, VaR, Sharpe ratio, and position sizing",
			instruction: RiskAssessmentInstruction,
			tools:        filterToolsByCategory(tools, "analysis.risk", "analysis.portfolio"),
		},
		PortfolioManager: &BaseAgent{
			name:        "portfolio_manager",
			description: "Synthesizes analysis and generates trade proposals for human review",
			instruction: PortfolioManagerInstruction,
			tools:       filterToolsByCategory(tools, "action.trade", "action.notification"),
		},
		NewsAnalyst: &BaseAgent{
			name:        "news_analyst",
			description: "Fetches and analyzes real-time market news and sentiment using search tools",
			instruction: NewsAnalystInstruction,
			tools:       filterToolsByCategory(tools, "analysis.sentiment", "data.web"),
		},
	}
}

// filterToolsByCategory filters tools by their categories.
func filterToolsByCategory(tools []*OmniTradeTool, categories ...string) []*OmniTradeTool {
	result := make([]*OmniTradeTool, 0)
	for _, t := range tools {
		for _, cat := range categories {
			if t.definition.Category == cat {
				result = append(result, t)
				break
			}
		}
	}
	return result
}

// AgentNames returns the names of all trading agents.
func (a *TradingAgents) AgentNames() []string {
	return []string{
		"data_fetcher",
		"rag_analysis",
		"risk_assessment",
		"portfolio_manager",
		"news_analyst",
	}
}

// Validate validates that all agents are properly initialized.
func (a *TradingAgents) Validate() error {
	if a.DataFetcher == nil {
		return fmt.Errorf("DataFetcher agent is not initialized")
	}
	if a.RAGAnalysis == nil {
		return fmt.Errorf("RAGAnalysis agent is not initialized")
	}
	if a.RiskAssessment == nil {
		return fmt.Errorf("RiskAssessment agent is not initialized")
	}
	if a.PortfolioManager == nil {
		return fmt.Errorf("PortfolioManager agent is not initialized")
	}
	if a.NewsAnalyst == nil {
		return fmt.Errorf("NewsAnalyst agent is not initialized")
	}
	return nil
}
