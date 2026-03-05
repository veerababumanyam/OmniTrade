import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/navigation/Sidebar';
import { Header } from '../components/navigation/Header';

export const MainLayout: React.FC = () => {
    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            width: '100vw',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-color)',
        }}>
            <Sidebar />
            <div style={{
                flex: 1,
                marginLeft: '80px',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                position: 'relative',
                overflowX: 'hidden'
            }}>
                <Header />
                <main style={{
                    flex: 1,
                    padding: '24px',
                    position: 'relative',
                    overflowY: 'auto'
                }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
