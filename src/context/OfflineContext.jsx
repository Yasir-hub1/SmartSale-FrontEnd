// Contexto para manejo del estado offline
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import useOnlineStatus from '../hooks/useOnlineStatus';
import useOfflineSync from '../hooks/useOfflineSync';
import indexedDBService from '../services/indexedDBService';

// Estado inicial
const initialState = {
  isOnline: false,
  isInitializing: true,
  backendConnected: false,
  offlineMode: false,
  pendingOperations: [],
  lastSyncTime: null,
  syncErrors: [],
  isSyncing: false,
  syncProgress: { current: 0, total: 0, entity: '' },
  storageInfo: null,
  conflicts: []
};

// Tipos de acciones
const OFFLINE_ACTIONS = {
  SET_ONLINE_STATUS: 'SET_ONLINE_STATUS',
  SET_OFFLINE_MODE: 'SET_OFFLINE_MODE',
  SET_PENDING_OPERATIONS: 'SET_PENDING_OPERATIONS',
  SET_SYNC_STATUS: 'SET_SYNC_STATUS',
  SET_SYNC_PROGRESS: 'SET_SYNC_PROGRESS',
  SET_SYNC_ERRORS: 'SET_SYNC_ERRORS',
  SET_STORAGE_INFO: 'SET_STORAGE_INFO',
  SET_CONFLICTS: 'SET_CONFLICTS',
  ADD_PENDING_OPERATION: 'ADD_PENDING_OPERATION',
  REMOVE_PENDING_OPERATION: 'REMOVE_PENDING_OPERATION',
  CLEAR_SYNC_ERRORS: 'CLEAR_SYNC_ERRORS',
  SET_LAST_SYNC_TIME: 'SET_LAST_SYNC_TIME'
};

// Reducer
const offlineReducer = (state, action) => {
  switch (action.type) {
    case OFFLINE_ACTIONS.SET_ONLINE_STATUS:
      return {
        ...state,
        isOnline: action.payload.isOnline,
        isInitializing: action.payload.isInitializing,
        backendConnected: action.payload.backendConnected
      };

    case OFFLINE_ACTIONS.SET_OFFLINE_MODE:
      return {
        ...state,
        offlineMode: action.payload
      };

    case OFFLINE_ACTIONS.SET_PENDING_OPERATIONS:
      return {
        ...state,
        pendingOperations: action.payload
      };

    case OFFLINE_ACTIONS.SET_SYNC_STATUS:
      return {
        ...state,
        isSyncing: action.payload.isSyncing,
        lastSyncTime: action.payload.lastSyncTime
      };

    case OFFLINE_ACTIONS.SET_SYNC_PROGRESS:
      return {
        ...state,
        syncProgress: action.payload
      };

    case OFFLINE_ACTIONS.SET_SYNC_ERRORS:
      return {
        ...state,
        syncErrors: action.payload
      };

    case OFFLINE_ACTIONS.SET_STORAGE_INFO:
      return {
        ...state,
        storageInfo: action.payload
      };

    case OFFLINE_ACTIONS.SET_CONFLICTS:
      return {
        ...state,
        conflicts: action.payload
      };

    case OFFLINE_ACTIONS.ADD_PENDING_OPERATION:
      return {
        ...state,
        pendingOperations: [...state.pendingOperations, action.payload]
      };

    case OFFLINE_ACTIONS.REMOVE_PENDING_OPERATION:
      return {
        ...state,
        pendingOperations: state.pendingOperations.filter(op => op.id !== action.payload)
      };

    case OFFLINE_ACTIONS.CLEAR_SYNC_ERRORS:
      return {
        ...state,
        syncErrors: []
      };

    case OFFLINE_ACTIONS.SET_LAST_SYNC_TIME:
      return {
        ...state,
        lastSyncTime: action.payload
      };

    default:
      return state;
  }
};

// Crear contexto
const OfflineContext = createContext();

