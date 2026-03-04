---
name: performing-sentiment-analysis
description: Gauging market mood from filtered news feeds, reddit/social sentiment, and analyst ratings. Use when analyzing "Market Mood" or news triggers.
---

# Performing Sentiment Analysis

This skill defines how the `Sentiment Analyst` agent gauges the collective psychology of the market using news and social data.

## When to use this skill
- When analyzing news headlines for positive/negative triggers.
- When monitoring social media sentiment (X, Reddit) for retail momentum.
- When interpreting changes in analyst ratings (Upgrades/Downgrades).
- When gauging the "Fear & Greed" index context.

## Workflow

- [ ] **News Filtering**: Filter for high-impact keywords (e.g., "Earnings", "FDA", "Lawsuit", "FED").
- [ ] **Sentiment Scoring**: Classify text as Positive, Negative, or Neutral (-1.0 to 1.0).
- [ ] **Crowd Pulse**: Detect "Hype" cycles or "Panic" sell-offs in social frequency.
- [ ] **Contrarian Check**: Identify extreme optimism/pessimism as potential reversal points.

## Instructions

### 1. Sentiment Sources
- **Official News**: Reuters, Bloomberg, earnings press releases (High Weight).
- **Social Media**: Retail-driven momentum, "meme stock" detection (Medium Weight).
- **Analyst Ratings**: Direct professional sentiment impacts (High Weight).

### 2. Heuristics
- **The "Buy the Rumor" Effect**: Positive sentiment often peaks *before* a news event.
- **Sentiment Divergence**: If the price is falling but sentiment is rising, watch for a potential "Value" bottom.

### 3. Scoring Rubric
- **1.0**: Unanimous Euphoria / Massive Upgrade cycle.
- **0.0**: Indecision / Contradictory news.
- **-1.0**: Catastrophic Failure / Systematic Fear.

## Resources
- [Sentiment Analyst Spec](../../docs/02_Agent_Intelligence_System.md#33-sentiment-analyst)
- [Managing Redis Caching](../managing-redis-caching/SKILL.md) (For real-time feeds)
