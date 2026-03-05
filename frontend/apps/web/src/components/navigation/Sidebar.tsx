import React from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, Briefcase, Settings, BarChart2 } from 'lucide-react';
import clsx from 'clsx';

export const Sidebar: React.FC = () => {
    const navItems = [
        { path: '/', icon: Activity, label: 'Signals' },
        { path: '/portfolio', icon: Briefcase, label: 'Portfolio' },
        { path: '/analytics', icon: BarChart2, label: 'Analytics' },
        { path: '/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <aside style={{
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            width: '80px',
            background: 'var(--surface-1)',
            borderRight: '1px solid var(--glass-border)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '24px 0',
            transition: 'var(--transition-normal)'
        }}>
            {/* Logo area */}
            <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                borderRadius: '12px',
                marginBottom: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(0, 229, 255, 0.2)'
            }}>
                <span style={{ fontWeight: 700, fontSize: '18px', color: '#fff' }}>O</span>
            </div>

            {/* Navigation Links */}
            <nav style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                width: '100%',
                alignItems: 'center'
            }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                            background: isActive ? 'var(--surface-2)' : 'transparent',
                            border: isActive ? '1px solid var(--glass-border)' : '1px solid transparent',
                            textDecoration: 'none',
                            transition: 'var(--transition-fast)'
                        })}
                        className={({ isActive }) => clsx('sidebar-link', { 'active': isActive })}
                        title={item.label}
                    >
                        <item.icon size={24} />
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};
