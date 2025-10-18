import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import './LoginForm.css';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const { login, isLoading, error, clearError } = useAuth();
  const { handleApiError, handleSuccess } = useErrorHandler();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Limpiar errores cuando el usuario empiece a escribir
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = await login(formData);
    
        if (result.success) {
          console.log(`✅ Login exitoso: ${result.user.first_name || result.user.username}`);
          handleSuccess(`¡Bienvenido, ${result.user.first_name || result.user.username}!`);
        } else {
          console.error(`❌ Error de login: ${result.error || 'Credenciales inválidas'}`);
          handleApiError({ response: { status: 401, data: { detail: result.error || 'Credenciales inválidas' } } }, 'Login');
        }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>SmartSales365</h1>
          <p>Sistema de Gestión Comercial Inteligente</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Ingresa tu usuario"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Ingresa tu contraseña"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="login-footer">
          <p>Credenciales por defecto:</p>
          <p><strong>Usuario:</strong> admin</p>
          <p><strong>Contraseña:</strong> admin123</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
