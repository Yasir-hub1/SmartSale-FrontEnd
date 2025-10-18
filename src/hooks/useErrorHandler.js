import { useCallback } from 'react';
import { useNotification } from '../components/common/NotificationSystem';

export const useErrorHandler = () => {
  const { error: showError, success, warning, info } = useNotification();

  const handleApiError = useCallback((apiError, context = '') => {
    console.error(`[ErrorHandler] ${context}:`, apiError);
    
    // Si es un error de red
    if (!apiError.response) {
      showError('Error de conexión. Verifica tu conexión a internet.', 'Error de Red');
      return;
    }

    const { status, data } = apiError.response;
    
    // Manejar diferentes tipos de errores del backend
    switch (status) {
      case 400:
        // Error de validación
        if (data && typeof data === 'object') {
          const errorMessages = [];
          
          // Procesar errores de validación de Django
          if (data.errors) {
            Object.entries(data.errors).forEach(([field, messages]) => {
              if (Array.isArray(messages)) {
                errorMessages.push(...messages);
              } else {
                errorMessages.push(messages);
              }
            });
          } else if (data.detail) {
            errorMessages.push(data.detail);
          } else {
            // Procesar errores de campo específico
            Object.entries(data).forEach(([field, messages]) => {
              if (Array.isArray(messages)) {
                errorMessages.push(`${field}: ${messages.join(', ')}`);
              } else if (typeof messages === 'string') {
                errorMessages.push(`${field}: ${messages}`);
              }
            });
          }
          
          if (errorMessages.length > 0) {
            showError(errorMessages.join('\n'), 'Error de Validación');
          } else {
            showError('Datos inválidos. Revisa los campos del formulario.', 'Error de Validación');
          }
        } else {
          showError('Datos inválidos. Revisa los campos del formulario.', 'Error de Validación');
        }
        break;
        
      case 401:
        showError('Sesión expirada. Por favor, inicia sesión nuevamente.', 'Sesión Expirada');
        // Opcional: redirigir al login
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        break;
        
      case 403:
        showError('No tienes permisos para realizar esta acción.', 'Acceso Denegado');
        break;
        
      case 404:
        showError('Recurso no encontrado.', 'No Encontrado');
        break;
        
      case 409:
        showError('Conflicto: El recurso ya existe o está en uso.', 'Conflicto');
        break;
        
      case 422:
        // Error de validación específico
        if (data && data.detail) {
          showError(data.detail, 'Error de Validación');
        } else {
          showError('Datos inválidos. Revisa los campos del formulario.', 'Error de Validación');
        }
        break;
        
      case 429:
        warning('Demasiadas solicitudes. Espera un momento antes de intentar nuevamente.', 'Límite Excedido');
        break;
        
      case 500:
        showError('Error interno del servidor. Intenta nuevamente más tarde.', 'Error del Servidor');
        break;
        
      case 502:
      case 503:
      case 504:
        showError('Servidor no disponible. Intenta nuevamente más tarde.', 'Servidor No Disponible');
        break;
        
      default:
        if (data && data.detail) {
          showError(data.detail, `Error ${status}`);
        } else {
          showError(`Error inesperado (${status}). Intenta nuevamente.`, 'Error del Sistema');
        }
    }
  }, [showError, warning]);

  const handleSuccess = useCallback((message, title = 'Éxito') => {
    success(message, title);
  }, [success]);

  const handleWarning = useCallback((message, title = 'Advertencia') => {
    warning(message, title);
  }, [warning]);

  const handleInfo = useCallback((message, title = 'Información') => {
    info(message, title);
  }, [info]);

  return {
    handleApiError,
    handleSuccess,
    handleWarning,
    handleInfo
  };
};

export default useErrorHandler;
