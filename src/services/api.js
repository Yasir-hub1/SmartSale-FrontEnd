// SmartSales365 API Service
import axios from 'axios';

// Configuración base de axios
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para requests
api.interceptors.request.use(
  (config) => {
    // Agregar token de autenticación si existe
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Agregar timestamp para evitar caché
    config.params = {
      ...config.params,
      _t: Date.now()
    };
    
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Error en request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para responses
api.interceptors.response.use(
  (response) => {
    console.log(`[API] ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    console.error('[API] Error en response:', error);
    
    // Manejar errores específicos
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Token expirado o inválido
          const originalRequest = error.config;
          
          // Si es la primera vez que falla y no es un refresh
          if (!originalRequest._retry && !originalRequest.url.includes('/auth/refresh/')) {
            originalRequest._retry = true;
            
            try {
              // Intentar refrescar el token
              const refreshToken = localStorage.getItem('refresh_token');
              if (refreshToken) {
                const response = await api.post('/auth/refresh/', {
                  refresh: refreshToken
                });
                
                const { access } = response.data;
                localStorage.setItem('access_token', access);
                
                // Reintentar la petición original
                originalRequest.headers.Authorization = `Bearer ${access}`;
                return api(originalRequest);
              }
            } catch (refreshError) {
              console.error('[API] Error refrescando token:', refreshError);
            }
          }
          
          // Si el refresh falla o no hay refresh token, limpiar todo
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          
          // Solo redirigir si no estamos ya en login
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;
        case 403:
          console.error('[API] Acceso denegado');
          break;
        case 404:
          console.error('[API] Recurso no encontrado');
          break;
        case 500:
          console.error('[API] Error interno del servidor');
          break;
        default:
          console.error(`[API] Error ${status}:`, data);
      }
    } else if (error.request) {
      // Error de red
      console.error('[API] Error de red:', error.message);
    } else {
      console.error('[API] Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// ========== SERVICIOS DE AUTENTICACIÓN ==========

export const authService = {
  async login(credentials) {
    try {
      const response = await api.post('/auth/login/', credentials);
      const { access, refresh, user } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { access, refresh, user };
    } catch (error) {
      throw new Error('Error al iniciar sesión');
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout/');
    } catch (error) {
      console.error('[API] Error al cerrar sesión:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  async refreshToken() {
    try {
      const response = await api.post('/auth/refresh/');
      const { access } = response.data;
      
      localStorage.setItem('access_token', access);
      return access;
    } catch (error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      throw error;
    }
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  },

  async verifyToken() {
    try {
      const response = await api.post('/auth/verify/', {
        token: localStorage.getItem('access_token')
      });
      return response.data;
    } catch (error) {
      throw new Error('Token inválido');
    }
  }
};

// ========== SERVICIOS DE PRODUCTOS ==========

export const productsService = {
  async getProducts(params = {}) {
    try {
      const response = await api.get('/products/', { params });
      return response.data;
    } catch (error) {
      throw new Error('Error obteniendo productos');
    }
  },

  async getProduct(id) {
    try {
      const response = await api.get(`/products/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error('Error obteniendo producto');
    }
  },

  async createProduct(productData) {
    try {
      const response = await api.post('/products/', productData);
      return response.data;
    } catch (error) {
      // Re-lanzar el error original para preservar la información del backend
      throw error;
    }
  },

  async updateProduct(id, productData) {
    try {
      const response = await api.put(`/products/${id}/`, productData);
      return response.data;
    } catch (error) {
      // Re-lanzar el error original para preservar la información del backend
      throw error;
    }
  },

  async deleteProduct(id) {
    try {
      await api.delete(`/products/${id}/`);
      return true;
    } catch (error) {
      // Re-lanzar el error original para preservar la información del backend
      throw error;
    }
  },

  async getCategories() {
    try {
      const response = await api.get('/products/categories/');
      return response.data;
    } catch (error) {
      throw new Error('Error obteniendo categorías');
    }
  },

  async createCategory(categoryData) {
    try {
      const response = await api.post('/products/categories/', categoryData);
      return response.data;
    } catch (error) {
      throw new Error('Error creando categoría');
    }
  },

  async updateCategory(id, categoryData) {
    try {
      const response = await api.put(`/products/categories/${id}/`, categoryData);
      return response.data;
    } catch (error) {
      throw new Error('Error actualizando categoría');
    }
  },

  async deleteCategory(id) {
    try {
      await api.delete(`/products/categories/${id}/`);
      return true;
    } catch (error) {
      throw new Error('Error eliminando categoría');
    }
  }
};

// ========== SERVICIOS DE CLIENTES ==========

export const clientsService = {
  async getClients(params = {}) {
    try {
      const response = await api.get('/clients/', { params });
      return response.data;
    } catch (error) {
      throw new Error('Error obteniendo clientes');
    }
  },

  async getClient(id) {
    try {
      const response = await api.get(`/clients/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error('Error obteniendo cliente');
    }
  },

  async createClient(clientData) {
    try {
      const response = await api.post('/clients/', clientData);
      return response.data;
    } catch (error) {
      // Re-lanzar el error original para preservar la información del backend
      throw error;
    }
  },

  async updateClient(id, clientData) {
    try {
      const response = await api.put(`/clients/${id}/`, clientData);
      return response.data;
    } catch (error) {
      // Re-lanzar el error original para preservar la información del backend
      throw error;
    }
  },

  async deleteClient(id) {
    try {
      await api.delete(`/clients/${id}/`);
      return true;
    } catch (error) {
      // Re-lanzar el error original para preservar la información del backend
      throw error;
    }
  },

  async getClientSales(id, params = {}) {
    try {
      const response = await api.get(`/clients/${id}/sales/`, { params });
      return response.data;
    } catch (error) {
      throw new Error('Error obteniendo ventas del cliente');
    }
  }
};

// ========== SERVICIOS DE VENTAS ==========

export const salesService = {
  async getSales(params = {}) {
    try {
      const response = await api.get('/sales/sales/', { params });
      return response.data;
    } catch (error) {
      throw new Error('Error obteniendo ventas');
    }
  },

  async getSale(id) {
    try {
      const response = await api.get(`/sales/sales/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error('Error obteniendo venta');
    }
  },

  async createSale(saleData) {
    try {
      const response = await api.post('/sales/sales/', saleData);
      return response.data;
    } catch (error) {
      // Preservar el error original del backend para mejor debugging
      if (error.response && error.response.data) {
        const errorMessage = error.response.data.error || 
                           error.response.data.message || 
                           (typeof error.response.data === 'string' ? error.response.data : 'Error creando venta');
        throw new Error(errorMessage);
      }
      throw new Error('Error creando venta');
    }
  },

  async updateSale(id, saleData) {
    try {
      const response = await api.put(`/sales/sales/${id}/`, saleData);
      return response.data;
    } catch (error) {
      throw new Error('Error actualizando venta');
    }
  },

  async deleteSale(id) {
    try {
      await api.delete(`/sales/sales/${id}/`);
      return true;
    } catch (error) {
      throw new Error('Error eliminando venta');
    }
  },

  async getSaleReceipt(id) {
    try {
      const response = await api.get(`/sales/sales/${id}/receipt/`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error('Error obteniendo comprobante');
    }
  },

  async generateReceipt(saleId) {
    try {
      const response = await api.post(`/sales/sales/${saleId}/generate-receipt/`);
      return response.data;
    } catch (error) {
      throw new Error('Error generando comprobante');
    }
  },

  async getPublicSales(params = {}) {
    try {
      const response = await api.get('/sales/public-sales/', { params });
      return response.data;
    } catch (error) {
      throw new Error('Error obteniendo ventas públicas');
    }
  },

  async getSalesSummary() {
    try {
      const response = await api.get('/sales/sales-summary/');
      return response.data;
    } catch (error) {
      throw new Error('Error obteniendo resumen de ventas');
    }
  }
};

// ========== SERVICIOS DE REPORTES ==========

export const reportsService = {
  async generateReport(prompt, format = 'json') {
    try {
      const response = await api.post('/reports/generate/', {
        prompt,
        format
      });
      return response.data;
    } catch (error) {
      throw new Error('Error generando reporte');
    }
  },

  async getReportHistory(params = {}) {
    try {
      const response = await api.get('/reports/history/', { params });
      return response.data;
    } catch (error) {
      throw new Error('Error obteniendo historial de reportes');
    }
  },

  async downloadReport(reportId, format = 'pdf') {
    try {
      const response = await api.get(`/reports/${reportId}/download/`, {
        params: { format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error('Error descargando reporte');
    }
  }
};

// ========== SERVICIOS DE ML/PREDICCIONES ==========

export const mlService = {
  async getPredictions(params = {}) {
    try {
      const response = await api.get('/ml/', { params });
      return response.data;
    } catch (error) {
      throw new Error('Error obteniendo predicciones');
    }
  },

  async generatePrediction(inputData) {
    try {
      const response = await api.post('/ml/predictions/forecast_sales/', inputData);
      return response.data;
    } catch (error) {
      throw new Error('Error generando predicción');
    }
  },

  async getModelInfo() {
    try {
      const response = await api.get('/ml/models/');
      return response.data;
    } catch (error) {
      throw new Error('Error obteniendo información del modelo');
    }
  },

  async trainSalesForecast(useSynthetic = true) {
    try {
      const response = await api.post('/ml/models/train_sales_forecast/', {
        use_synthetic: useSynthetic
      });
      return response.data;
    } catch (error) {
      throw new Error('Error entrenando modelo de pronóstico');
    }
  },

  async getHistoricalData(params = {}) {
    try {
      const response = await api.get('/ml/predictions/historical_data/', { params });
      return response.data;
    } catch (error) {
      throw new Error('Error obteniendo datos históricos');
    }
  },

  async getProductAnalysis(params = {}) {
    try {
      const response = await api.get('/ml/predictions/product_analysis/', { params });
      return response.data;
    } catch (error) {
      throw new Error('Error obteniendo análisis de productos');
    }
  },

  async getClientAnalysis(params = {}) {
    try {
      const response = await api.get('/ml/predictions/client_analysis/', { params });
      return response.data;
    } catch (error) {
      throw new Error('Error obteniendo análisis de clientes');
    }
  },

  async retrainModel(modelId) {
    try {
      const response = await api.post(`/ml/models/${modelId}/retrain/`);
      return response.data;
    } catch (error) {
      throw new Error('Error reentrenando modelo');
    }
  }
};

// ========== SERVICIOS DE PAGOS ==========

export const paymentService = {
  async createPaymentIntent(amount, currency = 'MXN') {
    try {
      const response = await api.post('/api/payments/create-intent/', {
        amount,
        currency
      });
      return response.data;
    } catch (error) {
      throw new Error('Error creando intención de pago');
    }
  },

  async confirmPayment(paymentIntentId) {
    try {
      const response = await api.post('/api/payments/confirm/', {
        payment_intent_id: paymentIntentId
      });
      return response.data;
    } catch (error) {
      throw new Error('Error confirmando pago');
    }
  },

  async getPaymentMethods() {
    try {
      const response = await api.get('/payments/methods/available/');
      return response.data;
    } catch (error) {
      throw new Error('Error obteniendo métodos de pago');
    }
  }
};

// ========== SERVICIOS DE NOTIFICACIONES ==========

export const notificationsService = {
  async getNotifications(params = {}) {
    try {
      const response = await api.get('/api/notifications/', { params });
      return response.data;
    } catch (error) {
      throw new Error('Error obteniendo notificaciones');
    }
  },

  async markAsRead(notificationId) {
    try {
      await api.patch(`/api/notifications/${notificationId}/mark-read/`);
      return true;
    } catch (error) {
      throw new Error('Error marcando notificación como leída');
    }
  },

  async markAllAsRead() {
    try {
      await api.patch('/api/notifications/mark-all-read/');
      return true;
    } catch (error) {
      throw new Error('Error marcando todas las notificaciones como leídas');
    }
  }
};

// ========== SERVICIOS DE SINCRONIZACIÓN ==========

export const syncService = {
  async getSyncStatus() {
    try {
      const response = await api.get('/api/sync/status/');
      return response.data;
    } catch (error) {
      throw new Error('Error obteniendo estado de sincronización');
    }
  },

  async syncEntity(entityType, entityId) {
    try {
      const response = await api.post('/api/sync/sync-entity/', {
        entity_type: entityType,
        entity_id: entityId
      });
      return response.data;
    } catch (error) {
      throw new Error('Error sincronizando entidad');
    }
  },

  async getConflicts() {
    try {
      const response = await api.get('/api/sync/conflicts/');
      return response.data;
    } catch (error) {
      throw new Error('Error obteniendo conflictos');
    }
  },

  async resolveConflict(conflictId, resolution) {
    try {
      const response = await api.post('/api/sync/resolve-conflict/', {
        conflict_id: conflictId,
        resolution
      });
      return response.data;
    } catch (error) {
      throw new Error('Error resolviendo conflicto');
    }
  }
};

    // ========== SERVICIOS DE CARRITO ==========

    export const cartService = {
      async getCart() {
        try {
          const response = await api.get('/sales/cart/');
          return response.data;
        } catch (error) {
          throw new Error('Error obteniendo carrito');
        }
      },

      async createCart() {
        try {
          const response = await api.post('/sales/cart/create/');
          return response.data;
        } catch (error) {
          throw new Error('Error creando carrito');
        }
      },

      async addProduct(productId, quantity = 1) {
        try {
          const response = await api.post('/sales/cart/add-product/', {
            product_id: productId,
            quantity: quantity
          });
          return response.data;
        } catch (error) {
          throw new Error('Error agregando producto al carrito');
        }
      },

      async updateItem(itemId, quantity) {
        try {
          const response = await api.put(`/sales/cart/items/${itemId}/`, {
            quantity: quantity
          });
          return response.data;
        } catch (error) {
          throw new Error('Error actualizando item del carrito');
        }
      },

      async removeItem(itemId) {
        try {
          await api.delete(`/sales/cart/items/${itemId}/remove/`);
          return true;
        } catch (error) {
          throw new Error('Error removiendo item del carrito');
        }
      },

      async clearCart() {
        try {
          await api.post('/sales/cart/clear/');
          return true;
        } catch (error) {
          throw new Error('Error limpiando carrito');
        }
      },

      async checkout(clientInfo, paymentMethod = 'cash', stripePaymentIntentId = null) {
        try {
          const checkoutData = {
            client: clientInfo,
            payment_method: paymentMethod
          };
          
          // Agregar stripe_payment_intent_id si está disponible
          if (stripePaymentIntentId) {
            checkoutData.stripe_payment_intent_id = stripePaymentIntentId;
          }
          
          const response = await api.post('/sales/cart/checkout/', checkoutData);
          return response.data;
        } catch (error) {
          // Preservar el error original del backend para mejor debugging
          if (error.response && error.response.data) {
            throw new Error(error.response.data.error || error.response.data.message || 'Error procesando checkout');
          }
          throw new Error('Error procesando checkout');
        }
      }
    };

    // ========== SERVICIOS DE DASHBOARD ==========

    export const dashboardService = {
  async getStats(params = {}) {
    try {
      const response = await api.get('/dashboard/stats/', { params });
      return response.data;
    } catch (error) {
      throw new Error('Error obteniendo estadísticas del dashboard');
    }
  },

  async getKPIs(params = {}) {
    try {
      const response = await api.get('/dashboard/kpis/', { params });
      return response.data;
    } catch (error) {
      throw new Error('Error obteniendo KPIs');
    }
  },

  async getSalesTrend(params = {}) {
    try {
      const response = await api.get('/dashboard/sales-trend/', { params });
      return response.data;
    } catch (error) {
      throw new Error('Error obteniendo tendencia de ventas');
    }
  },

  async getTopProducts(params = {}) {
    try {
      const response = await api.get('/dashboard/top-products/', { params });
      return response.data;
    } catch (error) {
      throw new Error('Error obteniendo top productos');
    }
  },

  async getTopClients(params = {}) {
    try {
      const response = await api.get('/dashboard/top-clients/', { params });
      return response.data;
    } catch (error) {
      throw new Error('Error obteniendo top clientes');
    }
  }
};

// ========== UTILIDADES ==========

export const apiUtils = {
  // Verificar si hay conexión
  async checkConnection() {
    try {
      const response = await api.get('/health/');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  },

  // Obtener información del servidor
  async getServerInfo() {
    try {
      const response = await api.get('/api/info/');
      return response.data;
    } catch (error) {
      throw new Error('Error obteniendo información del servidor');
    }
  },

  // Subir archivo
  async uploadFile(file, endpoint = '/api/upload/') {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error('Error subiendo archivo');
    }
  },

  // Descargar archivo
  async downloadFile(url, filename) {
    try {
      const response = await api.get(url, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      return true;
    } catch (error) {
      throw new Error('Error descargando archivo');
    }
  }
};

export default api;
