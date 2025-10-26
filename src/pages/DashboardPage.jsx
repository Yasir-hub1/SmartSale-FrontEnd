// Página del dashboard
import React, { useState, useEffect } from 'react';
import { FaChartLine, FaUsers, FaBox, FaDollarSign, FaSpinner } from 'react-icons/fa';
import { useOffline } from '../context/OfflineContext';
import { useCart } from '../context/CartContext';
import { dashboardService, productsService, clientsService, salesService } from '../services/api';
import { useErrorHandler } from '../hooks/useErrorHandler';
import './DashboardPage.css';

const DashboardPage = () => {
  const { isOfflineMode, lastSyncTime } = useOffline();
  const { total, itemCount } = useCart();
  const { handleApiError } = useErrorHandler();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar datos del dashboard
  useEffect(() => {
    let isMounted = true;
    
    const loadDashboardData = async () => {
      if (isOfflineMode) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const [stats, products, clients, sales] = await Promise.all([
          dashboardService.getStats(),
          productsService.getProducts({ page_size: 5 }),
          clientsService.getClients({ page_size: 5 }),
          salesService.getSales({ page_size: 5 })
        ]);
        
        if (isMounted) {
          setDashboardData({
            stats,
            products: products.results || products,
            clients: clients.results || clients,
            sales: sales.results || sales
          });
        }
      } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
        if (isMounted) {
          setError('Error cargando datos del dashboard');
          handleApiError(error, 'Cargar dashboard');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboardData();
    
    return () => {
      isMounted = false;
    };
  }, []); // Solo se ejecuta una vez al montar

  const kpis = dashboardData ? [
    {
      title: 'Total Productos',
      value: dashboardData.stats.total_products || 0,
      change: '+12.5%',
      trend: 'up',
      icon: FaBox,
      color: '#10b981'
    },
    {
      title: 'Total Clientes',
      value: dashboardData.stats.total_clients || 0,
      change: '+8.2%',
      trend: 'up',
      icon: FaUsers,
      color: '#3b82f6'
    },
    {
      title: 'Total Ventas',
      value: dashboardData.stats.total_sales || 0,
      change: '-2.1%',
      trend: 'down',
      icon: FaChartLine,
      color: '#f59e0b'
    },
    {
      title: 'Usuarios Online',
      value: dashboardData.stats.online_users || 0,
      change: '+5.3%',
      trend: 'up',
      icon: FaDollarSign,
      color: '#8b5cf6'
    }
  ] : [];

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading-container">
          <FaSpinner className="spinner" />
          <p>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1>Dashboard</h1>
          <p>Resumen de tu negocio</p>
        </div>
        <div className="header-right">
          <div className="last-update">
            Última actualización: {isOfflineMode ? 'Datos locales' : 'Hace 5 min'}
          </div>
        </div>
      </div>

      {/* Indicador offline */}
      {isOfflineMode && (
        <div className="offline-indicator">
          <span>📱 Ventas Inteligentes - Datos locales</span>
        </div>
      )}

      {/* KPIs */}
      <div className="kpis-grid">
        {kpis.map((kpi, index) => {
          const IconComponent = kpi.icon;
          return (
            <div key={index} className="kpi-card">
              <div className="kpi-header">
                <div className="kpi-icon" style={{ backgroundColor: kpi.color }}>
                  <IconComponent />
                </div>
                <div className={`kpi-trend ${kpi.trend}`}>
                  {kpi.change}
                </div>
              </div>
              <div className="kpi-content">
                <h3 className="kpi-title">{kpi.title}</h3>
                <div className="kpi-value">{kpi.value}</div>
              </div>
            </div>
          );
        })}
      </div>

   

      {/* Predicciones ML */}
      <div className="predictions-section">
        <div className="prediction-card">
          <div className="prediction-header">
            <h3>Predicciones de IA</h3>
            <div className="prediction-status">
              <span className="status-badge">Activo</span>
            </div>
          </div>
          <div className="prediction-content">
            <div className="prediction-item">
              <span className="prediction-label">Ventas esperadas mañana:</span>
              <span className="prediction-value">$2,850</span>
            </div>
            <div className="prediction-item">
              <span className="prediction-label">Producto recomendado:</span>
              <span className="prediction-value">Laptop HP</span>
            </div>
            <div className="prediction-item">
              <span className="prediction-label">Cliente en riesgo:</span>
              <span className="prediction-value">3 clientes</span>
            </div>
          </div>
        </div>
      </div>

    
    </div>
  );
};

export default DashboardPage;