// Provider
export const OfflineProvider = ({ children }) => {
  const [state, dispatch] = useReducer(offlineReducer, initialState);
  
  // Hooks personalizados
  const onlineStatus = useOnlineStatus();
  const syncStatus = useOfflineSync();

  // Efectos para sincronizar estado - optimizados para evitar re-renders
  useEffect(() => {
    const currentState = {
      isOnline: onlineStatus.isOnline,
      isInitializing: onlineStatus.isInitializing,
      backendConnected: onlineStatus.backendConnected
    };
    
    // Solo actualizar si realmente cambió
    if (state.isOnline !== currentState.isOnline || 
        state.isInitializing !== currentState.isInitializing || 
        state.backendConnected !== currentState.backendConnected) {
      dispatch({
        type: OFFLINE_ACTIONS.SET_ONLINE_STATUS,
        payload: currentState
      });
    }
  }, [onlineStatus.isOnline, onlineStatus.isInitializing, onlineStatus.backendConnected, state.isOnline, state.isInitializing, state.backendConnected]);

  useEffect(() => {
    const currentSyncState = {
      isSyncing: syncStatus.isSyncing,
      lastSyncTime: syncStatus.lastSyncTime
    };
    
    // Solo actualizar si realmente cambió
    if (state.isSyncing !== currentSyncState.isSyncing || 
        state.lastSyncTime !== currentSyncState.lastSyncTime) {
      dispatch({
        type: OFFLINE_ACTIONS.SET_SYNC_STATUS,
        payload: currentSyncState
      });
    }
  }, [syncStatus.isSyncing, syncStatus.lastSyncTime, state.isSyncing, state.lastSyncTime]);

  useEffect(() => {
    dispatch({
      type: OFFLINE_ACTIONS.SET_SYNC_ERRORS,
      payload: syncStatus.syncErrors
    });
  }, [syncStatus.syncErrors]);

  // Cargar operaciones pendientes
  useEffect(() => {
    const loadPendingOperations = async () => {
      try {
        const operations = await indexedDBService.getPendingOperations();
        dispatch({
          type: OFFLINE_ACTIONS.SET_PENDING_OPERATIONS,
          payload: operations
        });
      } catch (error) {
        console.error('[OfflineContext] Error cargando operaciones pendientes:', error);
      }
    };

    loadPendingOperations();
  }, []);

  // Cargar información de almacenamiento
  useEffect(() => {
    const loadStorageInfo = async () => {
      try {
        const info = await indexedDBService.getStorageInfo();
        dispatch({
          type: OFFLINE_ACTIONS.SET_STORAGE_INFO,
          payload: info
        });
      } catch (error) {
        console.error('[OfflineContext] Error cargando información de almacenamiento:', error);
      }
    };

    loadStorageInfo();
  }, []);

  // Acciones del contexto
  const actions = {
    // Habilitar/deshabilitar modo offline
    enableOfflineMode: () => {
      dispatch({
        type: OFFLINE_ACTIONS.SET_OFFLINE_MODE,
        payload: true
      });
    },

    disableOfflineMode: () => {
      dispatch({
        type: OFFLINE_ACTIONS.SET_OFFLINE_MODE,
        payload: false
      });
    },

    // Agregar operación pendiente
    addPendingOperation: async (operation) => {
      try {
        const id = await indexedDBService.addPendingOperation(operation);
        const newOperation = { ...operation, id };
        
        dispatch({
          type: OFFLINE_ACTIONS.ADD_PENDING_OPERATION,
          payload: newOperation
        });
        
        return id;
      } catch (error) {
        console.error('[OfflineContext] Error agregando operación pendiente:', error);
        throw error;
      }
    },

    // Remover operación pendiente
    removePendingOperation: async (operationId) => {
      try {
        await indexedDBService.removePendingOperation(operationId);
        dispatch({
          type: OFFLINE_ACTIONS.REMOVE_PENDING_OPERATION,
          payload: operationId
        });
      } catch (error) {
        console.error('[OfflineContext] Error removiendo operación pendiente:', error);
        throw error;
      }
    },

    // Limpiar errores de sincronización
    clearSyncErrors: () => {
      dispatch({
        type: OFFLINE_ACTIONS.CLEAR_SYNC_ERRORS
      });
    },

    // Sincronizar ahora
    syncNow: async () => {
      try {
        await syncStatus.syncNow();
      } catch (error) {
        console.error('[OfflineContext] Error en sincronización:', error);
        throw error;
      }
    },

    // Sincronizar entidad específica
    syncEntity: async (entityType) => {
      try {
        await syncStatus.syncEntity(entityType);
      } catch (error) {
        console.error('[OfflineContext] Error sincronizando entidad:', error);
        throw error;
      }
    },

    // Obtener operaciones pendientes
    getPendingOperations: async (entityType = null) => {
      try {
        const operations = await indexedDBService.getPendingOperations(entityType);
        dispatch({
          type: OFFLINE_ACTIONS.SET_PENDING_OPERATIONS,
          payload: operations
        });
        return operations;
      } catch (error) {
        console.error('[OfflineContext] Error obteniendo operaciones pendientes:', error);
        return [];
      }
    },

    // Limpiar operaciones pendientes
    clearPendingOperations: async () => {
      try {
        await syncStatus.clearPendingOperations();
        dispatch({
          type: OFFLINE_ACTIONS.SET_PENDING_OPERATIONS,
          payload: []
        });
      } catch (error) {
        console.error('[OfflineContext] Error limpiando operaciones pendientes:', error);
        throw error;
      }
    },

    // Reintentar operaciones fallidas
    retryFailedOperations: async () => {
      try {
        await syncStatus.retryFailedOperations();
      } catch (error) {
        console.error('[OfflineContext] Error reintentando operaciones:', error);
        throw error;
      }
    },

    // Resolver conflicto
    resolveConflict: async (conflictId, resolution) => {
      try {
        await syncStatus.resolveConflict(conflictId, resolution);
      } catch (error) {
        console.error('[OfflineContext] Error resolviendo conflicto:', error);
        throw error;
      }
    },

    // Actualizar información de almacenamiento
    updateStorageInfo: async () => {
      try {
        const info = await indexedDBService.getStorageInfo();
        dispatch({
          type: OFFLINE_ACTIONS.SET_STORAGE_INFO,
          payload: info
        });
        return info;
      } catch (error) {
        console.error('[OfflineContext] Error actualizando información de almacenamiento:', error);
        return null;
      }
    },

    // Limpiar caché expirado
    clearExpiredCache: async () => {
      try {
        await indexedDBService.clearExpiredCache();
        await actions.updateStorageInfo();
      } catch (error) {
        console.error('[OfflineContext] Error limpiando caché expirado:', error);
        throw error;
      }
    },

    // Obtener estado de sincronización
    getSyncStatus: () => {
      return {
        isOnline: state.isOnline,
        backendConnected: state.backendConnected,
        isSyncing: state.isSyncing,
        pendingCount: state.pendingOperations.length,
        lastSyncTime: state.lastSyncTime,
        syncErrors: state.syncErrors.length,
        hasConflicts: state.conflicts.length > 0
      };
    }
  };

  // Valores computados
  const computed = {
    // Estado de conexión
    connectionStatus: onlineStatus.connectionStatus,
    isFullyOnline: state.isOnline && state.backendConnected,
    
    // Estado de sincronización
    hasPendingOperations: state.pendingOperations.length > 0,
    hasSyncErrors: state.syncErrors.length > 0,
    hasConflicts: state.conflicts.length > 0,
    canSync: !state.isSyncing && state.pendingOperations.length > 0 && state.isOnline,
    
    // Estado de almacenamiento
    storageUsage: state.storageInfo ? (state.storageInfo.usage / state.storageInfo.quota) * 100 : 0,
    isStorageFull: state.storageInfo ? state.storageInfo.usage / state.storageInfo.quota > 0.9 : false,
    
    // Modo offline
    isOfflineMode: state.offlineMode || (!state.isOnline && !state.isInitializing),
    
    // Progreso de sincronización
    syncProgressPercentage: state.syncProgress.total > 0 
      ? (state.syncProgress.current / state.syncProgress.total) * 100 
      : 0
  };

  const value = {
    // Estado
    ...state,
    ...computed,
    
    // Acciones
    ...actions,
    
    // Hooks originales (para acceso directo si es necesario)
    onlineStatus,
    syncStatus
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

// Hook para usar el contexto
export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline debe ser usado dentro de OfflineProvider');
  }
  return context;
};

export default OfflineContext;
