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
          <h1>Bienvenido a Ventas Inteligentes</h1>
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

    

   
    </div>
  );
};

export default HomePage;
