/**
 * User Store
 * 
 * Central state management for user authentication and trial status.
 * 
 * Features:
 * - Authentication state (logged in/out)
 * - Trial days remaining
 * - Subscription status
 * - Controls whether user can add expenses
 * 
 * CHANGES:
 * - Added isAuthenticated, user data
 * - Added login/logout/register actions
 */

import { create } from 'zustand';
import { api } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// Types
// ============================================================================

type SubscriptionStatus = 'trial' | 'expired' | 'monthly' | 'lifetime';

interface User {
    id: string;
    email: string;
    name: string;
}

interface UserState {
    // Auth state
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;

    // Trial state
    status: SubscriptionStatus;
    trialDaysLeft: number;
    isExpired: boolean;
    canAddExpenses: boolean;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    setUser: (user: User) => Promise<void>;  // For social auth
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    fetchStatus: () => Promise<void>;
    upgrade: (type: 'monthly' | 'lifetime') => Promise<void>;
}

// Storage keys
const USER_KEY = '@tem_user';

// ============================================================================
// Store
// ============================================================================

export const useUserStore = create<UserState>((set, get) => ({
    // Auth defaults
    isAuthenticated: false,
    user: null,
    isLoading: true,

    // Trial defaults
    status: 'trial',
    trialDaysLeft: 14,
    isExpired: false,
    canAddExpenses: true,

    checkAuth: async () => {
        try {
            const stored = await AsyncStorage.getItem(USER_KEY);
            if (stored) {
                const user = JSON.parse(stored);
                set({
                    isAuthenticated: true,
                    user,
                    isLoading: false
                });
                // Fetch trial status
                await get().fetchStatus();
            } else {
                set({ isLoading: false });
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            set({ isLoading: false });
        }
    },

    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const user = response.data.user;

        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
        set({
            isAuthenticated: true,
            user
        });

        // Fetch trial status after login
        await get().fetchStatus();
    },

    register: async (email, password, name) => {
        const response = await api.post('/auth/register', { email, password, name });
        const user = response.data.user;

        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
        set({
            isAuthenticated: true,
            user,
            status: 'trial',
            trialDaysLeft: 14,
            canAddExpenses: true,
        });
    },

    // For social auth - directly set user without API call
    setUser: async (user) => {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
        set({
            isAuthenticated: true,
            user,
        });
        // Fetch trial status
        await get().fetchStatus();
    },

    logout: async () => {
        await AsyncStorage.removeItem(USER_KEY);
        set({
            isAuthenticated: false,
            user: null,
            status: 'trial',
            trialDaysLeft: 14,
            isExpired: false,
            canAddExpenses: true,
        });
    },

    fetchStatus: async () => {
        const { user } = get();
        if (!user) return;

        try {
            const response = await api.get(`/user/${user.id}/status`);
            const data = response.data;

            set({
                status: data.status,
                trialDaysLeft: data.trialDaysLeft ?? 0,
                isExpired: data.isExpired,
                canAddExpenses: data.canAddExpenses,
            });
        } catch (error) {
            console.error('Failed to fetch user status:', error);
        }
    },

    upgrade: async (type) => {
        const { user } = get();
        if (!user) return;

        await api.post(`/user/${user.id}/upgrade`, { subscription: type });

        set({
            status: type,
            isExpired: false,
            canAddExpenses: true,
        });
    },
}));
