import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Check, X, Zap } from 'lucide-react';
import type { TradeProposal } from '../types/api';

interface SignalCardProps {
    proposal: TradeProposal;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
}

export const SignalCard: React.FC<SignalCardProps> = ({ proposal, onApprove, onReject }) => {
    const isBuy = proposal.action === 'BUY';
    const confidencePercent = Math.round(proposal.confidence_score * 100);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="glass-card glow-blue"
            style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}
        >
            {/* Confidence Indicator Decorator */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '4px',
                    width: `${confidencePercent}%`,
                    background: `linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))`,
                    boxShadow: '0 0 10px rgba(0, 229, 255, 0.5)'
                }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{proposal.symbol}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: isBuy ? 'rgba(0, 255, 148, 0.1)' : 'rgba(255, 0, 85, 0.1)',
                            color: isBuy ? 'var(--accent-tertiary)' : 'var(--accent-danger)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            {isBuy ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {proposal.action}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            via {proposal.proposed_by_model}
                        </span>
                    </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                        {confidencePercent}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Confidence
                    </div>
                </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '24px' }}>
                {proposal.reasoning}
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
                <button
                    onClick={() => onApprove(proposal.id)}
                    className="glass-button"
                    style={{
                        flex: 1,
                        background: 'rgba(0, 255, 148, 0.1)',
                        color: 'var(--accent-tertiary)',
                        border: '1px solid rgba(0, 255, 148, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600
                    }}
                >
                    <Check size={18} /> Approve
                </button>
                <button
                    onClick={() => onReject(proposal.id)}
                    className="glass-button"
                    style={{
                        flex: 1,
                        background: 'rgba(255, 0, 85, 0.1)',
                        color: 'var(--accent-danger)',
                        border: '1px solid rgba(255, 0, 85, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600
                    }}
                >
                    <X size={18} /> Reject
                </button>
                <button
                    className="glass-button"
                    style={{
                        width: '44px',
                        background: 'var(--surface-2)',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)'
                    }}
                >
                    <Zap size={18} />
                </button>
            </div>
        </motion.div>
    );
};
