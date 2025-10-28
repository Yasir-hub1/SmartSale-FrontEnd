import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import './LoginForm.css';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isLoading, error, clearError } = useAuth();
  const { handleApiError, handleSuccess } = useErrorHandler();

  console.log('LoginForm - isLoading:', isLoading, 'isSubmitting:', isSubmitting, 'error:', error);

  const handleChange = (e) => {
    console.log('Input change:', e.target.name, e.target.value);
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
    
    setIsSubmitting(true);
    
    const result = await login(formData);
    
        if (result.success) {
          console.log(`✅ Login exitoso: ${result.user.first_name || result.user.username}`);
          handleSuccess(`¡Bienvenido, ${result.user.first_name || result.user.username}!`);
        } else {
          console.error(`❌ Error de login: ${result.error || 'Credenciales inválidas'}`);
          handleApiError({ response: { status: 401, data: { detail: result.error || 'Credenciales inválidas' } } }, 'Login');
        }
    
    setIsSubmitting(false);
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="login-footer">
          <p>Credenciales por defecto:</p>
          <p><strong>Usuario:</strong> admin</p>
          <p><strong>Contraseña:</strong> admin123</p>
          
          {/* Botón de test temporal */}
          <button 
            type="button" 
            onClick={() => {
              console.log('Test button clicked');
              console.log('Form data:', formData);
              console.log('isSubmitting:', isSubmitting);
              console.log('isLoading:', isLoading);
            }}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Test Debug
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
