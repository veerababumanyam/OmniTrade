/**
 * PortfolioChart Component
 * Line chart showing portfolio performance over time using Recharts
 * with date range selector (1W, 1M, 3M, 1Y)
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from 'recharts';
import { Calendar } from 'lucide-react';

type DateRange = '1W' | '1M' | '3M' | '1Y';

interface PortfolioDataPoint {
    date: string;
    value: number;
    pnl: number;
}

interface PortfolioChartProps {
    data: PortfolioDataPoint[];
    isLoading?: boolean;
    onRangeChange?: (range: DateRange) => void;
}

const rangeButtons: { label: string; value: DateRange }[] = [
    { label: '1W', value: '1W' },
    { label: '1M', value: '1M' },
    { label: '3M', value: '3M' },
    { label: '1Y', value: '1Y' },
];

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const formatDate = (dateStr: string, range: DateRange): string => {
    const date = new Date(dateStr);
    if (range === '1W') {
        return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
    } else if (range === '1M') {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
};

const CustomTooltip = ({ active, payload, label }: any) => {
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
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '8px' }}>
                    {new Date(label).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    })}
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '4px' }}>
                    {formatCurrency(data.value)}
                </div>
                <div style={{
                    fontSize: '0.875rem',
                    color: data.pnl >= 0 ? 'var(--accent-tertiary)' : 'var(--accent-danger)',
                }}>
                    {data.pnl >= 0 ? '+' : ''}{formatCurrency(data.pnl)}
                </div>
            </div>
        );
    }
    return null;
};

export const PortfolioChart: React.FC<PortfolioChartProps> = ({
    data,
    isLoading = false,
    onRangeChange,
}) => {
    const [selectedRange, setSelectedRange] = useState<DateRange>('1M');

    const handleRangeChange = (range: DateRange) => {
        setSelectedRange(range);
        onRangeChange?.(range);
    };

    const filteredData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const now = new Date();
        let startDate = new Date();

        switch (selectedRange) {
            case '1W':
                startDate.setDate(now.getDate() - 7);
                break;
            case '1M':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case '3M':
                startDate.setMonth(now.getMonth() - 3);
                break;
            case '1Y':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
        }

        return data.filter((point) => new Date(point.date) >= startDate);
    }, [data, selectedRange]);

    const chartMinValue = useMemo(() => {
        if (!filteredData || filteredData.length === 0) return 0;
        const min = Math.min(...filteredData.map((d) => d.value));
        return min * 0.95;
    }, [filteredData]);

    const chartMaxValue = useMemo(() => {
        if (!filteredData || filteredData.length === 0) return 100000;
        const max = Math.max(...filteredData.map((d) => d.value));
        return max * 1.05;
    }, [filteredData]);

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
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '12px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={18} style={{ color: 'var(--accent-primary)' }} />
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                        Portfolio Performance
                    </h2>
                </div>

                {/* Date Range Selector */}
                <div style={{
                    display: 'flex',
                    gap: '4px',
                    background: 'var(--surface-2)',
                    padding: '4px',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border)',
                }}>
                    {rangeButtons.map((btn) => (
                        <button
                            key={btn.value}
                            onClick={() => handleRangeChange(btn.value)}
                            className="glass-button"
                            style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                background: selectedRange === btn.value
                                    ? 'var(--accent-primary)'
                                    : 'transparent',
                                color: selectedRange === btn.value
                                    ? 'var(--text-primary)'
                                    : 'var(--text-secondary)',
                                fontSize: '0.875rem',
                                fontWeight: selectedRange === btn.value ? 600 : 400,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
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
                        Loading chart...
                    </div>
                ) : !filteredData || filteredData.length === 0 ? (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: 'var(--text-muted)',
                    }}>
                        No data available for selected period
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={filteredData}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop
                                        offset="5%"
                                        stopColor="var(--accent-primary)"
                                        stopOpacity={0.3}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="var(--accent-primary)"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="var(--glass-border)"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(value) => formatDate(value, selectedRange)}
                                stroke="var(--text-muted)"
                                tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                                axisLine={{ stroke: 'var(--glass-border)' }}
                                tickLine={false}
                            />
                            <YAxis
                                domain={[chartMinValue, chartMaxValue]}
                                tickFormatter={formatCurrency}
                                stroke="var(--text-muted)"
                                tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                                axisLine={{ stroke: 'var(--glass-border)' }}
                                tickLine={false}
                                width={80}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="var(--accent-primary)"
                                strokeWidth={2}
                                fill="url(#portfolioGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </motion.div>
    );
};

export default PortfolioChart;
