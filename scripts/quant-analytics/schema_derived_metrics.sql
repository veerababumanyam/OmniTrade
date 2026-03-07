-- Schema for FMP Derived Metrics Layer (Python Analytics Worker output)
-- This table stores advanced metrics computed by FinanceToolkit based on raw data in fmp_ticker_data.

CREATE TABLE IF NOT EXISTS fmp_derived_metrics (
    symbol VARCHAR(20) NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- e.g., 'dupont_analysis', 'custom_greeks', 'risk_metrics'
    data JSONB NOT NULL,
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (symbol, metric_type)
);

CREATE INDEX IF NOT EXISTS idx_fmp_derived_symbol ON fmp_derived_metrics (symbol);
CREATE INDEX IF NOT EXISTS idx_fmp_derived_type ON fmp_derived_metrics (metric_type);
