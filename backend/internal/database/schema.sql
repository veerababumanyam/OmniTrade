-- OmniTrade Database Schema V2

-- IMPORTANT: This schema must be executed by a DBA.
-- The AI Intelligence plane MUST only be granted SELECT access to market and fundamental data
-- via the `omnitrade_readonly` role.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";  -- pgvector extension

-- Stock assets table
CREATE TABLE IF NOT EXISTS stock_assets (
    symbol VARCHAR(10) PRIMARY KEY,
    company_name VARCHAR(100),
    sector VARCHAR(50)
);

-- Market data table with optimized indexing
CREATE TABLE IF NOT EXISTS market_data (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) REFERENCES stock_assets(symbol),
    price DECIMAL(15, 4),
    volume BIGINT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Fundamental data table with vector embeddings for RAG
CREATE TABLE IF NOT EXISTS fundamental_data (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) REFERENCES stock_assets(symbol),
    report_type VARCHAR(20), -- 10-K, 10-Q, News
    content TEXT,
    embedding vector(1536), -- Requires pgvector extension
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trade proposals table for HITL workflow
CREATE TABLE IF NOT EXISTS trade_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(10) REFERENCES stock_assets(symbol),
    action VARCHAR(10), -- BUY/SELL
    confidence_score DECIMAL(3, 2),
    reasoning TEXT,
    proposed_by_model VARCHAR(50),
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, EXECUTED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs for immutable tracking
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID REFERENCES trade_proposals(id),
    action_taken VARCHAR(50),
    user_id UUID,
    metadata JSONB,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================

-- Market data indexes
CREATE INDEX idx_market_data_symbol ON market_data(symbol);
CREATE INDEX idx_market_data_timestamp ON market_data(timestamp DESC);
CREATE INDEX idx_market_data_symbol_timestamp ON market_data(symbol, timestamp DESC);

-- Fundamental data indexes
CREATE INDEX idx_fundamental_data_symbol ON fundamental_data(symbol);
CREATE INDEX idx_fundamental_data_report_type ON fundamental_data(report_type);
CREATE INDEX idx_fundamental_data_symbol_report ON fundamental_data(symbol, report_type);
CREATE INDEX idx_fundamental_data_created ON fundamental_data(created_at DESC);

-- Trade proposals indexes
CREATE INDEX idx_trade_proposals_status ON trade_proposals(status);
CREATE INDEX idx_trade_proposals_symbol ON trade_proposals(symbol);
CREATE INDEX idx_trade_proposals_created ON trade_proposals(created_at DESC);
CREATE INDEX idx_trade_proposals_status_created ON trade_proposals(status, created_at DESC);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_proposal ON audit_logs(proposal_id);
CREATE INDEX idx_audit_logs_executed ON audit_logs(executed_at DESC);

-- ============================================================
-- DATABASE ROLES (Execute as PostgreSQL superuser)
-- ============================================================

-- Create read-only role for Intelligence Plane (AI agents)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'omnitrade_readonly') THEN
        CREATE ROLE omnitrade_readonly WITH LOGIN PASSWORD 'change_me_in_production';
    END IF;
END
$$;

-- Grant read-only access to Intelligence Plane
GRANT CONNECT ON DATABASE omnitrade TO omnitrade_readonly;
GRANT SELECT ON stock_assets, market_data, fundamental_data TO omnitrade_readonly;

-- Create write role for Action Plane (human-approved trades)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'omnitrade_write') THEN
        CREATE ROLE omnitrade_write WITH LOGIN PASSWORD 'change_me_in_production';
    END IF;
END
$$;

-- Grant write access to Action Plane
GRANT CONNECT ON DATABASE omnitrade TO omnitrade_write;
GRANT SELECT, INSERT, UPDATE ON trade_proposals, audit_logs TO omnitrade_write;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO omnitrade_write;

-- ============================================================
-- SAMPLE DATA (For development only)
-- ============================================================

INSERT INTO stock_assets (symbol, company_name, sector) VALUES
    ('AAPL', 'Apple Inc.', 'Technology'),
    ('MSFT', 'Microsoft Corporation', 'Technology'),
    ('GOOGL', 'Alphabet Inc.', 'Technology'),
    ('AMZN', 'Amazon.com Inc.', 'Consumer Cyclical'),
    ('NVDA', 'NVIDIA Corporation', 'Technology'),
    ('META', 'Meta Platforms Inc.', 'Technology'),
    ('TSLA', 'Tesla Inc.', 'Consumer Cyclical'),
    ('JPM', 'JPMorgan Chase & Co.', 'Financial Services'),
    ('V', 'Visa Inc.', 'Financial Services'),
    ('JNJ', 'Johnson & Johnson', 'Healthcare')
ON CONFLICT (symbol) DO NOTHING;
