---
name: implementing-trading-strategies
description: Designs and implements OmniTrade's trading strategies, incorporating Alpha, Momentum, Arbitrage, and Sentiment-based models. Use when creating specific trading strategies or strategies (e.g., Short-term Alpha, Mid-term Growth).
---

# Implementing Trading Strategies

This skill provides the structure for the OmniTrade strategies across different time horizons, risk profiles, and asset classes.

## When to use this skill
- When designing **Short-term Alpha** strategies (earnings surprises, news-driven sentiment).
- When implementing **Mid-term Growth** strategies (fundamental ranking, Qlib-style pipelines).
- When creating **Intraday High-Volatility** strategies for commodities (Gold, Silver, Oil).
- When combining ML quantitative signals with qualitative LLM agent analysis.
- When configuring strategy-specific risk limits (Stop-loss, Take-profit).

## Workflow

- [ ] **Define Time Horizon**: Short-term (days/weeks), Mid-term (months/years), or Intraday (minutes/hours).
- [ ] **Select Core Signals**: Choose Fundamental (PE, Earnings), Technical (RSI, Support/Resistance), or Sentiment (News spikes).
- [ ] **ML/LLM Synergy**: Connect qualitative agents (Sentiment Analyst) with quantitative models (LightGBM ranking).
- [ ] **Risk Gating**: Set strategy-specific stop-losses (e.g., 5-8% for momentum) and position sizing rules.
- [ ] **Veto Policy**: Ensure the Risk Manager agent can veto any strategy-specific signal if market-wide risk (VIX) is too high.
- [ ] **Performance Review**: Monitor Sharpe Ratio and Drawdown; adjust rebalancing frequency (weekly/monthly/quarterly) accordingly.

## Instructions

### 1. Short-Term Alpha (Immediate Growth)
Focus on news, earnings, and sentiment shifts.
- **Mechanism**: Sentiment Analyst (FinGPT) spikes + Fundamental Agent validation.
- **Stop-loss**: Tight trailing (5-8%).

### 2. Mid-Term Steady Growth
Focus on deep value and macroeconomic trends.
- **Mechanism**: LightGBM factor ranking (Qlib) + Deep Fundamental RAG (10-K/10-Q).
- **Rebalancing**: Monthly or quarterly to minimize transaction costs.

### 3. Intraday Commodities (Gold/Silver/Oil)
Focus on high-velocity price movements.
- **Mechanism**: Reinforcement Learning (PPO) on tick data + statistical arbitrage.
- **Constraint**: No overnight positions; intraday risk limits are absolute.

### 4. Meta-Learner Integration (Stacking)
```go
// Go Logic in Portfolio Manager
s := metaLearner.Ensemble(mlSignal, llmAgentSignal)
if s.Confidence >= 0.84 { // Strategy-specific high confidence
    proposal.Action = "BUY"
}
```

## Resources
- [Strategy Reference](resources/STRATEGY_LIST.md)
- [Example: Momentum Strategy](examples/momentum_strategy.go)
