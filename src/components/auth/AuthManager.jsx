import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AuthManager = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/login', '/shop'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  console.log('[AuthManager] Estado:', { isAuthenticated, isLoading, pathname: location.pathname, isPublicRoute });

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Si está autenticado y está en login, redirigir al dashboard
        if (location.pathname === '/login') {
          console.log('[AuthManager] Usuario autenticado en login, redirigiendo a dashboard');
          navigate('/dashboard', { replace: true });
        }
      } else {
        // Si no está autenticado y no está en una ruta pública, redirigir al login
        if (!isPublicRoute) {
          console.log('[AuthManager] Usuario no autenticado en ruta protegida, redirigiendo a login');
          navigate('/login', { replace: true });
        }
      }
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate, isPublicRoute]);

  // Mostrar loading solo si no es una ruta pública
  if (isLoading && !isPublicRoute) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Verificando autenticación...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return children;
};

export default AuthManager;
