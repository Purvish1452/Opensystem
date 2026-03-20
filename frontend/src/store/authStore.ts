import { create } from 'zustand';
import type { User } from '../types/api.types';
import { tokenManager } from '../security/tokenManager';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isInitializing: boolean;
    setAuth: (user: User, accessToken: string) => void;
    clearAuth: () => void;
    setInitializing: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isInitializing: true, // Used while we attempt silent refresh on mount

    setAuth: (user, accessToken) => {
        tokenManager.setToken(accessToken);
        set({
            user,
            isAuthenticated: true,
            isInitializing: false,
        });
    },

    clearAuth: () => {
        tokenManager.clearToken();
        set({
            user: null,
            isAuthenticated: false,
            isInitializing: false,
        });
    },

    setInitializing: (val) => set({ isInitializing: val }),
}));
