/**
 * PortfolioPage
 * Main portfolio management page combining all portfolio components
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, AlertCircle, X } from 'lucide-react';

import { PortfolioSummary } from '../components/portfolio/PortfolioSummary';
import { PortfolioChart } from '../components/portfolio/PortfolioChart';
import { PositionsTable } from '../components/portfolio/PositionsTable';
import { AllocationChart } from '../components/portfolio/AllocationChart';
import { usePortfolioStore } from '../stores/portfolioStore';
import type {
    Position,
    PortfolioSnapshot,
    TradeRequest,
    CreatePortfolioRequest,
} from '../types/portfolio';

// Mock data for demonstration
const generateMockSnapshots = (portfolioValue: number): PortfolioSnapshot[] => {
    const snapshots: PortfolioSnapshot[] = [];
    const now = new Date();

    for (let i = 365; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        // Simulate realistic portfolio growth with volatility
        const randomChange = (Math.random() - 0.48) * 0.5;
        const trendFactor = 1 + (i / 365) * 0.15;
        const dailyValue = portfolioValue * trendFactor * (1 + randomChange);

        snapshots.push({
            id: `snapshot-${i}`,
            portfolio_id: 'demo-portfolio',
            snapshot_date: date.toISOString().split('T')[0],
            total_value: dailyValue.toFixed(2),
            cash_balance: (dailyValue * 0.2).toFixed(2),
            invested_value: (dailyValue * 0.8).toFixed(2),
            daily_return: ((Math.random() - 0.48) * 0.03).toFixed(6),
            cumulative_return: ((1 - trendFactor) * -1).toFixed(6),
            created_at: date.toISOString(),
        });
    }

    return snapshots.reverse();
};

const generateMockPositions = (): Position[] => {
    const mockPositions = [
        { symbol: 'AAPL', quantity: 150, avgCost: 175.50, sector: 'Technology' },
        { symbol: 'MSFT', quantity: 75, avgCost: 380.20, sector: 'Technology' },
        { symbol: 'GOOGL', quantity: 50, avgCost: 140.80, sector: 'Technology' },
        { symbol: 'NVDA', quantity: 30, avgCost: 480.00, sector: 'Technology' },
        { symbol: 'AMZN', quantity: 40, avgCost: 178.25, sector: 'Consumer Cyclical' },
        { symbol: 'JPM', quantity: 60, avgCost: 195.30, sector: 'Financial Services' },
        { symbol: 'V', quantity: 80, avgCost: 280.15, sector: 'Financial Services' },
        { symbol: 'JNJ', quantity: 45, avgCost: 162.40, sector: 'Healthcare' },
    ];

    return mockPositions.map((pos, index) => {
        const currentPrice = pos.avgCost * (1 + (Math.random() - 0.5) * 0.2);
        const marketValue = currentPrice * pos.quantity;
        const costBasis = pos.avgCost * pos.quantity;
        const unrealizedPnL = marketValue - costBasis;
        const unrealizedPnLPct = (unrealizedPnL / costBasis) * 100;

        return {
            id: `pos-${index}`,
            portfolio_id: 'demo-portfolio',
            symbol: pos.symbol,
            quantity: pos.quantity.toString(),
            avg_cost: pos.avgCost.toFixed(2),
            current_price: currentPrice.toFixed(2),
            market_value: marketValue.toFixed(2),
            unrealized_pnl: unrealizedPnL.toFixed(2),
            unrealized_pnl_pct: unrealizedPnLPct.toFixed(6),
            realized_pnl: '0',
            weight: (Math.random() * 15 + 5).toFixed(6),
            opened_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
        };
    });
};

export const PortfolioPage: React.FC = () => {
    const {
        portfolios,
        currentPortfolio,
        positions,
        loading,
        error,
        fetchPortfolios,
        fetchPositions,
        createPortfolio,
        executeTrade,
        setCurrentPortfolio,
        clearError,
    } = usePortfolioStore();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showTradeModal, setShowTradeModal] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
    const [chartData, setChartData] = useState<{ date: string; value: number; pnl: number }[]>([]);
    const [allocationData, setAllocationData] = useState<{ name: string; value: number; symbol: string; sector: string }[]>([]);

    // Initial load
    useEffect(() => {
        const loadData = async () => {
            try {
                // Try to fetch real data first
                await fetchPortfolios();
            } catch {
                // If no real data, use mock data for demo
                console.log('Using demo data for portfolio');
            }
        };
        loadData();
    }, [fetchPortfolios]);

    // Load positions when portfolio changes
    useEffect(() => {
        if (currentPortfolio) {
            fetchPositions(currentPortfolio.id).catch(() => {
                console.log('Using demo positions');
            });
        }
    }, [currentPortfolio, fetchPositions]);

    // Generate chart data
    useEffect(() => {
        if (currentPortfolio) {
            const totalValue = parseFloat(currentPortfolio.total_value);
            const snapshots = generateMockSnapshots(totalValue);
            setChartData(snapshots.map(s => ({
                date: s.snapshot_date,
                value: parseFloat(s.total_value),
                pnl: parseFloat(s.daily_return) * totalValue,
            })));
        } else {
            // Demo chart data
            const demoSnapshots = generateMockSnapshots(100000);
            setChartData(demoSnapshots.map(s => ({
                date: s.snapshot_date,
                value: parseFloat(s.total_value),
                pnl: parseFloat(s.daily_return) * 100000,
            })));
        }
    }, [currentPortfolio]);

    // Generate allocation data from positions
    useEffect(() => {
        const positionsToUse = positions.length > 0 ? positions : generateMockPositions();
        const allocation = positionsToUse.map(pos => ({
            name: pos.symbol,
            value: parseFloat(pos.market_value),
            symbol: pos.symbol,
            sector: 'Technology', // Would come from actual data
        }));
        setAllocationData(allocation);
    }, [positions]);

    const handleCreatePortfolio = useCallback(async (request: CreatePortfolioRequest) => {
        try {
            await createPortfolio(request);
            setShowCreateModal(false);
        } catch (err) {
            console.error('Failed to create portfolio:', err);
        }
    }, [createPortfolio]);

    const handleExecuteTrade = useCallback(async (request: TradeRequest) => {
        try {
            await executeTrade(request);
            setShowTradeModal(false);
            setSelectedPosition(null);
        } catch (err) {
            console.error('Failed to execute trade:', err);
        }
    }, [executeTrade]);

    const handlePositionClick = useCallback((position: Position) => {
        setSelectedPosition(position);
        setShowTradeModal(true);
    }, []);

    const handleRefresh = useCallback(() => {
        if (currentPortfolio) {
            fetchPositions(currentPortfolio.id);
        }
    }, [currentPortfolio, fetchPositions]);

    // Calculate portfolio totals
    const portfolioTotals = {
        totalValue: currentPortfolio
            ? parseFloat(currentPortfolio.total_value)
            : positions.reduce((sum, pos) => sum + parseFloat(pos.market_value), 0) || 100000,
        dayPnL: currentPortfolio
            ? parseFloat(currentPortfolio.day_pnl)
            : positions.reduce((sum, pos) => sum + parseFloat(pos.unrealized_pnl), 0) * 0.1 || 1250,
        dayPnLPercent: currentPortfolio
            ? parseFloat(currentPortfolio.day_pnl_pct) * 100
            : 1.25,
        totalPnL: currentPortfolio
            ? parseFloat(currentPortfolio.total_pnl)
            : positions.reduce((sum, pos) => sum + parseFloat(pos.unrealized_pnl), 0) || 8500,
        totalPnLPercent: currentPortfolio
            ? parseFloat(currentPortfolio.total_pnl_pct) * 100
            : 8.5,
        cashBalance: currentPortfolio
            ? parseFloat(currentPortfolio.cash_balance)
            : 20000,
        investedValue: currentPortfolio
            ? parseFloat(currentPortfolio.invested_value)
            : 80000,
    };

    const positionsToDisplay = positions.length > 0 ? positions : generateMockPositions();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                padding: '24px',
                maxWidth: '1400px',
                margin: '0 auto',
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px',
            }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '8px' }}>
                        Portfolio Management
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        Track your investments and monitor performance in real-time
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="glass-button"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'white',
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    <Plus size={18} />
                    New Portfolio
                </button>
            </div>

            {/* Error Banner */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: 'rgba(255, 0, 85, 0.1)',
                        border: '1px solid var(--accent-danger)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <AlertCircle size={20} style={{ color: 'var(--accent-danger)' }} />
                        <span style={{ color: 'var(--accent-danger)' }}>{error}</span>
                    </div>
                    <button onClick={clearError} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={18} style={{ color: 'var(--accent-danger)' }} />
                    </button>
                </motion.div>
            )}

            {/* Portfolio Selector */}
            {portfolios.length > 1 && (
                <div style={{
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        Select Portfolio:
                    </label>
                    <select
                        value={currentPortfolio?.id || ''}
                        onChange={(e) => {
                            const selected = portfolios.find(p => p.id === e.target.value);
                            setCurrentPortfolio(selected || null);
                        }}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: 'var(--surface-2)',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                        }}
                    >
                        {portfolios.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Summary Card */}
            <div style={{ marginBottom: '24px' }}>
                <PortfolioSummary
                    totalValue={portfolioTotals.totalValue}
                    dayPnL={portfolioTotals.dayPnL}
                    dayPnLPercent={portfolioTotals.dayPnLPercent}
                    totalPnL={portfolioTotals.totalPnL}
                    totalPnLPercent={portfolioTotals.totalPnLPercent}
                    cashBalance={portfolioTotals.cashBalance}
                    investedValue={portfolioTotals.investedValue}
                    isLoading={loading}
                    onRefresh={handleRefresh}
                />
            </div>

            {/* Charts Row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '24px',
                marginBottom: '24px',
            }}>
                <PortfolioChart
                    data={chartData}
                    isLoading={loading}
                />
                <AllocationChart
                    data={allocationData}
                    isLoading={loading}
                    onSliceClick={(item) => {
                        const pos = positionsToDisplay.find(p => p.symbol === item.symbol);
                        if (pos) handlePositionClick(pos);
                    }}
                />
            </div>

            {/* Positions Table */}
            <PositionsTable
                positions={positionsToDisplay}
                isLoading={loading}
                onPositionClick={handlePositionClick}
                wsEndpoint="/ws/prices"
            />

            {/* Create Portfolio Modal */}
            {showCreateModal && (
                <CreatePortfolioModal
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={handleCreatePortfolio}
                    isLoading={loading}
                />
            )}

            {/* Trade Modal */}
            {showTradeModal && selectedPosition && (
                <TradeModal
                    position={selectedPosition}
                    portfolioId={currentPortfolio?.id || 'demo-portfolio'}
                    onClose={() => {
                        setShowTradeModal(false);
                        setSelectedPosition(null);
                    }}
                    onSubmit={handleExecuteTrade}
                    isLoading={loading}
                />
            )}
        </motion.div>
    );
};

