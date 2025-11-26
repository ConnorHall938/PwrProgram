import {
  createContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { api } from '@/lib/api';
import type { AuthState } from '@/types';

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const refreshUser = async () => {
    try {
      const user = await api.getCurrentUser();
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  useEffect(() => {
    let cancelled = false;
    
    async function checkAuth() {
      try {
        const user = await api.getCurrentUser();
        if (!cancelled) {
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        }
      } catch {
        if (!cancelled) {
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      }
    }
    
    checkAuth();
    
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const user = await api.login(email, password);
    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
  }) => {
    const user = await api.register(data);
    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = async () => {
    await api.logout();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
