/**
 * Portfolio Management Types
 *
 * These types align with the backend models defined in:
 * backend/internal/portfolio/models.go
 *
 * All monetary values are represented as strings to maintain precision
 * (matching the decimal.Decimal serialization from the Go backend).
 */

/**
 * Portfolio represents a user's investment portfolio.
 */
export interface Portfolio {
    id: string;
    user_id: string;
    name: string;
    description: string;
    base_currency: string;
    total_value: string;
    cash_balance: string;
    invested_value: string;
    day_pnl: string;
    day_pnl_pct: string;
    total_pnl: string;
    total_pnl_pct: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Position represents an individual holding within a portfolio.
 * Tracks cost basis, current value, and unrealized/realized P&L.
 */
export interface Position {
    id: string;
    portfolio_id: string;
    symbol: string;
    quantity: string;
    avg_cost: string;
    current_price: string;
    market_value: string;
    unrealized_pnl: string;
    unrealized_pnl_pct: string;
    realized_pnl: string;
    weight: string;
    opened_at: string;
    updated_at: string;
}

/**
 * PortfolioSnapshot represents a daily portfolio snapshot for performance tracking.
 */
export interface PortfolioSnapshot {
    id: string;
    portfolio_id: string;
    snapshot_date: string;
    total_value: string;
    cash_balance: string;
    invested_value: string;
    daily_return: string;
    cumulative_return: string;
    created_at: string;
}

/**
 * ExecutedTrade represents a completed trade linked to a proposal.
 */
export interface ExecutedTrade {
    id: string;
    proposal_id: string | null;
    portfolio_id: string;
    symbol: string;
    action: 'BUY' | 'SELL';
    quantity: string;
    executed_price: string;
    commission: string;
    executed_at: string;
}

/**
 * LivePrice represents the current market price for a symbol.
 */
export interface LivePrice {
    symbol: string;
    price: string;
    bid: string;
    ask: string;
    volume: number;
    change: string;
    change_pct: string;
    last_updated: string;
}

/**
 * PerformanceMetrics aggregates performance data for a portfolio.
 */
export interface PerformanceMetrics {
    portfolio_id: string;
    start_date: string;
    end_date: string;
    total_return: string;
    total_return_pct: string;
    annualized_return: string;
    volatility: string;
    sharpe_ratio: string;
    max_drawdown: string;
    win_rate: string;
    profit_loss_ratio: string;
}

/**
 * PortfolioSummary combines portfolio info with positions and performance.
 */
export interface PortfolioSummary {
    portfolio: Portfolio;
    positions: Position[];
    performance: PerformanceMetrics;
}

/**
 * TradeRequest represents a request to execute a trade.
 */
export interface TradeRequest {
    portfolio_id: string;
    symbol: string;
    action: 'BUY' | 'SELL';
    quantity: number;
    proposal_id?: string;
}

/**
 * CreatePortfolioRequest represents a request to create a new portfolio.
 */
export interface CreatePortfolioRequest {
    user_id?: string;
    name: string;
    description: string;
}

/**
 * UpdatePortfolioRequest represents a request to update portfolio details.
 */
export interface UpdatePortfolioRequest {
    name?: string;
    description?: string;
}

/**
 * WebSocket message for subscribing/unsubscribing to price updates.
 */
export interface WebSocketClientMessage {
    action: 'subscribe' | 'unsubscribe';
    symbols: string[];
}

/**
 * WebSocket price update message received from the server.
 */
export interface WebSocketPriceUpdate {
    symbol: string;
    price: number;
    volume: number;
    timestamp: string;
    change?: number;
    change_pct?: number;
}
