// Layout principal de la aplicación
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaBox, 
  FaUsers, 
  FaShoppingCart, 
  FaChartLine,
  FaChartBar,
  FaFileAlt,
  FaBrain,
  FaBars,
  FaTimes,
  FaCog,
  FaSignOutAlt,
  FaStore
} from 'react-icons/fa';
import { useOffline } from '../../context/OfflineContext';
import { useCart } from '../../context/CartContext';
import UserInfo from '../auth/UserInfo';
import LogoutButton from '../auth/LogoutButton';
import './Layout.css';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { isOfflineMode, pendingCount } = useOffline();
  const { itemCount } = useCart();

  const navigation = [
    {
      name: 'Inicio',
      href: '/',
      icon: FaHome,
      exact: true
    },
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: FaChartBar
    },
    // {
    //   name: 'Tienda',
    //   href: '/shop',
    //   icon: FaStore
    // },
    {
      name: 'Productos',
      href: '/products',
      icon: FaBox
    },
    {
      name: 'Clientes',
      href: '/clients',
      icon: FaUsers
    },
    {
      name: 'Ventas',
      href: '/sales',
      icon: FaChartLine
    },
    {
      name: 'Carrito',
      href: '/cart',
      icon: FaShoppingCart,
      badge: itemCount
    },
    {
      name: 'Reportes',
      href: '/reports',
      icon: FaFileAlt
    },
    {
      name: 'Predicciones IA',
      href: '/sales-prediction',
      icon: FaBrain
    }
  ];

  const isActiveRoute = (href, exact = false) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">💼</div>
            <div className="logo-text">
              <h2>Ventas Inteligentes</h2>
              <p>Sistema en Línea</p>
            </div>
          </div>
          <button 
            className="sidebar-close"
            onClick={closeSidebar}
          >
            <FaTimes />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navigation.map((item) => {
              const IconComponent = item.icon;
              const isActive = isActiveRoute(item.href, item.exact);
              
              return (
                <li key={item.name} className="nav-item">
                  <Link
                    to={item.href}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    onClick={closeSidebar}
                  >
                    <div className="nav-icon">
                      <IconComponent />
                    </div>
                    <span className="nav-text">{item.name}</span>
                    {item.badge > 0 && (
                      <span className="nav-badge">{item.badge}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="offline-status">
            <div className={`status-indicator ${isOfflineMode ? 'offline' : 'online'}`}>
              <div className="status-dot"></div>
              <span>{isOfflineMode ? 'Offline' : 'Online'}</span>
            </div>
            {pendingCount > 0 && (
              <div className="pending-indicator">
                <span>{pendingCount} pendientes</span>
              </div>
            )}
          </div>
          
          <div className="public-shop-link">
            <a 
              href="/tienda" 
              target="_blank" 
              rel="noopener noreferrer"
              className="public-shop-btn"
            >
              <FaStore />
              <span>Tienda Pública</span>
            </a>
          </div>
          
          <div className="sidebar-user">
            <UserInfo />
          </div>
          
          <div className="sidebar-actions">
            <button className="action-btn" title="Configuración">
              <FaCog />
            </button>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={closeSidebar}
        />
      )}

      {/* Main content */}
      <main className="main-content">
        {/* Header */}
        <header className="main-header">
          <div className="header-left">
            <button 
              className="menu-toggle"
              onClick={toggleSidebar}
            >
              <FaBars />
            </button>
            <div className="page-title">
              <h1>{getPageTitle(location.pathname)}</h1>
            </div>
          </div>
          
          <div className="header-right">
            <UserInfo />
          </div>
        </header>

        {/* Page content */}
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
};

// Función para obtener el título de la página
const getPageTitle = (pathname) => {
  const titles = {
    '/': 'Inicio',
    '/dashboard': 'Dashboard',
    '/products': 'Productos',
    '/clients': 'Clientes',
    '/sales': 'Ventas',
    '/cart': 'Carrito',
    '/reports': 'Reportes',
    '/payment': 'Pago'
  };
  
  return titles[pathname] || 'Ventas Inteligentes';
};

export default Layout;
