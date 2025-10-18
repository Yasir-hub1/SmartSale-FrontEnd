// Página de inicio
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaBox, 
  FaShoppingCart, 
  FaChartLine,
  FaFileAlt,
  FaMicrophone,
  FaWifi,
  FaDatabase
} from 'react-icons/fa';
import { useOffline } from '../context/OfflineContext';
import { useCart } from '../context/CartContext';
import './HomePage.css';

const HomePage = () => {
  const { isOfflineMode, pendingCount, lastSyncTime } = useOffline();
  const { itemCount, total } = useCart();

  const quickActions = [
    {
      title: 'Nueva Venta',
      description: 'Registrar una venta rápidamente',
      icon: FaChartLine,
      href: '/sales',
      color: '#10b981'
    },
    {
      title: 'Agregar Producto',
      description: 'Añadir producto al carrito',
      icon: FaBox,
      href: '/products',
      color: '#3b82f6'
    },
    {
      title: 'Ver Carrito',
      description: `${itemCount} productos en el carrito`,
      icon: FaShoppingCart,
      href: '/cart',
      color: '#f59e0b',
      badge: itemCount
    },
    {
      title: 'Generar Reporte',
      description: 'Crear reporte con IA',
      icon: FaFileAlt,
      href: '/reports',
      color: '#8b5cf6'
    }
  ];

  const features = [
    {
      title: 'Reconocimiento de Voz',
      description: 'Agrega productos al carrito usando comandos de voz',
      icon: FaMicrophone,
      available: true
    },
    {
      title: 'Funcionamiento Offline',
      description: 'Trabaja sin conexión a internet',
      icon: FaWifi,
      available: !isOfflineMode
    },
    {
      title: 'Sincronización Automática',
      description: 'Los datos se sincronizan automáticamente',
      icon: FaDatabase,
      available: pendingCount === 0
    }
  ];

  const formatLastSync = (timestamp) => {
    if (!timestamp) return 'Nunca sincronizado';
    
    const now = new Date();
    const syncTime = new Date(timestamp);
    const diffMs = now - syncTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    return `Hace ${diffHours}h`;
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>Bienvenido a SmartSales365</h1>
          <p>Sistema inteligente de gestión comercial con IA y funcionamiento offline</p>
          
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-value">{itemCount}</span>
              <span className="stat-label">Productos en carrito</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">${total.toFixed(2)}</span>
              <span className="stat-label">Total del carrito</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{pendingCount}</span>
              <span className="stat-label">Pendientes de sync</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Acciones Rápidas</h2>
        <div className="actions-grid">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Link
                key={index}
                to={action.href}
                className="action-card"
                style={{ '--accent-color': action.color }}
              >
                <div className="action-icon">
                  <IconComponent />
                </div>
                <div className="action-content">
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                </div>
                {action.badge > 0 && (
                  <div className="action-badge">{action.badge}</div>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Features */}
      <div className="features-section">
        <h2>Características Principales</h2>
        <div className="features-grid">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div 
                key={index}
                className={`feature-card ${feature.available ? 'available' : 'unavailable'}`}
              >
                <div className="feature-icon">
                  <IconComponent />
                </div>
                <div className="feature-content">
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
                <div className="feature-status">
                  {feature.available ? (
                    <span className="status-available">Disponible</span>
                  ) : (
                    <span className="status-unavailable">No disponible</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Section */}
      <div className="status-section">
        <h2>Estado del Sistema</h2>
        <div className="status-grid">
          <div className="status-card">
            <div className="status-header">
              <h3>Conexión</h3>
              <div className={`status-indicator ${isOfflineMode ? 'offline' : 'online'}`}>
                <div className="status-dot"></div>
                <span>{isOfflineMode ? 'Offline' : 'Online'}</span>
              </div>
            </div>
            <p>
              {isOfflineMode 
                ? 'Trabajando en modo offline. Los cambios se sincronizarán automáticamente.'
                : 'Conectado al servidor. Todos los datos están sincronizados.'
              }
            </p>
          </div>

          <div className="status-card">
            <div className="status-header">
              <h3>Sincronización</h3>
              <div className="sync-info">
                <span className="sync-count">{pendingCount} pendientes</span>
              </div>
            </div>
            <p>
              Última sincronización: {formatLastSync(lastSyncTime)}
            </p>
          </div>

          <div className="status-card">
            <div className="status-header">
              <h3>Carrito</h3>
              <div className="cart-info">
                <span className="cart-count">{itemCount} productos</span>
              </div>
            </div>
            <p>
              Total: ${total.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Voice Commands Help */}
      <div className="voice-help">
        <h2>Comandos de Voz Disponibles</h2>
        <div className="voice-commands">
          <div className="command-group">
            <h4>Carrito</h4>
            <ul>
              <li>"Agregar [producto] al carrito"</li>
              <li>"Quitar [producto] del carrito"</li>
              <li>"Ver carrito"</li>
            </ul>
          </div>
          <div className="command-group">
            <h4>Navegación</h4>
            <ul>
              <li>"Ir a productos"</li>
              <li>"Ir a clientes"</li>
              <li>"Ir a dashboard"</li>
            </ul>
          </div>
          <div className="command-group">
            <h4>Reportes</h4>
            <ul>
              <li>"Generar reporte de ventas"</li>
              <li>"Mostrar reporte de clientes"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
