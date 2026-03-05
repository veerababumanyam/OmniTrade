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
-- MULTI-AGENT DEBATE LAYER
-- ============================================================

-- Agent debate tracking
CREATE TABLE IF NOT EXISTS agent_debates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    symbol VARCHAR(10) NOT NULL REFERENCES stock_assets(symbol),
    debate_round INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, RESOLVED, ESCALATED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Individual agent opinions during debate
CREATE TABLE IF NOT EXISTS agent_opinions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debate_id UUID NOT NULL REFERENCES agent_debates(id) ON DELETE CASCADE,
    agent_name VARCHAR(50) NOT NULL,
    action_recommendation VARCHAR(10), -- BUY, SELL, HOLD
    confidence_score DECIMAL(3, 2),
    reasoning TEXT,
    supporting_data JSONB,
    dissent_points TEXT[], -- Points of disagreement with other agents
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mediator decisions for conflict resolution
CREATE TABLE IF NOT EXISTS mediator_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debate_id UUID NOT NULL REFERENCES agent_debates(id) ON DELETE CASCADE,
    final_action VARCHAR(10),
    final_confidence DECIMAL(3, 2),
    resolution_reasoning TEXT,
    conflict_summary TEXT,
    resolution_strategy VARCHAR(50), -- WEIGHTED_VOTE, EVIDENCE_BASED, ESCALATED
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Debate indexes
CREATE INDEX idx_agent_debates_session ON agent_debates(session_id);
CREATE INDEX idx_agent_debates_symbol ON agent_debates(symbol);
CREATE INDEX idx_agent_debates_status ON agent_debates(status);
CREATE INDEX idx_agent_opinions_debate ON agent_opinions(debate_id);
CREATE INDEX idx_agent_opinions_agent ON agent_opinions(agent_name);
CREATE INDEX idx_mediator_decisions_debate ON mediator_decisions(debate_id);

-- ============================================================
-- PORTFOLIO MANAGEMENT
-- ============================================================

-- Portfolios table (multi-portfolio support)
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_currency VARCHAR(3) DEFAULT 'USD',
    total_value DECIMAL(18, 4) DEFAULT 0,
    cash_balance DECIMAL(18, 4) DEFAULT 0,
    invested_value DECIMAL(18, 4) DEFAULT 0,
    day_pnl DECIMAL(18, 4) DEFAULT 0,
    day_pnl_pct DECIMAL(8, 6) DEFAULT 0,
    total_pnl DECIMAL(18, 4) DEFAULT 0,
    total_pnl_pct DECIMAL(8, 6) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Positions table (individual holdings)
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL REFERENCES stock_assets(symbol),
    quantity DECIMAL(18, 6) NOT NULL,
    avg_cost DECIMAL(18, 4) NOT NULL,
    current_price DECIMAL(18, 4),
    market_value DECIMAL(18, 4) DEFAULT 0,
    unrealized_pnl DECIMAL(18, 4) DEFAULT 0,
    unrealized_pnl_pct DECIMAL(8, 6) DEFAULT 0,
    realized_pnl DECIMAL(18, 4) DEFAULT 0,
    weight DECIMAL(8, 6) DEFAULT 0,
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(portfolio_id, symbol)
);

-- Portfolio performance snapshots (for charting)
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    total_value DECIMAL(18, 4) NOT NULL,
    cash_balance DECIMAL(18, 4),
    invested_value DECIMAL(18, 4),
    daily_return DECIMAL(8, 6),
    cumulative_return DECIMAL(8, 6),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(portfolio_id, snapshot_date)
);

-- Executed trades (linked from proposals)
CREATE TABLE IF NOT EXISTS executed_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID REFERENCES trade_proposals(id),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id),
    symbol VARCHAR(10) NOT NULL REFERENCES stock_assets(symbol),
    action VARCHAR(10) NOT NULL, -- BUY, SELL
    quantity DECIMAL(18, 6) NOT NULL,
    executed_price DECIMAL(18, 4) NOT NULL,
    commission DECIMAL(10, 2) DEFAULT 0,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Live price cache (updated by WebSocket or polling)
CREATE TABLE IF NOT EXISTS live_prices (
    symbol VARCHAR(10) PRIMARY KEY REFERENCES stock_assets(symbol),
    price DECIMAL(18, 4) NOT NULL,
    bid DECIMAL(18, 4),
    ask DECIMAL(18, 4),
    volume BIGINT,
    change DECIMAL(18, 4),
    change_pct DECIMAL(8, 6),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio indexes
CREATE INDEX idx_portfolios_user ON portfolios(user_id);
CREATE INDEX idx_portfolios_active ON portfolios(is_active);
CREATE INDEX idx_positions_portfolio ON positions(portfolio_id);
CREATE INDEX idx_positions_symbol ON positions(symbol);
CREATE INDEX idx_positions_portfolio_symbol ON positions(portfolio_id, symbol);
CREATE INDEX idx_snapshots_portfolio_date ON portfolio_snapshots(portfolio_id, snapshot_date DESC);
CREATE INDEX idx_executed_trades_portfolio ON executed_trades(portfolio_id);
CREATE INDEX idx_executed_trades_symbol ON executed_trades(symbol);
CREATE INDEX idx_executed_trades_date ON executed_trades(executed_at DESC);
CREATE INDEX idx_live_prices_updated ON live_prices(last_updated);

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
GRANT SELECT, INSERT, UPDATE ON portfolios, positions, portfolio_snapshots, executed_trades, live_prices TO omnitrade_write;
GRANT SELECT, INSERT ON agent_debates, agent_opinions, mediator_decisions TO omnitrade_write;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO omnitrade_write;

-- Grant read access to Intelligence Plane for debate tables
GRANT SELECT ON agent_debates, agent_opinions, mediator_decisions TO omnitrade_readonly;
GRANT SELECT ON portfolios, positions, portfolio_snapshots, live_prices TO omnitrade_readonly;

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
