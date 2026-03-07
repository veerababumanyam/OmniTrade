-- ============================================================
-- NEWS ANALYSIS CACHE SCHEMA
-- Stores AI-analyzed news sentiment with source citations
-- ============================================================

CREATE TABLE IF NOT EXISTS news_analysis_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(10) NOT NULL,
    analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
    sentiment_score DECIMAL(4, 3) NOT NULL,   -- -1.000 to 1.000
    confidence DECIMAL(4, 3) NOT NULL,          -- 0.000 to 1.000
    market_mood VARCHAR(10) NOT NULL,           -- bullish, bearish, neutral
    action_recommendation VARCHAR(10),          -- BUY, SELL, HOLD
    reasoning TEXT NOT NULL,
    headlines JSONB NOT NULL DEFAULT '[]',       -- Array of headline strings
    citations JSONB NOT NULL DEFAULT '[]',       -- Array of {url, title, source, published_at}
    raw_search_results JSONB DEFAULT '{}',       -- Full Z.ai/FMP response for audit
    articles_analyzed INTEGER DEFAULT 0,
    model_used VARCHAR(50) DEFAULT 'gemini-2.5-pro',
    source VARCHAR(20) DEFAULT 'z.ai',          -- z.ai, fmp, fallback
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '4 hours'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(symbol, analysis_date)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_news_cache_symbol ON news_analysis_cache(symbol);
CREATE INDEX IF NOT EXISTS idx_news_cache_symbol_date ON news_analysis_cache(symbol, analysis_date DESC);
CREATE INDEX IF NOT EXISTS idx_news_cache_expires ON news_analysis_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_news_cache_mood ON news_analysis_cache(market_mood);

-- GIN index for full-text search on citations/headlines
CREATE INDEX IF NOT EXISTS idx_news_cache_headlines ON news_analysis_cache USING gin (headlines);
CREATE INDEX IF NOT EXISTS idx_news_cache_citations ON news_analysis_cache USING gin (citations);

-- Grant permissions
GRANT SELECT ON news_analysis_cache TO omnitrade_readonly;
GRANT SELECT, INSERT, UPDATE, DELETE ON news_analysis_cache TO omnitrade_write;
