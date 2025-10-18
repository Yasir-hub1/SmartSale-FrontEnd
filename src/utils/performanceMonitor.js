// Utilidad para monitorear el rendimiento y detectar problemas

export const performanceMonitor = {
  // Contador de renders
  renderCounts: new Map(),
  
  // Contador de efectos
  effectCounts: new Map(),
  
  // Contador de consultas API
  apiCallCounts: new Map(),
  
  // Registrar un render
  logRender: (componentName) => {
    const current = performanceMonitor.renderCounts.get(componentName) || 0;
    performanceMonitor.renderCounts.set(componentName, current + 1);
    
    if (current > 10) {
      console.warn(`⚠️ ${componentName} se ha renderizado ${current + 1} veces`);
    }
  },
  
  // Registrar un efecto
  logEffect: (effectName) => {
    const current = performanceMonitor.effectCounts.get(effectName) || 0;
    performanceMonitor.effectCounts.set(effectName, current + 1);
    
    if (current > 5) {
      console.warn(`⚠️ Efecto ${effectName} se ha ejecutado ${current + 1} veces`);
    }
  },
  
  // Registrar una consulta API
  logApiCall: (endpoint) => {
    const current = performanceMonitor.apiCallCounts.get(endpoint) || 0;
    performanceMonitor.apiCallCounts.set(endpoint, current + 1);
    
    if (current > 3) {
      console.warn(`⚠️ API ${endpoint} se ha llamado ${current + 1} veces`);
    }
  },
  
  // Obtener estadísticas
  getStats: () => {
    return {
      renders: Object.fromEntries(performanceMonitor.renderCounts),
      effects: Object.fromEntries(performanceMonitor.effectCounts),
      apiCalls: Object.fromEntries(performanceMonitor.apiCallCounts)
    };
  },
  
  // Limpiar estadísticas
  clearStats: () => {
    performanceMonitor.renderCounts.clear();
    performanceMonitor.effectCounts.clear();
    performanceMonitor.apiCallCounts.clear();
  }
};

// Hook para monitorear renders
export const useRenderMonitor = (componentName) => {
  React.useEffect(() => {
    performanceMonitor.logRender(componentName);
  });
};

// Hook para monitorear efectos
export const useEffectMonitor = (effectName, effect) => {
  React.useEffect(() => {
    performanceMonitor.logEffect(effectName);
    return effect();
  }, [effectName, effect]);
};

// Interceptor para monitorear llamadas API
export const apiMonitor = {
  intercept: (axiosInstance) => {
    axiosInstance.interceptors.request.use(
      (config) => {
        const endpoint = `${config.method?.toUpperCase()} ${config.url}`;
        performanceMonitor.logApiCall(endpoint);
        return config;
      },
      (error) => {
        console.error('Error en interceptor de request:', error);
        return Promise.reject(error);
      }
    );
    
    axiosInstance.interceptors.response.use(
      (response) => {
        const endpoint = `${response.config.method?.toUpperCase()} ${response.config.url}`;
        console.log(`✅ API ${endpoint} completada`);
        return response;
      },
      (error) => {
        const endpoint = `${error.config?.method?.toUpperCase()} ${error.config?.url}`;
        console.error(`❌ Error en API ${endpoint}:`, error.message);
        return Promise.reject(error);
      }
    );
  }
};
