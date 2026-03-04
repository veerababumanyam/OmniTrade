---
name: developing-quant-models
description: Develops and maintains Python-based quantitative models and signals, including LightGBM factor ranking, PyTorch LSTMs, and RL execution policies. Use when building ML pipelines, feature engineering (TA-Lib), or backtesting strategies.
---

# Developing Quantitative Models

This skill provides the structure and patterns for OmniTrade's **Quantitative ML Plane**, which focuses on mathematical forecasting and signal generation separate from the LLM-based agents.

## When to use this skill
- When implementing a Python-based ML microservice (FastAPI).
- When performing high-dimensional **Feature Engineering** (TA-Lib, pandas-ta).
- When training/deploying supervised models (LightGBM, XGBoost) or deep learning models (LSTM, TFT, 1D-CNN).
- When building **Reinforcement Learning** (PPO, SAC) for execution or allocation policies.
- When running historical **Backtests** using Vectorbt or Zipline.
- When managing model versions/experiments in **MLflow**.

## Workflow

- [ ] **Data Pipeline**: Fetch OHLCV data from PostgreSQL/Redis and compute 200+ features (Trend, Momentum, Volatility, Volume).
- [ ] **Cross-Validation**: Use `TimeSeriesSplit` to prevent future leakage in financial datasets.
- [ ] **Model Selection**: Choose LightGBM for factor ranking, LSTMs for price sequence forecasting, and CNNs for chart pattern recognition.
- [ ] **Ensemble Weighting**: Use a Logistic Regression meta-learner (Stacking) to combine ML and LLM signals.
- [ ] **Backtest Benchmark**: Evaluate strategies against S&P 500 (SPY) or relevant benchmarks using Sharpe, MaxDD, and IC (Information Coefficient).
- [ ] **Promote to Staging**: Push the model to MLflow Model Registry only if IC > 0.03 and Sharpe > 1.0.

## Instructions

### 1. Feature Engineering (Python)
Use TA-Lib for high-performance indicator computation.
```python
import talib
# SMA, RSI, MACD
df['rsi'] = talib.RSI(df['close'], timeperiod=14)
df['macd'], _, _ = talib.MACD(df['close'])
```

### 2. Supervised Learning (LightGBM)
Predict N-day forward returns using historical fundamental and technical factors.
```python
model = lgb.LGBMRegressor(num_leaves=63, learning_rate=0.05, n_estimators=1000)
model.fit(X_train, y_train, eval_set=[(X_val, y_val)], callbacks=[lgb.early_stopping(50)])
```

### 3. Backtesting (Vectorbt)
```python
import vectorbt as vbt
pf = vbt.Portfolio.from_signals(price, entries, exits, fees=0.0005)
print(pf.total_return(), pf.sharpe_ratio())
```

### 4. MLflow Registry
Version every model to ensure reproducibility and A/B (Champion/Challenger) testing.
- **Production Stage**: Champions that beat the baseline consistently.

## Resources
- [ML Architecture Reference](resources/ML_ARCHITECTURE.md)
- [Example: Feature Engine](examples/feature_engine.py)
