import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AuthRedirect = () => {
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

  return null; // Este componente no renderiza nada
};

export default AuthRedirect;
