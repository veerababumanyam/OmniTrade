---
name: performing-technical-analysis
description: interpreting RSI, MACD, Bollinger Bands, and support/resistance levels for market regime detection. Use when analyzing OHLCV data or momentum signals.
---

# Performing Technical Analysis

This skill defines the quantitative interpretation framework for the `Technical Analyst` agent, focusing on price action, volume, and momentum indicators.

## When to use this skill
- When analyzing real-time or historical OHLCV (Open, High, Low, Close, Volume) data.
- When interpreting common indicators like RSI (Relative Strength Index), MACD, and Bollinger Bands.
- When identifying Support and Resistance levels.
- When classifying the "Market Regime" (Trending, Mean-Reverting, or Breakout).

## Workflow

- [ ] **Regime Detection**: Is the price above/below the 200-day EMA? Is the ADX indicating a strong trend?
- [ ] **Momentum Pulse**: Check RSI for overbought (>70) or oversold (<30) conditions and MACD crossovers.
- [ ] **Volatility Check**: Observe Bollinger Band width to gauge squeeze vs expansion.
- [ ] **Volume Validation**: Ensure price moves are supported by significant volume spikes.

## Instructions

### 1. Market Regimes
| Regime | Key Indicators | Strategy Bias |
|--------|----------------|---------------|
| **Trending** | ADX > 25, Price > EMA(20) | Trend-following (Buy pullbacks). |
| **Mean-Reverting** | RSI at extremes, BB outer touch | Reversal / Contrarian. |
| **Breakout** | Sudden Volume spike, BB Expansion | Momentum (Buy the rip). |

### 2. Signal Weights
- **RSI Overbought + Resistance**: High probability SELL signal.
- **RSI Oversold + Support**: High probability BUY signal.
- **MACD Bullish Cross + High Volume**: Strong confirmation of trend reversal.

### 3. Output Schema
Reports from this skill must provide structured data:
- `regime`: [TRENDING, RANGE, VOLATILE]
- `trend_bias`: [BULLISH, BEARISH, NEUTRAL]
- `levels`: { "support": float, "resistance": float }

## Resources
- [Technical Analyst Spec](../../docs/02_Agent_Intelligence_System.md#32-technical-analyst)
- [Developing Quant Models](../developing-quant-models/SKILL.md)
