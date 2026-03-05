/**
 * AllocationChart Component
 * Pie chart showing portfolio allocation by asset/sector using Recharts
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

interface AllocationItem {
    name: string;
    value: number;
    symbol?: string;
    sector?: string;
}

interface AllocationChartProps {
    data: AllocationItem[];
    isLoading?: boolean;
    onSliceClick?: (item: AllocationItem) => void;
}

const COLORS = [
    'var(--accent-primary)',
    'var(--accent-secondary)',
    'var(--accent-tertiary)',
    '#8b5cf6',
    '#ec4899',
    '#f59e0b',
    '#10b981',
    '#3b82f6',
    '#6366f1',
    '#14b8c6',
];

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const formatPercent = (value: number): string => {
    return `${value.toFixed(1)}%`;
};

interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                padding: '12px 16px',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
            }}>
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>
                    {data.symbol ? `${data.symbol} - ${data.name}` : data.name}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Value: {formatCurrency(data.value)}
                </div>
                <div style={{ color: 'var(--accent-primary)', fontSize: '0.875rem' }}>
                    {formatPercent(data.percentage)} of portfolio
                </div>
                {data.sector && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
                        Sector: {data.sector}
                    </div>
                )}
            </div>
        );
    }
    return null;
};

export const AllocationChart: React.FC<AllocationChartProps> = ({
    data,
    isLoading = false,
    onSliceClick,
}) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    // Calculate percentages
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    const dataWithPercentages = data.map(item => ({
        ...item,
        percentage: totalValue > 0 ? (item.value / totalValue) * 100 : 0,
    }));

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    const onPieLeave = () => {
        setActiveIndex(null);
    };

    const handleClick = (_: any, index: number) => {
        onSliceClick?.(dataWithPercentages[index]);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={{
                padding: '24px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '24px',
            }}>
                <PieChartIcon size={18} style={{ color: 'var(--accent-primary)' }} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                    Allocation
                </h2>
            </div>

            {/* Chart */}
            <div style={{ flex: 1, minHeight: '300px', position: 'relative' }}>
                {isLoading ? (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: 'var(--text-muted)',
                    }}>
                        Loading allocation...
                    </div>
                ) : !data || data.length === 0 ? (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: 'var(--text-muted)',
                    }}>
                        No positions to display
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={dataWithPercentages}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                                onMouseEnter={onPieEnter}
                                onMouseLeave={onPieLeave}
                                onClick={handleClick}
                                animationBegin={0}
                                animationDuration={800}
                                animationEasing="ease-out"
                            >
                                {dataWithPercentages.map((_, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                        stroke={activeIndex === index ? 'var(--text-primary)' : 'transparent'}
                                        strokeWidth={activeIndex === index ? 2 : 0}
                                        style={{
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            filter: activeIndex === index ? 'brightness(1.2)' : 'none',
                                        }}
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                formatter={(value: string, entry: any) => {
                                    const item = entry.payload;
                                    return (
                                        <span style={{
                                            color: 'var(--text-secondary)',
                                            fontSize: '0.75rem',
                                        }}>
                                            {item.symbol || value} ({formatPercent(item.percentage)})
                                        </span>
                                    );
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Summary */}
            {!isLoading && data.length > 0 && (
                <div style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--glass-border)',
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: 'var(--text-muted)',
                        fontSize: '0.875rem',
                    }}>
                        <span>Total Assets</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {data.length}
                        </span>
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: 'var(--text-muted)',
                        fontSize: '0.875rem',
                        marginTop: '8px',
                    }}>
                        <span>Total Value</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {formatCurrency(totalValue)}
                        </span>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default AllocationChart;
