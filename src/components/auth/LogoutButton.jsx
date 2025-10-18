import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import './LogoutButton.css';

const LogoutButton = () => {
  const { logout, user } = useAuth();
  const { handleApiError, handleSuccess } = useErrorHandler();

  const handleLogout = async () => {
    try {
      await logout();
      console.log('✅ Sesión cerrada correctamente');
      handleSuccess('Sesión cerrada correctamente');
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
      handleApiError(error, 'Cerrar sesión');
    }
  };

  return (
    <div className="logout-container">
      <div className="user-info">
        <span>Hola, {user?.first_name || user?.username || 'Usuario'}</span>
      </div>
      <button 
        onClick={handleLogout}
        className="logout-button"
        title="Cerrar sesión"
      >
        <span className="logout-icon">🚪</span>
        Cerrar Sesión
      </button>
    </div>
  );
};

export default LogoutButton;