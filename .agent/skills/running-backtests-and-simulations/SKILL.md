---
name: running-backtests-and-simulations
description: Focused on Python-based Vectorbt/Zipline integration, TimeSeriesSplit validation, and evaluating Sharpe/MaxDD benchmarks. Use when verifying strategy performance or running historical simulations.
---

# Running Backtests and Simulations

This skill provides the framework for high-fidelity backtesting of OmniTrade's quantitative models, ensuring strategies are validated before production deployment.

## When to use this skill
- When verifying the performance of a new ML model or alpha signal.
- When running historical simulations using **Vectorbt** or **Zipline**.
- When calculating portfolio metrics (Sharpe Ratio, Sortino Ratio, Maximum Drawdown).
- When implementing Walk-Forward Optimization or Time-Series Cross-Validation.

## Workflow

- [ ] **Data Integrity**: Ensure no future leakage in training/validation splits.
- [ ] **Transaction Costs**: Include realistic fees (e.g., 0.05%) and slippage in simulations.
- [ ] **Benchmark**: Always compare against a baseline (e.g., SPY or Buy-and-Hold).
- [ ] **Statistical Significance**: Verify results across multiple market cycles (Bull, Bear, Sideways).

## Instructions

### 1. Vectorized Backtesting (Vectorbt)
Fastest for simple signal testing.
```python
import vectorbt as vbt
import pandas as pd

# Define entries/exits from signals
entries = signals > 0.8
exits = signals < 0.2

# Run portfolio simulation
pf = vbt.Portfolio.from_signals(
    close_prices, 
    entries, 
    exits, 
    fees=0.0005, 
    slippage=0.001
)

print(f"Sharpe: {pf.sharpe_ratio()}")
print(f"MaxDrawdown: {pf.max_drawdown()}")
```

### 2. TimeSeriesSplit (Cross-Validation)
Prevents look-ahead bias in financial datasets.
```python
from sklearn.model_selection import TimeSeriesSplit

tscv = TimeSeriesSplit(n_splits=5)
for train_index, test_index in tscv.split(X):
    X_train, X_test = X.iloc[train_index], X.iloc[test_index]
    y_train, y_test = y.iloc[train_index], y.iloc[test_index]
    # Train and validate...
```

### 3. Reporting Standards
All backtest reports must include:
- **IC (Information Coefficient)**: Skill of the forecast.
- **Sharpe Ratio**: Risk-adjusted return.
- **MaxDD (Maximum Drawdown)**: Worst-case peek-to-trough loss.
- **Turnover**: Frequency of trading.

## Resources
- [ML Architecture Reference](../../docs/09_Machine_Learning_Models.md)
- [Example: Historical Simulation](examples/historical_sim.py)
