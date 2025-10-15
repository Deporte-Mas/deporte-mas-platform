import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sendMagicLink: (email: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verify session on mount and listen for auth changes
  useEffect(() => {
    // Check initial session
    auth.verifySession().then((result) => {
      if (result.success && result.user) {
        setUser(result.user);
      }
      setIsLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email || 'No user');

      if (session?.user) {
        console.log('Usuario autenticado:', session.user.email);
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name,
        });
      } else {
        console.log('Usuario desautenticado, limpiando estado');
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const sendMagicLink = async (email: string): Promise<{ success: boolean; message: string }> => {
    return await auth.sendMagicLink(email);
  };

  const logout = async () => {
    try {
      console.log('Iniciando logout...');
      await auth.logout();
      // Forzar limpieza del estado local
      setUser(null);
      console.log('Logout completado, usuario limpiado');
    } catch (error) {
      console.error('Error durante logout:', error);
      // Aún así limpiar el estado local
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    sendMagicLink,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
