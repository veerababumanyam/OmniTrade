import React from 'react';
import { Bell, User, Search } from 'lucide-react';

interface HeaderProps {
    title?: string;
}

export const Header: React.FC<HeaderProps> = () => {
    return (
        <header style={{
            height: '72px',
            padding: '0 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(5, 7, 10, 0.5)',
            backdropFilter: 'var(--blur-md)',
            WebkitBackdropFilter: 'var(--blur-md)',
            borderBottom: '1px solid var(--glass-border)',
            position: 'sticky',
            top: 0,
            zIndex: 90
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    width: '300px'
                }}>
                    <Search size={16} style={{ color: 'var(--text-muted)', marginRight: '8px' }} />
                    <input
                        type="text"
                        placeholder="Search assets, symbols..."
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            width: '100%',
                            fontSize: '0.875rem'
                        }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Bell size={20} />
                    <span style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        width: '8px',
                        height: '8px',
                        background: 'var(--accent-primary)',
                        borderRadius: '50%',
                        boxShadow: '0 0 10px var(--accent-primary)'
                    }} />
                </button>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '6px 16px',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '24px',
                    cursor: 'pointer'
                }}>
                    <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--surface-1), var(--surface-2))',
                        border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <User size={14} style={{ color: 'var(--text-primary)' }} />
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Trader Mode</span>
                </div>
            </div>
        </header>
    );
};
