// Hook para gestionar sincronización offline
import { useState, useEffect, useCallback } from 'react';
import syncService from '../services/syncService';
import indexedDBService from '../services/indexedDBService';

const useOfflineSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncErrors, setSyncErrors] = useState([]);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0, entity: '' });

  // Cargar estado inicial
  useEffect(() => {
    loadSyncStatus();
  }, []);

  // Cargar estado de sincronización
  const loadSyncStatus = useCallback(async () => {
    try {
      const status = await syncService.getSyncStatus();
      setPendingCount(status.pendingCount);
      setLastSyncTime(status.lastSyncTime);
      setSyncErrors(status.syncErrors);
    } catch (error) {
      console.error('[useOfflineSync] Error cargando estado:', error);
    }
  }, []);

  // Sincronización manual
  const syncNow = useCallback(async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    setSyncProgress({ current: 0, total: 0, entity: '' });

    try {
      await syncService.syncNow();
      await loadSyncStatus();
    } catch (error) {
      console.error('[useOfflineSync] Error en sincronización:', error);
      setSyncErrors(prev => [...prev, {
        timestamp: new Date().toISOString(),
        message: error.message,
        type: 'sync_error'
      }]);
    } finally {
      setIsSyncing(false);
      setSyncProgress({ current: 0, total: 0, entity: '' });
    }
  }, [isSyncing, loadSyncStatus]);

  // Sincronizar entidad específica
  const syncEntity = useCallback(async (entityType) => {
    if (isSyncing) return;

    setIsSyncing(true);
    setSyncProgress({ current: 0, total: 1, entity: entityType });

    try {
      await syncService.forceSyncEntity(entityType);
      await loadSyncStatus();
    } catch (error) {
      console.error(`[useOfflineSync] Error sincronizando ${entityType}:`, error);
      setSyncErrors(prev => [...prev, {
        timestamp: new Date().toISOString(),
        message: `Error sincronizando ${entityType}: ${error.message}`,
        type: 'entity_sync_error',
        entity: entityType
      }]);
    } finally {
      setIsSyncing(false);
      setSyncProgress({ current: 0, total: 0, entity: '' });
    }
  }, [isSyncing, loadSyncStatus]);

  // Obtener operaciones pendientes
  const getPendingOperations = useCallback(async (entityType = null) => {
    try {
      return await syncService.getPendingOperations(entityType);
    } catch (error) {
      console.error('[useOfflineSync] Error obteniendo operaciones pendientes:', error);
      return [];
    }
  }, []);

  // Limpiar operaciones pendientes
  const clearPendingOperations = useCallback(async () => {
    try {
      await syncService.clearPendingOperations();
      await loadSyncStatus();
    } catch (error) {
      console.error('[useOfflineSync] Error limpiando operaciones pendientes:', error);
    }
  }, [loadSyncStatus]);

  // Reintentar operaciones fallidas
  const retryFailedOperations = useCallback(async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      await syncService.retryFailedOperations();
      await loadSyncStatus();
    } catch (error) {
      console.error('[useOfflineSync] Error reintentando operaciones:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, loadSyncStatus]);

  // Resolver conflicto
  const resolveConflict = useCallback(async (conflictId, resolution) => {
    try {
      await syncService.resolveConflict(conflictId, resolution);
      await loadSyncStatus();
    } catch (error) {
      console.error('[useOfflineSync] Error resolviendo conflicto:', error);
    }
  }, [loadSyncStatus]);

  // Limpiar errores de sincronización
  const clearSyncErrors = useCallback(() => {
    setSyncErrors([]);
  }, []);

  // Configurar listeners de sincronización
  useEffect(() => {
    const handleSyncStarted = () => {
      setIsSyncing(true);
    };

    const handleSyncCompleted = () => {
      setIsSyncing(false);
      loadSyncStatus();
    };

    const handleSyncError = (error) => {
      setIsSyncing(false);
      setSyncErrors(prev => [...prev, {
        timestamp: new Date().toISOString(),
        message: error.message,
        type: 'sync_error'
      }]);
    };

    const handleOnline = () => {
      // Iniciar sincronización automática cuando se restablece la conexión
      setTimeout(() => {
        if (!isSyncing && pendingCount > 0) {
          syncNow();
        }
      }, 2000);
    };

    // Agregar listeners
    syncService.addListener(handleSyncStarted);
    syncService.addListener(handleSyncCompleted);
    syncService.addListener(handleSyncError);
    syncService.addListener(handleOnline);

    // Cleanup
    return () => {
      // Los listeners se mantienen en el servicio singleton
    };
  }, [isSyncing, pendingCount, syncNow, loadSyncStatus]);

  // Actualizar estado periódicamente
  useEffect(() => {
    const interval = setInterval(() => {
      loadSyncStatus();
    }, 60000); // Cada 1 minuto

    return () => clearInterval(interval);
  }, [loadSyncStatus]);

  return {
    // Estado
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncErrors,
    syncProgress,
    
    // Acciones
    syncNow,
    syncEntity,
    getPendingOperations,
    clearPendingOperations,
    retryFailedOperations,
    resolveConflict,
    clearSyncErrors,
    loadSyncStatus,
    
    // Utilidades
    hasPendingOperations: pendingCount > 0,
    hasSyncErrors: syncErrors.length > 0,
    canSync: !isSyncing && pendingCount > 0
  };
};

export default useOfflineSync;
