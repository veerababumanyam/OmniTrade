/**
 * PositionsTable Component
 * Table of positions with columns: Symbol, Quantity, Avg Cost, Current Price, Market Value, P&L, Weight
 * Features live price updates via WebSocket and sortable columns
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, Circle } from 'lucide-react';
import type { Position } from '../../types/portfolio';

type SortDirection = 'asc' | 'desc' | null;

interface ColumnConfig {
    id: string;
    header: string;
    accessor: keyof Position | ((row: Position) => unknown);
    sortable?: boolean;
    align?: 'left' | 'center' | 'right';
    format?: (value: unknown, row: Position) => React.ReactNode;
}

interface PositionsTableProps {
    positions: Position[];
    isLoading?: boolean;
    onPositionClick?: (position: Position) => void;
    wsEndpoint?: string;
}

const formatCurrency = (value: unknown): string => {
    const num = typeof value === 'string' ? parseFloat(value) : typeof value === 'number' ? value : 0;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};

const formatPercent = (value: unknown): string => {
    const num = typeof value === 'string' ? parseFloat(value) : typeof value === 'number' ? value : 0;
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toFixed(2)}%`;
};

const formatNumber = (value: unknown, decimals: number = 2): string => {
    const num = typeof value === 'string' ? parseFloat(value) : typeof value === 'number' ? value : 0;
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
};

const columns: ColumnConfig[] = [
    {
        id: 'symbol',
        header: 'Symbol',
        accessor: 'symbol',
        sortable: true,
        align: 'left',
    },
    {
        id: 'quantity',
        header: 'Quantity',
        accessor: 'quantity',
        sortable: true,
        align: 'right',
        format: (value) => formatNumber(value, 4),
    },
    {
        id: 'avg_cost',
        header: 'Avg Cost',
        accessor: 'avg_cost',
        sortable: true,
        align: 'right',
        format: (value) => formatCurrency(value),
    },
    {
        id: 'current_price',
        header: 'Current Price',
        accessor: 'current_price',
        sortable: true,
        align: 'right',
        format: (value) => (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                <span>{formatCurrency(value)}</span>
                <LiveIndicator />
            </div>
        ),
    },
    {
        id: 'market_value',
        header: 'Market Value',
        accessor: 'market_value',
        sortable: true,
        align: 'right',
        format: (value) => formatCurrency(value),
    },
    {
        id: 'unrealized_pnl',
        header: 'P&L',
        accessor: 'unrealized_pnl',
        sortable: true,
        align: 'right',
        format: (value, row) => {
            const pnl = typeof value === 'string' ? parseFloat(value) : typeof value === 'number' ? value : 0;
            const pnlPercent = typeof row.unrealized_pnl_pct === 'string' ? parseFloat(row.unrealized_pnl_pct) : typeof row.unrealized_pnl_pct === 'number' ? row.unrealized_pnl_pct : 0;
            const isPositive = pnl >= 0;
            return (
                <div style={{ color: isPositive ? 'var(--accent-tertiary)' : 'var(--accent-danger)' }}>
                    <div style={{ fontWeight: 600 }}>{formatCurrency(pnl)}</div>
                    <div style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                        {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {formatPercent(pnlPercent)}
                    </div>
                </div>
            );
        },
    },
    {
        id: 'weight',
        header: 'Weight',
        accessor: 'weight',
        sortable: true,
        align: 'right',
        format: (value) => {
            const num = typeof value === 'string' ? parseFloat(value) : typeof value === 'number' ? value : 0;
            return (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                    <div style={{
                        width: '60px',
                        height: '4px',
                        background: 'var(--surface-2)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            width: `${Math.min(num, 100)}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                            borderRadius: '2px',
                        }} />
                    </div>
                    <span style={{ minWidth: '45px', textAlign: 'right' }}>
                        {formatPercent(num)}
                    </span>
                </div>
            );
        }
    },
];

const LiveIndicator: React.FC = () => {
    return (
        <Circle
            size={6}
            fill={'var(--accent-tertiary)'}
            style={{
                animation: 'pulse 2s infinite',
            }}
        />
    );
};

export const PositionsTable: React.FC<PositionsTableProps> = ({
    positions,
    isLoading = false,
    onPositionClick,
    wsEndpoint,
}) => {
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [livePrices, setLivePrices] = useState<Record<string, number>>({});

    // WebSocket connection for live prices
    useEffect(() => {
        if (!wsEndpoint) return;

        let ws: WebSocket | null = null;
        let reconnectTimeout: ReturnType<typeof setTimeout>;

        const connect = () => {
            try {
                ws = new WebSocket(wsEndpoint);

                ws.onopen = () => {
                    const symbols = positions.map(p => p.symbol);
                    const message = { action: 'subscribe', symbols };
                    ws?.send(JSON.stringify(message));
                };

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.symbol && data.price) {
                            setLivePrices((prev) => ({
                                ...prev,
                                [data.symbol]: data.price,
                            }));
                        }
                    } catch (e) {
                        console.error('Failed to parse WebSocket message:', e);
                    }
                };

                ws.onclose = () => {
                    reconnectTimeout = setTimeout(connect, 3000);
                };

                ws.onerror = () => {
                    ws?.close();
                };
            } catch (error) {
                console.error('Failed to create WebSocket connection:', error);
            }
        };

        connect();

        return () => {
            clearTimeout(reconnectTimeout);
            ws?.close();
        };
    }, [wsEndpoint, positions]);

    // Merge live prices with positions
    const positionsWithLivePrices = useMemo(() => {
        return positions.map((pos) => {
            const livePrice = livePrices[pos.symbol];
            if (livePrice !== undefined) {
                const quantity = typeof pos.quantity === 'string' ? parseFloat(pos.quantity) : pos.quantity;
                const avgCost = typeof pos.avg_cost === 'string' ? parseFloat(pos.avg_cost) : pos.avg_cost;
                const marketValue = livePrice * quantity;
                const pnl = marketValue - avgCost * quantity;
                const pnlPercent = (pnl / (avgCost * quantity)) * 100;
                return {
                    ...pos,
                    current_price: livePrice.toString(),
                    market_value: marketValue.toString(),
                    unrealized_pnl: pnl.toString(),
                    unrealized_pnl_pct: pnlPercent.toString(),
                };
            }
            return pos;
        });
    }, [positions, livePrices]);

    const handleSort = useCallback((columnId: string) => {
        const column = columns.find((c) => c.id === columnId);
        if (!column?.sortable) return;

        let newDirection: SortDirection = 'asc';
        if (sortColumn === columnId) {
            if (sortDirection === 'asc') newDirection = 'desc';
            else if (sortDirection === 'desc') newDirection = null;
        }

        setSortColumn(newDirection ? columnId : null);
        setSortDirection(newDirection);
    }, [sortColumn, sortDirection]);

    const sortedPositions = useMemo(() => {
        if (!sortColumn || !sortDirection) return positionsWithLivePrices;

        const column = columns.find((c) => c.id === sortColumn);
        if (!column) return positionsWithLivePrices;

        return [...positionsWithLivePrices].sort((a, b) => {
            const aValue = typeof column.accessor === 'function'
                ? column.accessor(a)
                : a[column.accessor as keyof Position];
            const bValue = typeof column.accessor === 'function'
                ? column.accessor(b)
                : b[column.accessor as keyof Position];

            const aNum = typeof aValue === 'string' ? parseFloat(aValue as string) : (aValue as number);
            const bNum = typeof bValue === 'string' ? parseFloat(bValue as string) : (bValue as number);

            if (aNum === bNum) return 0;
            if (aNum === null || aNum === undefined || isNaN(aNum)) return sortDirection === 'asc' ? 1 : -1;
            if (bNum === null || bNum === undefined || isNaN(bNum)) return sortDirection === 'asc' ? -1 : 1;

            const comparison = aNum < bNum ? -1 : 1;
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [positionsWithLivePrices, sortColumn, sortDirection]);

    const getCellValue = (row: Position, accessor: keyof Position | ((row: Position) => unknown)): unknown => {
        if (typeof accessor === 'function') {
            return accessor(row);
        }
        return row[accessor];
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={{
                padding: '24px',
                overflow: 'hidden',
            }}
        >
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
            }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                    Positions
                </h2>
                <div style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.875rem',
                }}>
                    {sortedPositions.length} position{sortedPositions.length !== 1 ? 's' : ''}
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                            {columns.map((col) => {
                                const isSorted = sortColumn === col.id;
                                return (
                                    <th
                                        key={col.id}
                                        onClick={() => col.sortable && handleSort(col.id)}
                                        style={{
                                            padding: '12px 16px',
                                            textAlign: col.align || 'left',
                                            cursor: col.sortable ? 'pointer' : 'default',
                                            color: 'var(--text-muted)',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            whiteSpace: 'nowrap',
                                            userSelect: 'none',
                                        }}
                                    >
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                        }}>
                                            {col.header}
                                            {col.sortable && (
                                                <span style={{
                                                    opacity: isSorted ? 1 : 0.3,
                                                    marginLeft: '4px',
                                                }}>
                                                    {isSorted && sortDirection === 'asc' ? (
                                                        <ArrowUp size={12} />
                                                    ) : isSorted && sortDirection === 'desc' ? (
                                                        <ArrowDown size={12} />
                                                    ) : (
                                                        <ArrowUp size={12} />
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length} style={{ padding: '40px', textAlign: 'center' }}>
                                    <div style={{ color: 'var(--text-muted)' }}>Loading positions...</div>
                                </td>
                            </tr>
                        ) : sortedPositions.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} style={{ padding: '40px', textAlign: 'center' }}>
                                    <div style={{ color: 'var(--text-muted)' }}>No positions found</div>
                                </td>
                            </tr>
                        ) : (
                            sortedPositions.map((position, index) => (
                                <motion.tr
                                    key={position.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => onPositionClick?.(position)}
                                    style={{
                                        borderBottom: '1px solid var(--glass-border)',
                                        cursor: onPositionClick ? 'pointer' : 'default',
                                        transition: 'background 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'var(--surface-2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    {columns.map((col) => {
                                        const value = getCellValue(position, col.accessor);
                                        return (
                                            <td
                                                key={col.id}
                                                style={{
                                                    padding: '16px',
                                                    textAlign: col.align || 'left',
                                                    verticalAlign: 'middle',
                                                }}
                                            >
                                                {col.format
                                                    ? col.format(value, position)
                                                    : String(value ?? '')}
                                            </td>
                                        );
                                    })}
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

export default PositionsTable;
