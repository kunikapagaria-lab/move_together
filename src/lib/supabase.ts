import type { User, Session } from '@supabase/supabase-js';

const MOCK_USER: User = {
  id: 'mock-user-123',
  app_metadata: {},
  user_metadata: { username: 'ironman' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'mock@example.com',
  phone: '',
  role: 'authenticated',
  updated_at: new Date().toISOString(),
};

const MOCK_SESSION: Session = {
  access_token: 'mock-token',
  refresh_token: 'mock-refresh',
  expires_in: 3600,
  token_type: 'bearer',
  user: MOCK_USER,
};

let authListeners: any[] = [];
let currentUser: User | null = null;
let currentSession: Session | null = null;

export const supabase = {
  auth: {
    getSession: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { data: { session: currentSession } };
    },
    onAuthStateChange: (callback: any) => {
      authListeners.push(callback);
      return { 
        data: { 
          subscription: { 
            unsubscribe: () => {
              authListeners = authListeners.filter(l => l !== callback);
            } 
          } 
        } 
      };
    },
    signInWithPassword: async (_credentials: any) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      currentUser = MOCK_USER;
      currentSession = MOCK_SESSION;
      authListeners.forEach(listener => listener('SIGNED_IN', currentSession));
      return { data: { user: currentUser, session: currentSession }, error: null };
    },
    signUp: async (credentials: any) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const newUser = { ...MOCK_USER, email: credentials.email, user_metadata: { username: credentials.options?.data?.username } };
      currentUser = newUser;
      currentSession = { ...MOCK_SESSION, user: newUser };
      authListeners.forEach(listener => listener('SIGNED_IN', currentSession));
      return { data: { user: currentUser, session: currentSession }, error: null };
    },
    signOut: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      currentUser = null;
      currentSession = null;
      authListeners.forEach(listener => listener('SIGNED_OUT', null));
      return { error: null };
    },
  },
} as any;
