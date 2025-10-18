import React, { useState, useEffect } from 'react';
import { FaChartLine, FaPlus, FaSearch, FaFilter, FaStore, FaUser, FaCalendarAlt, FaDollarSign, FaEye, FaDownload } from 'react-icons/fa';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { salesService } from '../services/api';
import './SalesPage.css';

const SalesPage = () => {
  const { handleApiError, handleSuccess } = useErrorHandler();
  const [sales, setSales] = useState([]);
  const [publicSales, setPublicSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all'); // 'all', 'admin', 'public'
  const [salesSummary, setSalesSummary] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    loadSales();
    loadSalesSummary();
  }, []);

  const loadSales = async () => {
    try {
      setLoading(true);
      const [adminSales, publicSalesData] = await Promise.all([
        salesService.getSales(),
        salesService.getPublicSales()
      ]);
      
      setSales(adminSales.results || adminSales);
      setPublicSales(publicSalesData.results || publicSalesData);
    } catch (error) {
      handleApiError(error, 'Cargar ventas');
    } finally {
      setLoading(false);
    }
  };

  const loadSalesSummary = async () => {
    try {
      const summary = await salesService.getSalesSummary();
      setSalesSummary(summary);
    } catch (error) {
      console.error('Error cargando resumen:', error);
    }
  };

  const getFilteredSales = () => {
    let allSales = [];
    
    if (selectedTab === 'all') {
      allSales = [...sales, ...publicSales];
    } else if (selectedTab === 'admin') {
      allSales = sales;
    } else if (selectedTab === 'public') {
      allSales = publicSales;
    }

    return allSales.filter(sale => {
      const matchesSearch = sale.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sale.id?.toString().includes(searchTerm.toLowerCase()) ||
                          sale.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !filters.status || sale.status === filters.status;
      
      return matchesSearch && matchesStatus;
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { class: 'status-completed', text: 'Completada', icon: '✓' },
      pending: { class: 'status-pending', text: 'Pendiente', icon: '⏳' },
      cancelled: { class: 'status-cancelled', text: 'Cancelada', icon: '✗' },
      refunded: { class: 'status-refunded', text: 'Reembolsada', icon: '↩' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`status-badge ${config.class}`}>
        <span className="status-icon">{config.icon}</span>
        {config.text}
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const statusConfig = {
      paid: { class: 'payment-paid', text: 'Pagado', icon: '💳' },
      pending: { class: 'payment-pending', text: 'Pendiente', icon: '⏳' },
      failed: { class: 'payment-failed', text: 'Fallido', icon: '❌' },
      refunded: { class: 'payment-refunded', text: 'Reembolsado', icon: '↩' }
    };
    
    const config = statusConfig[paymentStatus] || statusConfig.pending;
    return (
      <span className={`payment-badge ${config.class}`}>
        <span className="payment-icon">{config.icon}</span>
        {config.text}
      </span>
    );
  };

  const getSaleSource = (sale) => {
    if (sale.user_name) {
      return { type: 'admin', icon: FaUser, text: `Admin: ${sale.user_name}` };
    } else {
      return { type: 'public', icon: FaStore, text: 'Tienda Pública' };
    }
  };

  if (loading) {
    return (
      <div className="sales-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando ventas...</p>
        </div>
      </div>
    );
  }

  const filteredSales = getFilteredSales();

  return (
    <div className="sales-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Ventas</h1>
          <p>Gestiona tus ventas y transacciones</p>
        </div>
        <div className="header-right">
          <button className="btn-primary">
            <FaPlus />
            Nueva Venta
          </button>
        </div>
      </div>

      {/* Resumen de ventas */}
      {salesSummary && (
        <div className="sales-summary">
          <div className="summary-card">
            <div className="summary-icon">
              <FaChartLine />
            </div>
            <div className="summary-content">
              <h3>Total General</h3>
              <p className="summary-number">{salesSummary.combined.total_sales}</p>
              <p className="summary-amount">{formatCurrency(salesSummary.combined.total_revenue)}</p>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-icon admin">
              <FaUser />
            </div>
            <div className="summary-content">
              <h3>Ventas Administrativas</h3>
              <p className="summary-number">{salesSummary.admin_sales.total_sales}</p>
              <p className="summary-amount">{formatCurrency(salesSummary.admin_sales.total_revenue)}</p>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-icon public">
              <FaStore />
            </div>
            <div className="summary-content">
              <h3>Ventas Públicas</h3>
              <p className="summary-number">{salesSummary.public_sales.total_sales}</p>
              <p className="summary-amount">{formatCurrency(salesSummary.public_sales.total_revenue)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs de navegación */}
      <div className="sales-tabs">
        <button 
          className={`tab-btn ${selectedTab === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedTab('all')}
        >
          <FaChartLine />
          Todas las Ventas ({sales.length + publicSales.length})
        </button>
        <button 
          className={`tab-btn ${selectedTab === 'admin' ? 'active' : ''}`}
          onClick={() => setSelectedTab('admin')}
        >
          <FaUser />
          Administrativas ({sales.length})
        </button>
        <button 
          className={`tab-btn ${selectedTab === 'public' ? 'active' : ''}`}
          onClick={() => setSelectedTab('public')}
        >
          <FaStore />
          Públicas ({publicSales.length})
        </button>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar ventas..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          className={`filter-btn ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter />
          Filtros
        </button>
      </div>

      {/* Filtros expandidos */}
      {showFilters && (
        <div className="filters-expanded">
          <div className="filter-group">
            <label>Estado:</label>
            <select 
              value={filters.status} 
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="">Todos</option>
              <option value="completed">Completada</option>
              <option value="pending">Pendiente</option>
              <option value="cancelled">Cancelada</option>
              <option value="refunded">Reembolsada</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Desde:</label>
            <input 
              type="date" 
              value={filters.dateFrom}
              onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
            />
          </div>
          
          <div className="filter-group">
            <label>Hasta:</label>
            <input 
              type="date" 
              value={filters.dateTo}
              onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
            />
          </div>
        </div>
      )}

      {/* Lista de ventas */}
      <div className="sales-list">
        {filteredSales.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FaChartLine />
            </div>
            <h3>No hay ventas registradas</h3>
            <p>Comienza registrando tu primera venta</p>
            <button className="btn-primary">
              <FaPlus />
              Registrar Primera Venta
            </button>
          </div>
        ) : (
          filteredSales.map(sale => {
            const source = getSaleSource(sale);
            const SourceIcon = source.icon;
            
            return (
              <div key={sale.id} className="sale-card">
                <div className="sale-header">
                  <div className="sale-info">
                    <h3>Venta #{sale.id.slice(0, 8)}</h3>
                    <div className="sale-source">
                      <SourceIcon />
                      <span>{source.text}</span>
                    </div>
                  </div>
                  <div className="sale-amount">
                    <span className="amount">{formatCurrency(sale.total)}</span>
                    <div className="sale-badges">
                      {getStatusBadge(sale.status)}
                      {getPaymentStatusBadge(sale.payment_status)}
                    </div>
                  </div>
                </div>
                
                <div className="sale-details">
                  <div className="detail-item">
                    <FaUser />
                    <span>{sale.client_name}</span>
                  </div>
                  <div className="detail-item">
                    <FaCalendarAlt />
                    <span>{formatDate(sale.created_at)}</span>
                  </div>
                  <div className="detail-item">
                    <FaDollarSign />
                    <span>{sale.total_items} productos</span>
                  </div>
                </div>
                
                <div className="sale-actions">
                  <button className="action-btn view">
                    <FaEye />
                    Ver Detalles
                  </button>
                  <button className="action-btn download">
                    <FaDownload />
                    Comprobante
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SalesPage;