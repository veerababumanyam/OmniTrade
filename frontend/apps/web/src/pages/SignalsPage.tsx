import React, { useEffect } from 'react';
import { useProposalStore } from '../store/useProposalStore';
import { SignalCard } from '../components/SignalCard';
import { Inbox, RefreshCw, AlertCircle } from 'lucide-react';

export const SignalsPage: React.FC = () => {
    const { proposals, isLoading, error, fetchProposals, approveProposal, rejectProposal } = useProposalStore();

    useEffect(() => {
        fetchProposals('PENDING');
    }, [fetchProposals]);

    return (
        <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
                        Signal <span className="text-gradient">Inbox</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Review AI-generated trade proposals and execute Human-in-the-Loop workflows.
                    </p>
                </div>

                <button
                    onClick={() => fetchProposals('PENDING')}
                    disabled={isLoading}
                    style={{
                        background: 'var(--surface-2)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)',
                        padding: '12px 20px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'var(--transition-fast)'
                    }}
                    className="glass-button"
                >
                    <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </header>

            {error && (
                <div style={{
                    margin: '20px 0',
                    padding: '16px',
                    background: 'rgba(255, 0, 85, 0.1)',
                    border: '1px solid rgba(255, 0, 85, 0.2)',
                    borderRadius: '12px',
                    color: 'var(--accent-danger)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {isLoading && proposals.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '100px 0' }}>
                    <RefreshCw size={48} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
                    <p style={{ color: 'var(--text-muted)' }}>Fetching latest market signals...</p>
                </div>
            ) : proposals.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '100px 0',
                    background: 'var(--surface-1)',
                    borderRadius: '24px',
                    border: '1px dashed var(--glass-border)'
                }}>
                    <Inbox size={64} style={{ color: 'var(--text-muted)', marginBottom: '24px', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>No Pending Signals</h3>
                    <p style={{ color: 'var(--text-muted)' }}>
                        The AI agents are currently monitoring the markets. New proposals will appear here.
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                    gap: '24px'
                }}>
                    {proposals.map((proposal) => (
                        <SignalCard
                            key={proposal.id}
                            proposal={proposal}
                            onApprove={approveProposal}
                            onReject={rejectProposal}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
