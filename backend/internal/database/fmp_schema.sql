-- ============================================================
-- FMP DATA HUB SCHEMA
-- Stores structured financial data from Financial Modeling Prep
-- ============================================================

-- Primary data store: one row per (symbol, category) pair
-- data column holds the full FMP JSON response as JSONB
CREATE TABLE IF NOT EXISTS fmp_ticker_data (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    category VARCHAR(50) NOT NULL,
    data JSONB NOT NULL,
    data_hash VARCHAR(64),
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(symbol, category)
);

-- Sync tracking: timestamps, hash, error state per (symbol, category)
CREATE TABLE IF NOT EXISTS fmp_sync_metadata (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    category VARCHAR(50) NOT NULL,
    last_synced_at TIMESTAMPTZ,
    last_data_hash VARCHAR(64),
    sync_count INTEGER DEFAULT 0,
    ttl_seconds INTEGER DEFAULT 86400,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(symbol, category)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_fmp_data_symbol ON fmp_ticker_data(symbol);
CREATE INDEX IF NOT EXISTS idx_fmp_data_sym_cat ON fmp_ticker_data(symbol, category);
CREATE INDEX IF NOT EXISTS idx_fmp_data_updated ON fmp_ticker_data(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_fmp_sync_symbol ON fmp_sync_metadata(symbol);
CREATE INDEX IF NOT EXISTS idx_fmp_sync_sym_cat ON fmp_sync_metadata(symbol, category);

-- Grant read access to the AI readonly role
GRANT SELECT ON fmp_ticker_data TO omnitrade_readonly;
GRANT SELECT ON fmp_sync_metadata TO omnitrade_readonly;

-- Grant write access to the action plane role
GRANT SELECT, INSERT, UPDATE ON fmp_ticker_data TO omnitrade_write;
GRANT SELECT, INSERT, UPDATE ON fmp_sync_metadata TO omnitrade_write;
GRANT USAGE, SELECT ON SEQUENCE fmp_ticker_data_id_seq TO omnitrade_write;
GRANT USAGE, SELECT ON SEQUENCE fmp_sync_metadata_id_seq TO omnitrade_write;
