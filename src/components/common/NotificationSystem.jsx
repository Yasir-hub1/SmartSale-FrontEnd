import React, { createContext, useContext, useState, useCallback } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import './NotificationSystem.css';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe ser usado dentro de NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: 'info',
      title: '',
      message: '',
      duration: 5000,
      ...notification
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto remove after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Helper methods for different notification types
  const success = useCallback((message, title = 'Éxito', options = {}) => {
    return addNotification({
      type: 'success',
      title,
      message,
      ...options
    });
  }, [addNotification]);

  const error = useCallback((message, title = 'Error', options = {}) => {
    return addNotification({
      type: 'error',
      title,
      message,
      duration: 8000, // Errors stay longer
      ...options
    });
  }, [addNotification]);

  const warning = useCallback((message, title = 'Advertencia', options = {}) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      ...options
    });
  }, [addNotification]);

  const info = useCallback((message, title = 'Información', options = {}) => {
    return addNotification({
      type: 'info',
      title,
      message,
      ...options
    });
  }, [addNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

const NotificationItem = ({ notification, onRemove }) => {
  const { type, title, message } = notification;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="notification-icon success" />;
      case 'error':
        return <FaExclamationTriangle className="notification-icon error" />;
      case 'warning':
        return <FaExclamationTriangle className="notification-icon warning" />;
      case 'info':
      default:
        return <FaInfoCircle className="notification-icon info" />;
    }
  };

  return (
    <div className={`notification notification-${type}`}>
      <div className="notification-content">
        {getIcon()}
        <div className="notification-text">
          {title && <div className="notification-title">{title}</div>}
          <div className="notification-message">{message}</div>
        </div>
      </div>
      <button 
        className="notification-close"
        onClick={onRemove}
        aria-label="Cerrar notificación"
      >
        <FaTimes />
      </button>
    </div>
  );
};

export default NotificationProvider;
