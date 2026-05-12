import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { roleHome } from '../constants/roles.js';
import { resetQueryCache } from '../services/queryClient.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      theme: 'light',
      login: async ({ email, password }) => {
        let response;
        try {
          response = await fetch(`${API_BASE}/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
        } catch {
          throw new Error('Cannot reach authentication server');
        }

        let data = null;
        try {
          data = await response.json();
        } catch {
          // non-JSON response
        }

        if (!response.ok) {
          const message = data?.detail || data?.message || data?.error || 'Invalid email or password';
          throw new Error(message);
        }

        if (!data?.user || !roleHome[data.user.role]) {
          throw new Error('Login response missing user or role');
        }

        // Wipe any cached data from a previous session so the new user
        // never sees stale data and never tries to render with the wrong role.
        resetQueryCache();

        set({ user: data.user, token: data.access || data.token || null });
        return roleHome[data.user.role];
      },
      logout: () => {
        resetQueryCache();
        set({ user: null, token: null });
      },
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        document.documentElement.classList.toggle('dark', next === 'dark');
        set({ theme: next });
      },
    }),
    {
      name: 'sspay-session',
      onRehydrateStorage: () => (state) => {
        if (state?.theme === 'dark') document.documentElement.classList.add('dark');
      },
    },
  ),
);
