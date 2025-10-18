// SmartSales365 IndexedDB Service
import Dexie from 'dexie';

// Configuración de la base de datos IndexedDB
class SmartSalesDB extends Dexie {
  constructor() {
    super('SmartSales365DB');
    
    this.version(1).stores({
      // Productos
      products: '++id, name, sku, price, stock, category_id, is_active, last_synced',
      
      // Clientes
      clients: '++id, name, email, phone, city, country, client_type, segment, is_active, last_synced',
      
      // Ventas
      sales: '++id, client_id, user_id, subtotal, tax, discount, total, status, payment_status, created_at, synced, sync_status',
      
      // Items del carrito
      cart_items: '++id, product_id, quantity, unit_price, subtotal, added_at',
      
      // Operaciones pendientes de sincronización
      pending_operations: '++id, operation_type, entity_type, data, timestamp, retry_count, last_error, priority',
      
      // Caché de reportes
      reports_cache: '++id, prompt, report_data, format, generated_at, expires_at',
      
      // Caché de predicciones ML
      ml_predictions_cache: '++id, predictions_data, cached_at, expires_at',
      
      // Categorías
      categories: '++id, name, description, parent_id, is_active, last_synced',
      
      // Items de venta
      sale_items: '++id, sale_id, product_id, quantity, price, subtotal',
      
      // Configuraciones del sistema
      settings: '++id, key, value, updated_at',
      
      // Logs de sincronización
      sync_logs: '++id, entity_type, operation, timestamp, status, details'
    });
  }
}

// Instancia de la base de datos
const db = new SmartSalesDB();

// Servicio principal de IndexedDB
class IndexedDBService {
  constructor() {
    this.db = db;
    this.isInitialized = false;
  }

  // Inicializar la base de datos
  async initialize() {
    try {
      await this.db.open();
      this.isInitialized = true;
      console.log('[IndexedDB] Base de datos inicializada correctamente');
      return true;
    } catch (error) {
      console.error('[IndexedDB] Error al inicializar:', error);
      return false;
    }
  }

  // ========== OPERACIONES DE PRODUCTOS ==========
  
