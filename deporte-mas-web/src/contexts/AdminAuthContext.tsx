import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  verifyToken: (token: string) => Promise<{ success: boolean; message: string }>;
  devBypass: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};

const ADMIN_SESSION_KEY = 'admin_session_token';
const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verify session on mount
  useEffect(() => {
    verifySession();
  }, []);

  const verifySession = async () => {
    try {
      const sessionToken = localStorage.getItem(ADMIN_SESSION_KEY);

      if (!sessionToken) {
        setIsLoading(false);
        return;
      }

      // Skip backend verification for dev mock token
      if (DEV_MODE && sessionToken === 'dev-mock-token') {
        const mockUser: AdminUser = {
          id: 'dev-admin',
          email: 'dev@localhost',
          name: 'Dev Admin',
          role: 'super_admin'
        };
        setUser(mockUser);
        setIsLoading(false);
        return;
      }

      // Verify session with backend
      const { data, error } = await supabase.functions.invoke('admin-verify-session', {
        body: { sessionToken }
      });

      if (error || !data?.success) {
        localStorage.removeItem(ADMIN_SESSION_KEY);
        setUser(null);
      } else {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Session verification error:', error);
      localStorage.removeItem(ADMIN_SESSION_KEY);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-magic-link', {
        body: {
          email,
          returnUrl: window.location.origin + '/admin/auth/verify'
        }
      });

      if (error) {
        return {
          success: false,
          message: 'Failed to send magic link. Please try again.'
        };
      }

      if (!data?.success) {
        return {
          success: false,
          message: data?.message || 'Unauthorized email address.'
        };
      }

      return {
        success: true,
        message: 'Magic link sent! Check your email.'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'An error occurred. Please try again.'
      };
    }
  };

  const verifyToken = async (token: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-verify-token', {
        body: { token }
      });

      if (error || !data?.success) {
        return {
          success: false,
          message: 'Invalid or expired token.'
        };
      }

      // Store session token
      localStorage.setItem(ADMIN_SESSION_KEY, data.sessionToken);
      setUser(data.user);

      return {
        success: true,
        message: 'Authentication successful!'
      };
    } catch (error) {
      console.error('Token verification error:', error);
      return {
        success: false,
        message: 'Verification failed. Please try again.'
      };
    }
  };

  const logout = async () => {
    try {
      const sessionToken = localStorage.getItem(ADMIN_SESSION_KEY);

      if (sessionToken) {
        // Invalidate session on backend
        await supabase.functions.invoke('admin-logout', {
          body: { sessionToken }
        });
      }

      localStorage.removeItem(ADMIN_SESSION_KEY);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if backend call fails
      localStorage.removeItem(ADMIN_SESSION_KEY);
      setUser(null);
    }
  };

  const devBypass = () => {
    if (!DEV_MODE) {
      console.warn('Dev bypass only available in development mode');
      return;
    }

    // Set mock admin user in dev mode
    const mockUser: AdminUser = {
      id: 'dev-admin',
      email: 'dev@localhost',
      name: 'Dev Admin',
      role: 'super_admin'
    };

    localStorage.setItem(ADMIN_SESSION_KEY, 'dev-mock-token');
    setUser(mockUser);
  };

  const value: AdminAuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    verifyToken,
    devBypass
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
