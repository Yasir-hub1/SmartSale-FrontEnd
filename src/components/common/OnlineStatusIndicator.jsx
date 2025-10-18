// Componente indicador de estado de conexión
import React from 'react';
import { useOffline } from '../../context/OfflineContext';
import { 
  FaWifi, 
  FaUnlink, 
  FaSpinner, 
  FaExclamationTriangle,
  FaCheckCircle 
} from 'react-icons/fa';
import './OnlineStatusIndicator.css';

const OnlineStatusIndicator = ({ size = 'medium', showText = true }) => {
  const { 
    isOnline, 
    backendConnected, 
    connectionStatus, 
    isInitializing 
  } = useOffline();

  const getStatusConfig = () => {
    if (isInitializing) {
      return {
        icon: FaSpinner,
        text: 'Verificando conexión...',
        className: 'status-checking',
        color: '#6b7280'
      };
    }

    switch (connectionStatus) {
      case 'online':
        return {
          icon: FaCheckCircle,
          text: 'Conectado',
          className: 'status-online',
          color: '#10b981'
        };
      case 'backend_offline':
        return {
          icon: FaExclamationTriangle,
          text: 'Sin servidor',
          className: 'status-backend-offline',
          color: '#f59e0b'
        };
      case 'offline':
        return {
          icon: FaUnlink,
          text: 'Sin conexión',
          className: 'status-offline',
          color: '#ef4444'
        };
      default:
        return {
          icon: FaWifi,
          text: 'Desconocido',
          className: 'status-unknown',
          color: '#6b7280'
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <div className={`online-status-indicator ${size} ${config.className}`}>
      <div className="status-icon">
        <IconComponent 
          className={isInitializing ? 'spinning' : ''} 
          style={{ color: config.color }}
        />
      </div>
      {showText && (
        <div className="status-text">
          <span style={{ color: config.color }}>
            {config.text}
          </span>
        </div>
      )}
      
      {/* Tooltip con información detallada */}
      <div className="status-tooltip">
        <div className="tooltip-content">
          <div className="tooltip-row">
            <span>Internet:</span>
            <span className={isOnline ? 'status-good' : 'status-bad'}>
              {isOnline ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          <div className="tooltip-row">
            <span>Servidor:</span>
            <span className={backendConnected ? 'status-good' : 'status-bad'}>
              {backendConnected ? 'Disponible' : 'No disponible'}
            </span>
          </div>
          <div className="tooltip-row">
            <span>Modo:</span>
            <span className={isOnline && backendConnected ? 'status-good' : 'status-warning'}>
              {isOnline && backendConnected ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineStatusIndicator;
