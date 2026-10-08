import { create } from 'zustand';
import { authApi } from '../lib/api.js';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
  plan: string;
  createdAt: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  initialized: boolean;

  register: (email: string, password: string, name?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restore: () => Promise<void>;
  setUser: (user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  initialized: false,

  register: async (email, password, name) => {
    set({ loading: true });
    try {
      const data = await authApi.register({
        email,
        password,
        name: name?.trim() || undefined,
      });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      set({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        initialized: true,
      });
    } finally {
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const data = await authApi.login({ email, password });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      set({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        initialized: true,
      });
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    const { refreshToken } = get();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Ignore logout errors; still clear local state
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      initialized: true,
    });
  },

  restore: async () => {
    const storedAccess = localStorage.getItem('accessToken');
    const storedRefresh = localStorage.getItem('refreshToken');

    if (!storedAccess || !storedRefresh) {
      set({ initialized: true });
      return;
    }

    try {
      const data = await authApi.me();
      set({
        user: data.user,
        accessToken: storedAccess,
        refreshToken: storedRefresh,
        initialized: true,
      });
    } catch {
      // Token might be expired; try refresh
      try {
        const refreshed = await authApi.refresh(storedRefresh);
        localStorage.setItem('accessToken', refreshed.accessToken);
        localStorage.setItem('refreshToken', refreshed.refreshToken);
        set({
          user: refreshed.user,
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          initialized: true,
        });
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          initialized: true,
        });
      }
    }
  },

  setUser: (user) => set({ user }),

  clearAuth: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));
