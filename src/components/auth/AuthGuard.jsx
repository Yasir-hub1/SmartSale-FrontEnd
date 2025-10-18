import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AuthGuard = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Si está autenticado y está en login, redirigir al dashboard
        if (location.pathname === '/login') {
          navigate('/dashboard', { replace: true });
        }
      } else {
        // Si no está autenticado y no está en login, redirigir al login
        if (location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      }
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate]);

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
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

export default AuthGuard;
