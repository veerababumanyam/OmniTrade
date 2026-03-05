# Trading Strategies & Risk Management

This document provides a comprehensive overview of trading strategies, their timeframes, goals, tools, and risk levels.

## Strategy Overview Table

| Trading Strategy | Timeframe | Primary Goal | Typical Tools & Indicators | Risk Level | Execution Style |
|------------------|-----------|--------------|---------------------------|------------|-----------------|
| **Scalping** | Seconds to minutes | Captures frequent small profits from micro-movements and short momentum bursts | VWAP, Level 2 / Order Book, Tick charts, EMA (9, 21), SMA, Stochastic, RSI, Bollinger Bands, MACD, HMA, Keltner Channels, ALMA | Very High | Manual or Algorithmic; high-frequency; requires low-latency hardware and high discipline |
| **Day Trading** | Intraday (positions closed within one day) | Captures short-term price fluctuations and intraday volatility while avoiding overnight risk | VWAP, 9/21 EMA, RSI, MACD, Level 2 data, intraday charts, volume analysis, support/resistance levels | High | Manual or Automated; high-velocity; often involves GSLOs |
| **Momentum Trading** | Minutes to days | Rides strong upward or downward market price force and accelerating moves on high volume until strength is lost | RSI, MACD, Volume indicators, Relative Volume (RVOL > 2.0), Price Action, Catalysts, Gap-and-Go patterns | High | Manual; requires agility; involves 'buying high and selling higher' |
| **News Trading** | Seconds to minutes | Capitalizes on sharp price movements and sudden volatility caused by significant events, economic reports, or geopolitical shocks | Economic calendars, news feeds, price alerts, AI news aggregators, 15-minute consolidation filters | High | Manual; speed-dependent; requires quick decision-making and fast execution platforms |
| **Breakout Trading** | Intraday to days | Captures gains from price moves breaking through defined key resistance or support levels | Volume indicators/spikes, breakout scanners, Bollinger Bands, Support/Resistance levels, ATR | High | Manual or Automated; often uses stop-entry or limit orders |
| **Algorithmic Trading** | Microseconds to days | Executes trades at high speed with precision based on quantitative models, removing emotional bias | Trading algorithms, backtesting software, AI tools, High-frequency algorithms, Quantitative models | Medium to High | Automated; pre-programmed criteria |
| **Order Flow Trading** | Tick by tick / Short-term | Analyzes executed trades in real-time to understand market control and liquidity | Footprint charts, Volumetric bars, Cumulative Delta, Level 2 Order Book | High | Manual; high-frequency focus |
| **Gap Trading** | Post-market or market opening | Profits from market adjustments after large overnight price gaps | Pre-market data, volume spikes, gap scanners | High | Manual; requires swift action |
| **Swing Trading** | 2 days to several weeks | Captures multi-day "swings" in price momentum and broader market price cycles | 4-hour and Daily charts, Moving averages, Fibonacci retracements, RSI, MACD, Trendlines, Chart patterns | Medium | Manual or Semi-automated |
| **Mean Reversion** | Varies (typically days to weeks) | Profits from prices returning to a historical average or "fair value" after a statistical extreme | Moving averages (20-period SMA), Bollinger Bands, RSI (Divergence), VWAP, Stochastic Oscillator | Medium | Manual or Algorithmic; focuses on overextended market conditions |
| **Trend Trading / Following** | Weeks to months | Profits from sustained market direction by riding the dominant trend | 50-day and 200-day Moving Averages, MACD, Trendlines, RSI, ADX, EMA Cloud | Medium | Manual, Systemic, or Automated |
| **HMM (Hidden Markov Models)** | Typically intraday (hourly) | Predicts market regimes (e.g., bull run, crash, choppy noise) rather than direct price | Gaussian distributions, Python/Claude Code, feature engineering (returns, range, volume) | Medium to High | Automated / Algorithmic |
| **VWAP Pullback Strategy** | Intraday | Joins an existing intraday trend after a temporary retracement to fair value | Central VWAP line, upper and lower VWAP deviations | Medium to High | Manual; entering trades after price retraces to VWAP |
| **Price Action Trading** | Versatile (any timeframe) | Provides insight into market sentiment using raw price movements without lagging indicators | Candlestick patterns, trendlines, support/resistance levels | Medium | Manual chart analysis |
| **Fibonacci Retracement** | Varies (during pullbacks) | Identifies reversal points during corrections within a larger trend | Fibonacci levels (38.2%, 61.8%), support/resistance levels | Medium | Manual |
| **End-of-Day Trading** | Daily (next-day execution) | Uses daily close data for informed, low-frequency trading decisions | Daily candlestick patterns, support/resistance levels | Medium | Manual; orders placed near market close |
| **Position Trading** | Weeks to years | Benefits from large, long-term market moves, macro themes, and fundamental shifts | Fundamental analysis, macroeconomic data, weekly/monthly charts, P/E ratios, forward earnings | Low to Medium | Manual; buy-and-hold approach; intermittent monitoring |
| **Market Making** | Continuous | Provides liquidity and collects fees/yield from the bid-ask spread | Concentrated Liquidity (DeFi), Level 2 Order Book, Depth of Market | Medium | Automated / Algorithmic |
| **Range Trading** | Varies (stable periods) | Exploits repetitive price bounces between predictable support and resistance levels | Support & resistance levels, RSI, Stochastic Oscillator | Low to Medium | Manual with tight stops |
| **Arbitrage** | Instant / Milliseconds | Profits from price efficiency gaps between different exchanges or chains | Arbitrage Scanners, HFT bots, cross-chain monitoring software | Low | Automated / High-frequency trading (HFT) |
| **CFD Hedging** | Variable | Offsets risk and minimizes uncertainty in an existing portfolio by taking opposite positions | Pairs trading, forward contracts, safe haven assets (Gold, Bonds), Derivatives | Lower (Risk reduction) | Strategic manual or automated execution |
| **Risk Management (Methodology)** | Continuous | Safeguards capital by minimizing losses and preventing account ruin | 1% Rule, Stop-loss orders, GSLOs, Position size calculators | Protective / Low | Automated (via specific orders) and Manual |
| **GSLO (Guaranteed Stop Loss Order)** | Duration of open position | Eliminates slippage risk by guaranteeing execution at a specific price | Premium-based order (GSLO Premium) | Lower (Risk tool) | Automated order execution on trigger |

## Risk Categories

### Very High Risk
- Scalping

### High Risk
- Day Trading
- Momentum Trading
- News Trading
- Breakout Trading
- Order Flow Trading
- Gap Trading

### Medium to High Risk
- Algorithmic Trading
- HMM (Hidden Markov Models)
- VWAP Pullback Strategy

### Medium Risk
- Swing Trading
- Mean Reversion
- Trend Trading / Following
- Price Action Trading
- Fibonacci Retracement
- End-of-Day Trading
- Market Making

### Low to Medium Risk
- Position Trading
- Range Trading

### Low Risk
- Arbitrage
- CFD Hedging
- Risk Management (Methodology)
- GSLO (Guaranteed Stop Loss Order)