// Create Portfolio Modal Component
interface CreatePortfolioModalProps {
    onClose: () => void;
    onSubmit: (request: CreatePortfolioRequest) => void;
    isLoading: boolean;
}

const CreatePortfolioModal: React.FC<CreatePortfolioModalProps> = ({ onClose, onSubmit, isLoading }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ name, description });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass-card"
                style={{
                    padding: '32px',
                    maxWidth: '400px',
                    width: '90%',
                }}
                onClick={e => e.stopPropagation()}
            >
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px' }}>
                    Create New Portfolio
                </h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: 'var(--text-muted)',
                            fontSize: '0.875rem',
                        }}>
                            Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                background: 'var(--surface-2)',
                                border: '1px solid var(--glass-border)',
                                color: 'var(--text-primary)',
                            }}
                            placeholder="My Portfolio"
                        />
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: 'var(--text-muted)',
                            fontSize: '0.875rem',
                        }}>
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                background: 'var(--surface-2)',
                                border: '1px solid var(--glass-border)',
                                color: 'var(--text-primary)',
                                resize: 'vertical',
                            }}
                            placeholder="Optional description..."
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '8px',
                                border: '1px solid var(--glass-border)',
                                background: 'transparent',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !name}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'var(--accent-primary)',
                                color: 'white',
                                fontWeight: 600,
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                opacity: isLoading ? 0.6 : 1,
                            }}
                        >
                            {isLoading ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

// Trade Modal Component
interface TradeModalProps {
    position: Position;
    portfolioId: string;
    onClose: () => void;
    onSubmit: (request: TradeRequest) => void;
    isLoading: boolean;
}

const TradeModal: React.FC<TradeModalProps> = ({
    position,
    portfolioId,
    onClose,
    onSubmit,
    isLoading,
}) => {
    const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
    const [quantity, setQuantity] = useState(1);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            portfolio_id: portfolioId,
            symbol: position.symbol,
            action,
            quantity,
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass-card"
                style={{
                    padding: '32px',
                    maxWidth: '400px',
                    width: '90%',
                }}
                onClick={e => e.stopPropagation()}
            >
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>
                    Trade {position.symbol}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px' }}>
                    Current Price: ${parseFloat(position.current_price).toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                    })}
                </p>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: 'var(--text-muted)',
                            fontSize: '0.875rem',
                        }}>
                            Action
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {(['BUY', 'SELL'] as const).map(a => (
                                <button
                                    key={a}
                                    type="button"
                                    onClick={() => setAction(a)}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: action === a ? 'none' : '1px solid var(--glass-border)',
                                        background: action === a
                                            ? (a === 'BUY' ? 'var(--accent-tertiary)' : 'var(--accent-danger)')
                                            : 'transparent',
                                        color: action === a ? 'white' : 'var(--text-secondary)',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    {a}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: 'var(--text-muted)',
                            fontSize: '0.875rem',
                        }}>
                            Quantity
                        </label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={e => setQuantity(Math.max(0.0001, parseFloat(e.target.value) || 0))}
                            min={0.0001}
                            step={0.0001}
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                background: 'var(--surface-2)',
                                border: '1px solid var(--glass-border)',
                                color: 'var(--text-primary)',
                            }}
                        />
                    </div>
                    <div style={{
                        padding: '12px',
                        background: 'var(--surface-2)',
                        borderRadius: '8px',
                        marginBottom: '24px',
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.875rem',
                        }}>
                            <span style={{ color: 'var(--text-muted)' }}>Estimated Total:</span>
                            <span style={{ fontWeight: 600 }}>
                                {(quantity * parseFloat(position.current_price)).toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                })}
                            </span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '8px',
                                border: '1px solid var(--glass-border)',
                                background: 'transparent',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '8px',
                                border: 'none',
                                background: action === 'BUY' ? 'var(--accent-tertiary)' : 'var(--accent-danger)',
                                color: 'white',
                                fontWeight: 600,
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                opacity: isLoading ? 0.6 : 1,
                            }}
                        >
                            {isLoading ? 'Processing...' : `Confirm ${action}`}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default PortfolioPage;
