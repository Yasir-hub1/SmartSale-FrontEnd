// Componente botón de sincronización
import React, { useState } from 'react';
import { useOffline } from '../../context/OfflineContext';
import { 
  FaSync, 
  FaCheck, 
  FaExclamationCircle, 
  FaClock
} from 'react-icons/fa';
import './SyncButton.css';

const SyncButton = () => {
  const { 
    isSyncing, 
    pendingCount, 
    canSync, 
    syncNow, 
    lastSyncTime,
    syncErrors,
    syncProgress 
  } = useOffline();

  const [showDetails, setShowDetails] = useState(false);

  const getButtonConfig = () => {
    if (isSyncing) {
      return {
        icon: FaSync,
        text: 'Sincronizando...',
        className: 'sync-syncing',
        disabled: true
      };
    }

    if (syncErrors.length > 0) {
      return {
        icon: FaExclamationCircle,
        text: 'Error',
        className: 'sync-error',
        disabled: false
      };
    }

    if (pendingCount > 0) {
      return {
        icon: FaSync,
        text: `Sincronizar (${pendingCount})`,
        className: 'sync-pending',
        disabled: false
      };
    }

    if (lastSyncTime) {
      return {
        icon: FaCheck,
        text: 'Sincronizado',
        className: 'sync-completed',
        disabled: false
      };
    }

    return {
      icon: FaClock,
      text: 'Sin cambios',
      className: 'sync-idle',
      disabled: true
    };
  };

  const config = getButtonConfig();
  const IconComponent = config.icon;

  const handleSync = async () => {
    if (isSyncing || !canSync) return;

    try {
      await syncNow();
    } catch (error) {
      console.error('[SyncButton] Error en sincronización:', error);
    }
  };

  const formatLastSync = (timestamp) => {
    if (!timestamp) return 'Nunca';
    
    const now = new Date();
    const syncTime = new Date(timestamp);
    const diffMs = now - syncTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return `Hace ${diffDays} días`;
  };

  return (
    <div className="sync-button-container">
      <button
        className={`sync-button ${config.className}`}
        onClick={handleSync}
        disabled={config.disabled}
        onMouseEnter={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
      >
        <div className="sync-icon">
          <IconComponent className={isSyncing ? 'spinning' : ''} />
        </div>
        <div className="sync-text">
          <span>{config.text}</span>
          {pendingCount > 0 && (
            <span className="pending-badge">{pendingCount}</span>
          )}
        </div>
        
        {/* Progreso de sincronización */}
        {isSyncing && syncProgress.total > 0 && (
          <div className="sync-progress">
            <div 
              className="progress-bar"
              style={{ 
                width: `${(syncProgress.current / syncProgress.total) * 100}%` 
              }}
            />
            <span className="progress-text">
              {syncProgress.current}/{syncProgress.total}
            </span>
          </div>
        )}
      </button>

      {/* Detalles del tooltip */}
      {showDetails && (
        <div className="sync-details">
          <div className="details-content">
            <div className="details-header">
              <h4>Estado de Sincronización</h4>
            </div>
            
            <div className="details-body">
              <div className="detail-row">
                <span>Última sincronización:</span>
                <span>{formatLastSync(lastSyncTime)}</span>
              </div>
              
              <div className="detail-row">
                <span>Operaciones pendientes:</span>
                <span className={pendingCount > 0 ? 'pending' : 'completed'}>
                  {pendingCount}
                </span>
              </div>
              
              {syncErrors.length > 0 && (
                <div className="detail-row">
                  <span>Errores:</span>
                  <span className="error">{syncErrors.length}</span>
                </div>
              )}
              
              {isSyncing && syncProgress.entity && (
                <div className="detail-row">
                  <span>Sincronizando:</span>
                  <span className="syncing">{syncProgress.entity}</span>
                </div>
              )}
            </div>
            
            {pendingCount > 0 && !isSyncing && (
              <div className="details-footer">
                <button 
                  className="sync-now-btn"
                  onClick={handleSync}
                >
                  Sincronizar ahora
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncButton;
