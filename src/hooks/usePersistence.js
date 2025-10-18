import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import indexedDBService from '../services/indexedDBService';

export const usePersistence = () => {
  const { isAuthenticated, user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializePersistence = async () => {
      try {
        console.log('[Persistence] Inicializando persistencia de datos...');
        
        // Inicializar IndexedDB
        const dbInitialized = await indexedDBService.initialize();
        if (!dbInitialized) {
          throw new Error('Error inicializando base de datos local');
        }

        // Si el usuario está autenticado, sincronizar datos
        if (isAuthenticated && user) {
          console.log('[Persistence] Usuario autenticado, sincronizando datos...');
          await syncUserData();
        }

        console.log('[Persistence] Persistencia inicializada correctamente');
        setIsInitialized(true);
      } catch (error) {
        console.error('[Persistence] Error inicializando persistencia:', error);
        setError(error.message);
        setIsInitialized(true); // Permitir que la app funcione aunque haya errores
      }
    };

    initializePersistence();
  }, [isAuthenticated, user]);

  const syncUserData = async () => {
    try {
      // Guardar información del usuario en IndexedDB
      await indexedDBService.setItem('user', user);
      
      // Sincronizar datos pendientes si hay conexión
      const pendingData = await indexedDBService.getPendingData();
      if (pendingData && pendingData.length > 0) {
        console.log(`[Persistence] ${pendingData.length} elementos pendientes de sincronización`);
        // Aquí se implementaría la lógica de sincronización
      }
    } catch (error) {
      console.error('[Persistence] Error sincronizando datos del usuario:', error);
    }
  };

  const saveData = async (key, data) => {
    try {
      await indexedDBService.setItem(key, data);
      return { success: true };
    } catch (error) {
      console.error('[Persistence] Error guardando datos:', error);
      return { success: false, error: error.message };
    }
  };

  const getData = async (key) => {
    try {
      const data = await indexedDBService.getItem(key);
      return { success: true, data };
    } catch (error) {
      console.error('[Persistence] Error obteniendo datos:', error);
      return { success: false, error: error.message };
    }
  };

  const clearData = async () => {
    try {
      await indexedDBService.clear();
      return { success: true };
    } catch (error) {
      console.error('[Persistence] Error limpiando datos:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    isInitialized,
    error,
    saveData,
    getData,
    clearData,
    syncUserData
  };
};

export default usePersistence;
