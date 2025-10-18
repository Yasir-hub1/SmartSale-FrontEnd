// Componente de advertencia offline
import React, { useState, useEffect } from 'react';
import { useOffline } from '../../context/OfflineContext';
import { 
  FaUnlink, 
  FaExclamationTriangle, 
  FaTimes, 
  FaSync,
  FaClock,
  FaDatabase
} from 'react-icons/fa';
import './OfflineWarning.css';

const OfflineWarning = () => {
  const { 
    isOfflineMode, 
    lastSyncTime, 
    pendingCount,
    isFullyOnline,
    storageUsage,
    isStorageFull
  } = useOffline();

  const [isDismissed, setIsDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Resetear dismiss cuando cambie el estado de conexión
  useEffect(() => {
    if (isFullyOnline) {
      setIsDismissed(false);
    }
  }, [isFullyOnline]);

  // No mostrar si está online o fue dismissado
  if (isFullyOnline || isDismissed) {
    return null;
  }

  const getWarningConfig = () => {
    if (isStorageFull) {
      return {
        icon: FaDatabase,
        title: 'Almacenamiento lleno',
        message: 'El espacio de almacenamiento local está casi lleno. Algunas funciones pueden verse limitadas.',
        severity: 'error',
        className: 'warning-storage-full'
      };
    }

    if (pendingCount > 10) {
      return {
        icon: FaExclamationTriangle,
        title: 'Muchas operaciones pendientes',
        message: `${pendingCount} operaciones esperando sincronización. La aplicación puede funcionar lentamente.`,
        severity: 'warning',
        className: 'warning-many-pending'
      };
    }

    if (isOfflineMode) {
      return {
        icon: FaUnlink,
        title: 'Trabajando offline',
        message: 'No hay conexión a internet. Los cambios se sincronizarán automáticamente cuando se restablezca la conexión.',
        severity: 'info',
        className: 'warning-offline'
      };
    }

    return null;
  };

  const config = getWarningConfig();
  if (!config) return null;

  const IconComponent = config.icon;

  const formatLastSync = (timestamp) => {
    if (!timestamp) return 'Nunca sincronizado';
    
    const now = new Date();
    const syncTime = new Date(timestamp);
    const diffMs = now - syncTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    return `Hace ${diffDays} días`;
  };

  const getStorageStatus = () => {
    if (storageUsage === null) return 'Desconocido';
    if (storageUsage < 0.5) return 'Normal';
    if (storageUsage < 0.8) return 'Moderado';
    if (storageUsage < 0.95) return 'Alto';
    return 'Crítico';
  };

  const getStorageColor = () => {
    if (storageUsage === null) return '#6b7280';
    if (storageUsage < 0.5) return '#10b981';
    if (storageUsage < 0.8) return '#f59e0b';
    if (storageUsage < 0.95) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className={`offline-warning ${config.className} ${config.severity}`}>
      <div className="warning-content">
        <div className="warning-icon">
          <IconComponent />
        </div>
        
        <div className="warning-text">
          <div className="warning-title">{config.title}</div>
          <div className="warning-message">{config.message}</div>
        </div>
        
        <div className="warning-actions">
          <button
            className="warning-details-btn"
            onClick={() => setShowDetails(!showDetails)}
            title="Ver detalles"
          >
            <FaClock />
          </button>
          
          <button
            className="warning-dismiss-btn"
            onClick={() => setIsDismissed(true)}
            title="Cerrar advertencia"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Detalles expandidos */}
      {showDetails && (
        <div className="warning-details">
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Última sincronización:</span>
              <span className="detail-value">
                {formatLastSync(lastSyncTime)}
              </span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">Operaciones pendientes:</span>
              <span className="detail-value pending">
                {pendingCount}
              </span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">Uso de almacenamiento:</span>
              <span 
                className="detail-value"
                style={{ color: getStorageColor() }}
              >
                {getStorageStatus()} ({Math.round(storageUsage * 100)}%)
              </span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">Estado de conexión:</span>
              <span className="detail-value">
                {isFullyOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          
          {pendingCount > 0 && (
            <div className="details-actions">
              <button className="sync-now-btn">
                <FaSync />
                Sincronizar ahora
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OfflineWarning;
