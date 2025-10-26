import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

// Hook para usar el contexto
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};


const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    }
  };

  // Verificar autenticación al cargar la app
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('[AuthContext] Iniciando verificación de autenticación...');
        setIsLoading(true);
        setError(null);

        const token = localStorage.getItem('access_token');
        const userData = authService.getCurrentUser();
        
        console.log('[AuthContext] Token:', token ? 'Presente' : 'No presente');
        console.log('[AuthContext] UserData:', userData);
        
        if (!token || !userData) {
          console.log('[AuthContext] No hay token o usuario, marcando como no autenticado');
          setIsAuthenticated(false);
          setUser(null);
          return;
        }

        // Por ahora, si hay token y usuario, consideramos autenticado
        console.log('[AuthContext] Token y usuario presentes, marcando como autenticado');
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('[AuthContext] Error verificando autenticación:', error);
        setError(error.message);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        console.log('[AuthContext] Verificación completada');
        setIsLoading(false);
      }
    };

    // Timeout de seguridad para asegurar que isLoading se establezca en false
    const timeoutId = setTimeout(() => {
      console.log('[AuthContext] Timeout de seguridad - estableciendo isLoading en false');
      setIsLoading(false);
    }, 3000);

    checkAuth().finally(() => {
      clearTimeout(timeoutId);
    });
  }, []);

  const login = async (credentials) => {
    try {
      setIsLoading(true);
      setError(null);

      const { access, refresh, user: userData } = await authService.login(credentials);
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Error en login:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const newToken = await authService.refreshToken();
      return { success: true, token: newToken };
    } catch (error) {
      console.error('Error refrescando token:', error);
      await logout();
      return { success: false, error: error.message };
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    refreshToken,
    updateUser,
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, useAuth };
export default AuthContext;
