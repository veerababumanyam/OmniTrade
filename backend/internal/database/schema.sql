-- OmniTrade Database Schema V1

-- IMPORTANT: This schema must be executed by a DBA.
-- The AI Intelligence plane MUST only be granted SELECT access to market and fundamental data
-- via the `omnitrade_readonly` role.

CREATE TABLE IF NOT EXISTS stock_assets (
    symbol VARCHAR(10) PRIMARY KEY,
    company_name VARCHAR(100),
    sector VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS market_data (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) REFERENCES stock_assets(symbol),
    price DECIMAL(15, 4),
    volume BIGINT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fundamental_data (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) REFERENCES stock_assets(symbol),
    report_type VARCHAR(20), -- 10-K, 10-Q, News
    content TEXT,
    embedding vector(1536) -- Requires pgvector extension
);

CREATE TABLE IF NOT EXISTS trade_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(10) REFERENCES stock_assets(symbol),
    action VARCHAR(10), -- BUY/SELL
    confidence_score DECIMAL(3, 2),
    reasoning TEXT,
    proposed_by_model VARCHAR(50),
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: The Intelligence plane should NOT have INSERT access to trade_proposals directly.
-- A separate microservice with a different role should handle creating proposals based
-- on the Genkit flow outputs.

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID REFERENCES trade_proposals(id),
    action_taken VARCHAR(50),
    user_id UUID,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);
