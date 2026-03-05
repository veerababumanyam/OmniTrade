/**
 * PortfolioSummary Component
 * Displays summary card with total value, day P&L, total P&L, cash balance, and invested value
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, RefreshCw, Wallet, PieChart } from 'lucide-react';

interface PortfolioSummaryProps {
    totalValue: number;
    dayPnL: number;
    dayPnLPercent: number;
    totalPnL: number;
    totalPnLPercent: number;
    cashBalance: number;
    investedValue: number;
    isLoading?: boolean;
    onRefresh?: () => void;
}

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

const formatPercent = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
};

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({
    totalValue,
    dayPnL,
    dayPnLPercent,
    totalPnL,
    totalPnLPercent,
    cashBalance,
    investedValue,
    isLoading = false,
    onRefresh,
}) => {
    const isDayPositive = dayPnL >= 0;
    const isTotalPositive = totalPnL >= 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={{
                padding: '24px',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
            }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                    Portfolio Summary
                </h2>
                <button
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="glass-button"
                    style={{
                        background: 'var(--surface-2)',
                        border: '1px solid var(--glass-border)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                        opacity: isLoading ? 0.6 : 1,
                    }}
                >
                    <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Total Value */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '4px' }}>
                    Total Value
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '4px' }}>
                    {formatCurrency(totalValue)}
                </div>
            </div>

            {/* P&L Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '24px',
            }}>
                {/* Day P&L */}
                <div style={{
                    padding: '16px',
                    background: isDayPositive ? 'rgba(0, 255, 148, 0.05)' : 'rgba(255, 0, 85, 0.05)',
                    borderRadius: '12px',
                    border: `1px solid ${isDayPositive ? 'rgba(0, 255, 148, 0.15)' : 'rgba(255, 0, 85, 0.15)'}`,
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--text-muted)',
                        fontSize: '0.75rem',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                    }}>
                        {isDayPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        Day P&L
                    </div>
                    <div style={{
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: isDayPositive ? 'var(--accent-tertiary)' : 'var(--accent-danger)',
                    }}>
                        {formatCurrency(dayPnL)}
                    </div>
                    <div style={{
                        fontSize: '0.875rem',
                        color: isDayPositive ? 'var(--accent-tertiary)' : 'var(--accent-danger)',
                    }}>
                        {formatPercent(dayPnLPercent)}
                    </div>
                </div>

                {/* Total P&L */}
                <div style={{
                    padding: '16px',
                    background: isTotalPositive ? 'rgba(0, 255, 148, 0.05)' : 'rgba(255, 0, 85, 0.05)',
                    borderRadius: '12px',
                    border: `1px solid ${isTotalPositive ? 'rgba(0, 255, 148, 0.15)' : 'rgba(255, 0, 85, 0.15)'}`,
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--text-muted)',
                        fontSize: '0.75rem',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                    }}>
                        {isTotalPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        Total P&L
                    </div>
                    <div style={{
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: isTotalPositive ? 'var(--accent-tertiary)' : 'var(--accent-danger)',
                    }}>
                        {formatCurrency(totalPnL)}
                    </div>
                    <div style={{
                        fontSize: '0.875rem',
                        color: isTotalPositive ? 'var(--accent-tertiary)' : 'var(--accent-danger)',
                    }}>
                        {formatPercent(totalPnLPercent)}
                    </div>
                </div>
            </div>

            {/* Cash and Invested */}
            <div style={{
                display: 'flex',
                gap: '24px',
                paddingTop: '16px',
                borderTop: '1px solid var(--glass-border)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        padding: '8px',
                        background: 'var(--surface-2)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Wallet size={16} style={{ color: 'var(--accent-primary)' }} />
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            Cash Balance
                        </div>
                        <div style={{ fontWeight: 600 }}>
                            {formatCurrency(cashBalance)}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        padding: '8px',
                        background: 'var(--surface-2)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <PieChart size={16} style={{ color: 'var(--accent-secondary)' }} />
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            Invested Value
                        </div>
                        <div style={{ fontWeight: 600 }}>
                            {formatCurrency(investedValue)}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default PortfolioSummary;
