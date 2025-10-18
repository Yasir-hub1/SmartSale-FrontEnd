// Hook para monitorear estado de conexión
import { useState, useEffect, useCallback } from 'react';
import { apiUtils } from '../services/api';

const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInitializing, setIsInitializing] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  // Verificar conexión al backend
  const checkBackendConnection = useCallback(async () => {
    try {
      const isConnected = await apiUtils.checkConnection();
      setBackendConnected(isConnected);
      setLastChecked(new Date());
      return isConnected;
    } catch (error) {
      setBackendConnected(false);
      setLastChecked(new Date());
      return false;
    }
  }, []);

  // Verificar conexión inicial
  useEffect(() => {
    const initializeConnection = async () => {
      setIsInitializing(true);
      await checkBackendConnection();
      setIsInitializing(false);
    };

    initializeConnection();
  }, [checkBackendConnection]);

  // Monitorear cambios en el estado de conexión del navegador
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Verificar conexión al backend cuando se restablece la conexión
      setTimeout(checkBackendConnection, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setBackendConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkBackendConnection]);

  // Verificar conexión periódicamente cuando está online
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(() => {
      checkBackendConnection();
    }, 120000); // Verificar cada 2 minutos

    return () => clearInterval(interval);
  }, [isOnline, checkBackendConnection]);

  // Función para verificar conexión manualmente
  const refreshConnection = useCallback(async () => {
    setIsInitializing(true);
    const result = await checkBackendConnection();
    setIsInitializing(false);
    return result;
  }, [checkBackendConnection]);

  return {
    isOnline,
    isInitializing,
    backendConnected,
    lastChecked,
    refreshConnection,
    // Estado combinado: online si hay conexión a internet Y al backend
    isFullyOnline: isOnline && backendConnected,
    // Estado de conexión para mostrar al usuario
    connectionStatus: isInitializing 
      ? 'checking' 
      : isOnline && backendConnected 
        ? 'online' 
        : isOnline 
          ? 'backend_offline' 
          : 'offline'
  };
};

export default useOnlineStatus;
