// SmartSales365 Sync Service
import axios from 'axios';
import indexedDBService from './indexedDBService';

// Configuración base para sync service
const syncApi = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

class SyncService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.isSyncing = false;
    this.syncQueue = [];
    this.maxRetries = 5;
    this.retryDelay = 1000; // 1 segundo base
    this.listeners = [];
    
    this.setupEventListeners();
  }

  // Configurar listeners de eventos
  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners('online');
      this.startAutoSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners('offline');
    });
  }

  // Agregar listener para cambios de estado
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Notificar a los listeners
  notifyListeners(event, data = null) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('[SyncService] Error en listener:', error);
      }
    });
  }

  // Verificar si hay conexión real al backend
  async checkBackendConnection() {
    try {
      const response = await syncApi.get('/health/', {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // Iniciar sincronización automática
  async startAutoSync() {
    if (this.isSyncing || !this.isOnline) return;

    const hasBackendConnection = await this.checkBackendConnection();
    if (!hasBackendConnection) return;

    this.isSyncing = true;
    this.notifyListeners('sync_started');

    try {
      await this.syncAll();
      this.notifyListeners('sync_completed');
    } catch (error) {
      console.error('[SyncService] Error en sincronización automática:', error);
      this.notifyListeners('sync_error', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Sincronizar todas las entidades
  async syncAll() {
    console.log('[SyncService] Iniciando sincronización completa...');
    
    try {
      // Sincronizar en orden de prioridad
      await this.syncProducts();
      await this.syncClients();
      await this.syncSales();
      await this.syncCategories();
      
      console.log('[SyncService] Sincronización completa finalizada');
    } catch (error) {
      console.error('[SyncService] Error en sincronización completa:', error);
      throw error;
    }
  }

  // Sincronizar productos
  async syncProducts() {
    console.log('[SyncService] Sincronizando productos...');
    
    try {
      // Obtener productos del servidor
      const response = await axios.get('/api/products/');
      const serverProducts = response.data;

      // Guardar/actualizar productos en IndexedDB
      for (const product of serverProducts) {
        await indexedDBService.updateProduct(product.id, {
          ...product,
          sync_status: 'synced',
          last_synced: new Date().toISOString()
        });
      }

      // Sincronizar productos locales pendientes
      const pendingProducts = await indexedDBService.getPendingOperations('products');
      for (const operation of pendingProducts) {
        await this.syncPendingOperation(operation);
      }

      console.log('[SyncService] Productos sincronizados correctamente');
    } catch (error) {
      console.error('[SyncService] Error sincronizando productos:', error);
      throw error;
    }
  }

  // Sincronizar clientes
  async syncClients() {
    console.log('[SyncService] Sincronizando clientes...');
    
    try {
      // Obtener clientes del servidor
      const response = await axios.get('/api/clients/');
      const serverClients = response.data;

      // Guardar/actualizar clientes en IndexedDB
      for (const client of serverClients) {
        await indexedDBService.updateClient(client.id, {
          ...client,
          sync_status: 'synced',
          last_synced: new Date().toISOString()
        });
      }

      // Sincronizar clientes locales pendientes
      const pendingClients = await indexedDBService.getPendingOperations('clients');
      for (const operation of pendingClients) {
        await this.syncPendingOperation(operation);
      }

      console.log('[SyncService] Clientes sincronizados correctamente');
    } catch (error) {
      console.error('[SyncService] Error sincronizando clientes:', error);
      throw error;
    }
  }

  // Sincronizar ventas
  async syncSales() {
    console.log('[SyncService] Sincronizando ventas...');
    
    try {
      // Obtener ventas del servidor
      const response = await axios.get('/api/sales/');
      const serverSales = response.data;

      // Guardar/actualizar ventas en IndexedDB
      for (const sale of serverSales) {
        await indexedDBService.updateSale(sale.id, {
          ...sale,
          sync_status: 'synced',
          last_synced: new Date().toISOString()
        });
      }

      // Sincronizar ventas locales pendientes
      const pendingSales = await indexedDBService.getPendingOperations('sales');
      for (const operation of pendingSales) {
        await this.syncPendingOperation(operation);
      }

      console.log('[SyncService] Ventas sincronizadas correctamente');
    } catch (error) {
      console.error('[SyncService] Error sincronizando ventas:', error);
      throw error;
    }
  }

  // Sincronizar categorías
  async syncCategories() {
    console.log('[SyncService] Sincronizando categorías...');
    
    try {
      // Obtener categorías del servidor
      const response = await axios.get('/api/products/categories/');
      const serverCategories = response.data;

      // Guardar/actualizar categorías en IndexedDB
      for (const category of serverCategories) {
        await indexedDBService.db.categories.put({
          ...category,
          sync_status: 'synced',
          last_synced: new Date().toISOString()
        });
      }

      console.log('[SyncService] Categorías sincronizadas correctamente');
    } catch (error) {
      console.error('[SyncService] Error sincronizando categorías:', error);
      throw error;
    }
  }

  // Sincronizar operación pendiente individual
  async syncPendingOperation(operation) {
    try {
      console.log(`[SyncService] Sincronizando operación: ${operation.operation_type} ${operation.entity_type}`);
      
      let response;
      const data = operation.data;

      switch (operation.operation_type) {
        case 'CREATE':
          response = await this.createEntity(operation.entity_type, data);
          break;
        case 'UPDATE':
          response = await this.updateEntity(operation.entity_type, data.id, data);
          break;
        case 'DELETE':
          response = await this.deleteEntity(operation.entity_type, data.id);
          break;
        default:
          throw new Error(`Tipo de operación no soportado: ${operation.operation_type}`);
      }

      // Marcar operación como sincronizada
      await indexedDBService.removePendingOperation(operation.id);
      
      // Actualizar entidad local con datos del servidor
      await this.updateLocalEntity(operation.entity_type, response.data);

      console.log(`[SyncService] Operación sincronizada: ${operation.id}`);
    } catch (error) {
      console.error(`[SyncService] Error sincronizando operación ${operation.id}:`, error);
      
      // Incrementar contador de reintentos
      const retryCount = operation.retry_count + 1;
      
      if (retryCount >= this.maxRetries) {
        // Marcar como error permanente
        await indexedDBService.updatePendingOperation(operation.id, {
          retry_count: retryCount,
          last_error: error.message,
          sync_status: 'error'
        });
      } else {
        // Programar reintento
        await indexedDBService.updatePendingOperation(operation.id, {
          retry_count: retryCount,
          last_error: error.message
        });
        
        // Reintentar después del delay
        setTimeout(() => {
          this.syncPendingOperation(operation);
        }, this.retryDelay * Math.pow(2, retryCount - 1));
      }
    }
  }

  // Crear entidad en el servidor
  async createEntity(entityType, data) {
    const endpoints = {
      products: '/api/products/',
      clients: '/api/clients/',
      sales: '/api/sales/'
    };

    const endpoint = endpoints[entityType];
    if (!endpoint) {
      throw new Error(`Endpoint no encontrado para ${entityType}`);
    }

    return await axios.post(endpoint, data);
  }

  // Actualizar entidad en el servidor
  async updateEntity(entityType, id, data) {
    const endpoints = {
      products: '/api/products/',
      clients: '/api/clients/',
      sales: '/api/sales/'
    };

    const endpoint = endpoints[entityType];
    if (!endpoint) {
      throw new Error(`Endpoint no encontrado para ${entityType}`);
    }

    return await axios.put(`${endpoint}${id}/`, data);
  }

  // Eliminar entidad en el servidor
  async deleteEntity(entityType, id) {
    const endpoints = {
      products: '/api/products/',
      clients: '/api/clients/',
      sales: '/api/sales/'
    };

    const endpoint = endpoints[entityType];
    if (!endpoint) {
      throw new Error(`Endpoint no encontrado para ${entityType}`);
    }

    return await axios.delete(`${endpoint}${id}/`);
  }

  // Actualizar entidad local con datos del servidor
  async updateLocalEntity(entityType, serverData) {
    switch (entityType) {
      case 'products':
        await indexedDBService.updateProduct(serverData.id, {
          ...serverData,
          sync_status: 'synced',
          last_synced: new Date().toISOString()
        });
        break;
      case 'clients':
        await indexedDBService.updateClient(serverData.id, {
          ...serverData,
          sync_status: 'synced',
          last_synced: new Date().toISOString()
        });
        break;
      case 'sales':
        await indexedDBService.updateSale(serverData.id, {
          ...serverData,
          sync_status: 'synced',
          last_synced: new Date().toISOString()
        });
        break;
    }
  }

  // Sincronización manual
  async syncNow() {
    if (this.isSyncing) {
      console.log('[SyncService] Sincronización ya en progreso');
      return;
    }

    if (!this.isOnline) {
      throw new Error('No hay conexión a internet');
    }

    const hasBackendConnection = await this.checkBackendConnection();
    if (!hasBackendConnection) {
      throw new Error('No hay conexión al servidor');
    }

    this.isSyncing = true;
    this.notifyListeners('sync_started');

    try {
      await this.syncAll();
      this.notifyListeners('sync_completed');
    } catch (error) {
      console.error('[SyncService] Error en sincronización manual:', error);
      this.notifyListeners('sync_error', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  // Obtener estado de sincronización
  async getSyncStatus() {
    try {
      const pendingOperations = await indexedDBService.getPendingOperations();
      const syncLogs = await indexedDBService.getSyncLogs(10);
      
      return {
        isOnline: this.isOnline,
        isSyncing: this.isSyncing,
        pendingCount: pendingOperations.length,
        lastSyncTime: syncLogs.length > 0 ? syncLogs[0].timestamp : null,
        syncErrors: syncLogs.filter(log => log.status === 'error').length
      };
    } catch (error) {
      console.error('[SyncService] Error obteniendo estado de sincronización:', error);
      return {
        isOnline: false,
        isSyncing: false,
        pendingCount: 0,
        lastSyncTime: null,
        syncErrors: 0
      };
    }
  }

  // Obtener operaciones pendientes
  async getPendingOperations(entityType = null) {
    return await indexedDBService.getPendingOperations(entityType);
  }

  // Limpiar operaciones pendientes
  async clearPendingOperations() {
    try {
      const pendingOps = await indexedDBService.getPendingOperations();
      for (const op of pendingOps) {
        await indexedDBService.removePendingOperation(op.id);
      }
      console.log('[SyncService] Operaciones pendientes limpiadas');
    } catch (error) {
      console.error('[SyncService] Error limpiando operaciones pendientes:', error);
      throw error;
    }
  }

  // Resolver conflictos
  async resolveConflict(conflictId, resolution) {
    try {
      // Implementar lógica de resolución de conflictos
      console.log(`[SyncService] Resolviendo conflicto ${conflictId} con resolución: ${resolution}`);
      
      // Aquí se implementaría la lógica específica de resolución
      // según el tipo de conflicto y la resolución elegida
      
    } catch (error) {
      console.error('[SyncService] Error resolviendo conflicto:', error);
      throw error;
    }
  }

  // Forzar sincronización de entidad específica
  async forceSyncEntity(entityType) {
    if (!this.isOnline) {
      throw new Error('No hay conexión a internet');
    }

    this.isSyncing = true;
    this.notifyListeners('sync_started');

    try {
      switch (entityType) {
        case 'products':
          await this.syncProducts();
          break;
        case 'clients':
          await this.syncClients();
          break;
        case 'sales':
          await this.syncSales();
          break;
        default:
          throw new Error(`Tipo de entidad no soportado: ${entityType}`);
      }
      
      this.notifyListeners('sync_completed');
    } catch (error) {
      console.error(`[SyncService] Error sincronizando ${entityType}:`, error);
      this.notifyListeners('sync_error', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  // Reintentar operaciones fallidas
  async retryFailedOperations() {
    try {
      const failedOps = await indexedDBService.getPendingOperations();
      const errorOps = failedOps.filter(op => op.sync_status === 'error');
      
      for (const op of errorOps) {
        await indexedDBService.updatePendingOperation(op.id, {
          sync_status: 'pending',
          retry_count: 0,
          last_error: null
        });
      }
      
      if (errorOps.length > 0) {
        await this.startAutoSync();
      }
      
      console.log(`[SyncService] ${errorOps.length} operaciones fallidas marcadas para reintento`);
    } catch (error) {
      console.error('[SyncService] Error reintentando operaciones fallidas:', error);
      throw error;
    }
  }
}

// Instancia singleton del servicio
const syncService = new SyncService();

export default syncService;
