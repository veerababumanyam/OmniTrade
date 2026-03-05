import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthResponse } from '../types/api';

interface AuthState {
    user: {
        id: string;
        roles: string[];
    } | null;
    token: string | null;
    isAuthenticated: boolean;
    setAuth: (auth: AuthResponse) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            setAuth: (auth) => {
                localStorage.setItem('omnitrade_token', auth.token);
                set({
                    user: { id: auth.user_id, roles: auth.roles },
                    token: auth.token,
                    isAuthenticated: true,
                });
            },
            logout: () => {
                localStorage.removeItem('omnitrade_token');
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                });
            },
        }),
        {
            name: 'omnitrade-auth',
        }
    )
);
