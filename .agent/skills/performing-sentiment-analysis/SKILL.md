---
name: performing-sentiment-analysis
description: Gauging market mood from filtered news feeds, reddit/social sentiment, and analyst ratings. Use when analyzing "Market Mood" or news triggers.
---

# Performing Sentiment Analysis

This skill defines how the `Sentiment Analyst` agent gauges market psychology using news and social data via specialized MCP instrumentation.

## When to use this skill
- When analyzing news headlines for positive/negative triggers using **pgvector-server**.
- When monitoring social media sentiment (X, Reddit) for retail momentum.
- When interpreting changes in analyst ratings (Upgrades/Downgrades).
- When gauging the "Fear & Greed" index context.

## Workflow

- [ ] **News Discovery**: Use **`pgvector-server:search_news`** to find relevant semantic matches.
- [ ] **Sentiment Scoring**: Classify text as Positive, Negative, or Neutral (-1.0 to 1.0).
- [ ] **Crowd Pulse**: Detect "Hype" cycles or "Panic" sell-offs in social frequency.
- [ ] **Contrarian Check**: Identify extreme optimism/pessimism as potential reversal points.

## Instructions

### 1. Vector Search for News
Semantic search helps identify news that standard keyword matching might miss.
```bash
tools/call pgvector-server search_news {
  "query": "rate cut expectations sentiment",
  "symbol": "AAPL",
  "limit": 10
}
```

### 2. Sentiment Sources
- **Official News**: Reuters, Bloomberg, earnings press releases (High Weight).
- **Social Media**: Retail-driven momentum, "meme stock" detection (Medium Weight).
- **Analyst Ratings**: Direct professional sentiment impacts (High Weight).

### 3. Heuristics
- **The "Buy the Rumor" Effect**: Positive sentiment often peaks *before* a news event.
- **Sentiment Divergence**: If the price is falling but sentiment is rising, watch for a potential "Value" bottom.

### 4. Scoring Rubric
- **1.0**: Unanimous Euphoria / Massive Upgrade cycle.
- **0.0**: Indecision / Contradictory news.
- **-1.0**: Catastrophic Failure / Systematic Fear.

## Resources
- [Leveraging MCP Ecosystem](../leveraging-omnitrade-mcp-ecosystem/SKILL.md)
- [Sentiment Analyst Spec](../../docs/02_Agent_Intelligence_System.md#33-sentiment-analyst)
- [Managing Redis Caching](../managing-redis-caching/SKILL.md) (For real-time feeds)