  async getProducts(filters = {}) {
    try {
      let query = this.db.products.toCollection();
      
      if (filters.category_id) {
        query = query.filter(product => product.category_id === filters.category_id);
      }
      
      if (filters.is_active !== undefined) {
        query = query.filter(product => product.is_active === filters.is_active);
      }
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        query = query.filter(product => 
          product.name.toLowerCase().includes(searchTerm) ||
          product.sku.toLowerCase().includes(searchTerm)
        );
      }
      
      if (filters.low_stock) {
        query = query.filter(product => product.stock <= product.min_stock);
      }
      
      return await query.toArray();
    } catch (error) {
      console.error('[IndexedDB] Error obteniendo productos:', error);
      return [];
    }
  }

  async getProduct(id) {
    try {
      return await this.db.products.get(id);
    } catch (error) {
      console.error('[IndexedDB] Error obteniendo producto:', error);
      return null;
    }
  }

  async addProduct(product) {
    try {
      const productData = {
        ...product,
        last_synced: new Date().toISOString(),
        sync_status: 'pending'
      };
      return await this.db.products.add(productData);
    } catch (error) {
      console.error('[IndexedDB] Error agregando producto:', error);
      throw error;
    }
  }

  async updateProduct(id, updates) {
    try {
      const updatedData = {
        ...updates,
        last_synced: new Date().toISOString(),
        sync_status: 'pending'
      };
      return await this.db.products.update(id, updatedData);
    } catch (error) {
      console.error('[IndexedDB] Error actualizando producto:', error);
      throw error;
    }
  }

  async deleteProduct(id) {
    try {
      return await this.db.products.delete(id);
    } catch (error) {
      console.error('[IndexedDB] Error eliminando producto:', error);
      throw error;
    }
  }

  // ========== OPERACIONES DE CLIENTES ==========
  
  async getClients(filters = {}) {
    try {
      let query = this.db.clients.toCollection();
      
      if (filters.segment) {
        query = query.filter(client => client.segment === filters.segment);
      }
      
      if (filters.is_active !== undefined) {
        query = query.filter(client => client.is_active === filters.is_active);
      }
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        query = query.filter(client => 
          client.name.toLowerCase().includes(searchTerm) ||
          client.email.toLowerCase().includes(searchTerm) ||
          client.phone.includes(searchTerm)
        );
      }
      
      return await query.toArray();
    } catch (error) {
      console.error('[IndexedDB] Error obteniendo clientes:', error);
      return [];
    }
  }

  async getClient(id) {
    try {
      return await this.db.clients.get(id);
    } catch (error) {
      console.error('[IndexedDB] Error obteniendo cliente:', error);
      return null;
    }
  }

  async addClient(client) {
    try {
      const clientData = {
        ...client,
        last_synced: new Date().toISOString(),
        sync_status: 'pending'
      };
      return await this.db.clients.add(clientData);
    } catch (error) {
      console.error('[IndexedDB] Error agregando cliente:', error);
      throw error;
    }
  }

  async updateClient(id, updates) {
    try {
      const updatedData = {
        ...updates,
        last_synced: new Date().toISOString(),
        sync_status: 'pending'
      };
      return await this.db.clients.update(id, updatedData);
    } catch (error) {
      console.error('[IndexedDB] Error actualizando cliente:', error);
      throw error;
    }
  }

  // ========== OPERACIONES DE VENTAS ==========
  
  async getSales(filters = {}) {
    try {
      let query = this.db.sales.toCollection();
      
      if (filters.client_id) {
        query = query.filter(sale => sale.client_id === filters.client_id);
      }
      
      if (filters.status) {
        query = query.filter(sale => sale.status === filters.status);
      }
      
      if (filters.payment_status) {
        query = query.filter(sale => sale.payment_status === filters.payment_status);
      }
      
      if (filters.sync_status) {
        query = query.filter(sale => sale.sync_status === filters.sync_status);
      }
      
      if (filters.date_from) {
        query = query.filter(sale => new Date(sale.created_at) >= new Date(filters.date_from));
      }
      
      if (filters.date_to) {
        query = query.filter(sale => new Date(sale.created_at) <= new Date(filters.date_to));
      }
      
      return await query.orderBy('created_at').reverse().toArray();
    } catch (error) {
      console.error('[IndexedDB] Error obteniendo ventas:', error);
      return [];
    }
  }

  async getSale(id) {
    try {
      return await this.db.sales.get(id);
    } catch (error) {
      console.error('[IndexedDB] Error obteniendo venta:', error);
      return null;
    }
  }

  async addSale(sale) {
    try {
      const saleData = {
        ...sale,
        created_at: new Date().toISOString(),
        synced: false,
        sync_status: 'pending'
      };
      return await this.db.sales.add(saleData);
    } catch (error) {
      console.error('[IndexedDB] Error agregando venta:', error);
      throw error;
    }
  }

  async updateSale(id, updates) {
    try {
      const updatedData = {
        ...updates,
        last_synced: new Date().toISOString(),
        sync_status: 'pending'
      };
      return await this.db.sales.update(id, updatedData);
    } catch (error) {
      console.error('[IndexedDB] Error actualizando venta:', error);
      throw error;
    }
  }

  // ========== OPERACIONES DE CARRITO ==========
  
  async getCartItems() {
    try {
      return await this.db.cart_items.orderBy('added_at').toArray();
    } catch (error) {
      console.error('[IndexedDB] Error obteniendo items del carrito:', error);
      return [];
    }
  }

  async addCartItem(item) {
    try {
      const itemData = {
        ...item,
        added_at: new Date().toISOString()
      };
      return await this.db.cart_items.add(itemData);
    } catch (error) {
      console.error('[IndexedDB] Error agregando item al carrito:', error);
      throw error;
    }
  }

  async updateCartItem(id, updates) {
    try {
      return await this.db.cart_items.update(id, updates);
    } catch (error) {
      console.error('[IndexedDB] Error actualizando item del carrito:', error);
      throw error;
    }
  }

  async removeCartItem(id) {
    try {
      return await this.db.cart_items.delete(id);
    } catch (error) {
      console.error('[IndexedDB] Error eliminando item del carrito:', error);
      throw error;
    }
  }

  async clearCart() {
    try {
      return await this.db.cart_items.clear();
    } catch (error) {
      console.error('[IndexedDB] Error limpiando carrito:', error);
      throw error;
    }
  }

  // ========== OPERACIONES DE SINCRONIZACIÓN ==========
  
  async addPendingOperation(operation) {
    try {
      const operationData = {
        ...operation,
        timestamp: new Date().toISOString(),
        retry_count: 0,
        priority: operation.priority || 2 // 1=alta, 2=media, 3=baja
      };
      return await this.db.pending_operations.add(operationData);
    } catch (error) {
      console.error('[IndexedDB] Error agregando operación pendiente:', error);
      throw error;
    }
  }

  async getPendingOperations(entityType = null) {
    try {
      let query = this.db.pending_operations.toCollection();
      
      if (entityType) {
        query = query.filter(op => op.entity_type === entityType);
      }
      
      return await query.sortBy('timestamp').then(results => 
        results.sort((a, b) => {
          // Ordenar por priority primero, luego por timestamp
          if (a.priority !== b.priority) {
            return (a.priority || 0) - (b.priority || 0);
          }
          return new Date(a.timestamp) - new Date(b.timestamp);
        })
      );
    } catch (error) {
      console.error('[IndexedDB] Error obteniendo operaciones pendientes:', error);
      return [];
    }
  }

  async removePendingOperation(id) {
    try {
      return await this.db.pending_operations.delete(id);
    } catch (error) {
      console.error('[IndexedDB] Error eliminando operación pendiente:', error);
      throw error;
    }
  }

  async updatePendingOperation(id, updates) {
    try {
      return await this.db.pending_operations.update(id, updates);
    } catch (error) {
      console.error('[IndexedDB] Error actualizando operación pendiente:', error);
      throw error;
    }
  }

  // ========== OPERACIONES DE CACHÉ ==========
  
  async cacheReport(prompt, reportData, format = 'json') {
    try {
      const cacheData = {
        prompt,
        report_data: reportData,
        format,
        generated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hora
      };
      return await this.db.reports_cache.add(cacheData);
    } catch (error) {
      console.error('[IndexedDB] Error cacheando reporte:', error);
      throw error;
    }
  }

  async getCachedReport(prompt) {
    try {
      const cached = await this.db.reports_cache
        .where('prompt')
        .equals(prompt)
        .and(report => new Date(report.expires_at) > new Date())
        .first();
      
      return cached;
    } catch (error) {
      console.error('[IndexedDB] Error obteniendo reporte cacheado:', error);
      return null;
    }
  }

  async cacheMLPredictions(predictionsData) {
    try {
      const cacheData = {
        predictions_data: predictionsData,
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 86400000).toISOString() // 24 horas
      };
      return await this.db.ml_predictions_cache.add(cacheData);
    } catch (error) {
      console.error('[IndexedDB] Error cacheando predicciones ML:', error);
      throw error;
    }
  }

  async getCachedMLPredictions() {
    try {
      const cached = await this.db.ml_predictions_cache
        .where('expires_at')
        .above(new Date().toISOString())
        .orderBy('cached_at')
        .reverse()
        .first();
      
      return cached;
    } catch (error) {
      console.error('[IndexedDB] Error obteniendo predicciones ML cacheadas:', error);
      return null;
    }
  }

  // ========== OPERACIONES DE CONFIGURACIÓN ==========
  
  async getSetting(key) {
    try {
      const setting = await this.db.settings.get(key);
      return setting ? setting.value : null;
    } catch (error) {
      console.error('[IndexedDB] Error obteniendo configuración:', error);
      return null;
    }
  }

  async setSetting(key, value) {
    try {
      return await this.db.settings.put({
        id: key,
        key,
        value,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('[IndexedDB] Error guardando configuración:', error);
      throw error;
    }
  }

  // ========== OPERACIONES DE LOGS ==========
  
  async addSyncLog(entityType, operation, status, details = {}) {
    try {
      const logData = {
        entity_type: entityType,
        operation,
        timestamp: new Date().toISOString(),
        status,
        details
      };
      return await this.db.sync_logs.add(logData);
    } catch (error) {
      console.error('[IndexedDB] Error agregando log de sincronización:', error);
      throw error;
    }
  }

  async getSyncLogs(limit = 100) {
    try {
      return await this.db.sync_logs
        .orderBy('timestamp')
        .reverse()
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error('[IndexedDB] Error obteniendo logs de sincronización:', error);
      return [];
    }
  }

  // ========== UTILIDADES ==========
  
  async clearExpiredCache() {
    try {
      const now = new Date().toISOString();
      
      // Limpiar reportes expirados
      await this.db.reports_cache
        .where('expires_at')
        .below(now)
        .delete();
      
      // Limpiar predicciones ML expiradas
      await this.db.ml_predictions_cache
        .where('expires_at')
        .below(now)
        .delete();
      
      console.log('[IndexedDB] Caché expirado limpiado');
    } catch (error) {
      console.error('[IndexedDB] Error limpiando caché expirado:', error);
    }
  }

  async getStorageInfo() {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          quota: estimate.quota,
          usage: estimate.usage,
          available: estimate.quota - estimate.usage,
          percentage: (estimate.usage / estimate.quota) * 100
        };
      }
      return null;
    } catch (error) {
      console.error('[IndexedDB] Error obteniendo información de almacenamiento:', error);
      return null;
    }
  }

  async clearAllData() {
    try {
      await this.db.clear();
      console.log('[IndexedDB] Todos los datos eliminados');
    } catch (error) {
      console.error('[IndexedDB] Error eliminando todos los datos:', error);
      throw error;
    }
  }

  // Cerrar la base de datos
  async close() {
    try {
      await this.db.close();
      this.isInitialized = false;
      console.log('[IndexedDB] Base de datos cerrada');
    } catch (error) {
      console.error('[IndexedDB] Error cerrando base de datos:', error);
    }
  }
}

// Instancia singleton del servicio
const indexedDBService = new IndexedDBService();

export default indexedDBService;
