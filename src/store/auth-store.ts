import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';

export type AgentUser = {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  role?: string;
  agentId?: string;
  agentCode?: string;
};

type AuthState = {
  isHydrated: boolean;
  accessToken: string | null;
  user: AgentUser | null;
  hydrate: () => Promise<void>;
  signIn: (token: string, user: AgentUser) => Promise<void>;
  signOut: () => Promise<void>;
};

const TOKEN_KEY = 'kezza_agent_access_token';
const USER_KEY = 'kezza_agent_user';

async function getItem(key: string) {
  if (Platform.OS === 'web') return localStorage.getItem(key);
  try { return await SecureStore.getItemAsync(key); } catch { return null; }
}
async function setItem(key: string, value: string) {
  if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
  await SecureStore.setItemAsync(key, value);
}
async function removeItem(key: string) {
  if (Platform.OS === 'web') { localStorage.removeItem(key); return; }
  try { await SecureStore.deleteItemAsync(key); } catch { /* The local session is still cleared. */ }
}

export const useAuthStore = create<AuthState>((set) => ({
  isHydrated: false,
  accessToken: null,
  user: null,
  hydrate: async () => {
    try {
      const [token, userJson] = await Promise.all([getItem(TOKEN_KEY), getItem(USER_KEY)]);
      if (token && userJson) {
        const user = JSON.parse(userJson) as AgentUser;
        if (user.agentId || user.role === 'admin') set({ accessToken: token, user });
      }
    } catch { /* Treat invalid saved data as a signed-out session. */ }
    finally { set({ isHydrated: true }); }
  },
  signIn: async (accessToken, user) => {
    await Promise.all([setItem(TOKEN_KEY, accessToken), setItem(USER_KEY, JSON.stringify(user))]);
    set({ accessToken, user });
  },
  signOut: async () => {
    await Promise.all([removeItem(TOKEN_KEY), removeItem(USER_KEY)]);
    set({ accessToken: null, user: null });
  },
}));
