import React, { useState, useEffect } from 'react';
import { FaChartLine, FaPlus, FaSearch, FaFilter, FaStore, FaUser, FaCalendarAlt, FaDollarSign, FaEye, FaDownload, FaSync, FaTimes, FaFilePdf } from 'react-icons/fa';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { salesService } from '../services/api';
import PDFDownloadButton from '../components/common/PDFDownloadButton';
import NewSaleModal from '../components/sales/NewSaleModal';
import './SalesPage.css';

const SalesPage = () => {
  const { handleApiError, handleSuccess } = useErrorHandler();
  const [sales, setSales] = useState([]);
  const [publicSales, setPublicSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  // Removed selectedTab state
  const [salesSummary, setSalesSummary] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);

  useEffect(() => {
    loadSales();
    loadSalesSummary();
  }, []);

  const loadSales = async (page = 1) => {
    try {
      setLoading(true);
      
      // Cargar todas las ventas sin paginación del backend
      const [adminSales, publicSalesData] = await Promise.all([
        salesService.getSales({ page_size: 1000 }), // Cargar todas las ventas administrativas
        salesService.getPublicSales({ page_size: 1000 }) // Cargar todas las ventas públicas
      ]);
      
      setSales(adminSales.results || adminSales);
      setPublicSales(publicSalesData.results || publicSalesData);
      
      // Calcular total de páginas basado en el total de ventas únicas
      const allSales = [...(adminSales.results || adminSales), ...(publicSalesData.results || publicSalesData)];
      const uniqueSales = allSales.reduce((acc, current) => {
        const existingSale = acc.find(sale => sale.id === current.id);
        if (!existingSale) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      setTotalPages(Math.ceil(uniqueSales.length / pageSize));
    } catch (error) {
      handleApiError(error, 'Cargar ventas');
    } finally {
      setLoading(false);
    }
  };

  const refreshSales = async () => {
    await loadSales();
    await loadSalesSummary();
    handleSuccess('Ventas actualizadas');
  };

  const handleViewSale = (saleId) => {
    // Buscar la venta específica en las ventas filtradas
    const filteredSales = getFilteredSales();
    const sale = filteredSales.find(s => s.id === saleId);
    
    if (sale) {
      setSelectedSale(sale);
      setShowSaleModal(true);
    } else {
      handleApiError({ message: 'Venta no encontrada' }, 'Ver detalles');
    }
  };

  const closeSaleModal = () => {
    setShowSaleModal(false);
    setSelectedSale(null);
  };

  const handleDownloadReceipt = async (saleId) => {
    try {
      // Buscar la venta específica en las ventas filtradas
      const filteredSales = getFilteredSales();
      const sale = filteredSales.find(s => s.id === saleId);
      
      if (sale) {
        // Preparar datos para el PDF igual que en el agente
        const saleData = {
          sale_id: sale.id,
          subtotal: sale.subtotal || 0,
          total: sale.total || 0,
          items_count: sale.total_items || sale.items?.length || 1,
          payment_method: 'efectivo', // Por defecto
          message: `Venta ${sale.id} - Total: $${sale.total}`
        };
        
        // Importar pdfService directamente
        const pdfService = (await import('../services/pdfService')).default;
        
        // Generar PDF con los datos específicos
        await pdfService.generatePDFWithData(saleData, `nota_venta_${sale.id.slice(0, 8)}.pdf`);
        
        handleSuccess('Comprobante descargado');
      } else {
        throw new Error('Venta no encontrada');
      }
    } catch (error) {
      handleApiError(error, 'Descargar comprobante');
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleNewSale = () => {
    setShowNewSaleModal(true);
  };

  const handleNewSaleSuccess = (sale) => {
    handleSuccess('¡Venta creada exitosamente!');
    setShowNewSaleModal(false);
    loadSales(); // Recargar la lista de ventas
    loadSalesSummary(); // Recargar el resumen
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
    // Combinar todas las ventas (administrativas y públicas) y eliminar duplicados
    const allSales = [...sales, ...publicSales];
    
    // Eliminar duplicados basándose en el ID
    const uniqueSales = allSales.reduce((acc, current) => {
      const existingSale = acc.find(sale => sale.id === current.id);
      if (!existingSale) {
        acc.push(current);
      }
      return acc;
    }, []);

    return uniqueSales.filter(sale => {
      const clientName = sale.client_name || sale.client?.name || '';
      const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sale.id?.toString().includes(searchTerm.toLowerCase()) ||
                          sale.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !filters.status || sale.status === filters.status;
      
      const matchesDateFrom = !filters.dateFrom || new Date(sale.created_at) >= new Date(filters.dateFrom);
      const matchesDateTo = !filters.dateTo || new Date(sale.created_at) <= new Date(filters.dateTo);
      
      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  };

  const getPaginatedSales = () => {
    const filteredSales = getFilteredSales();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredSales.slice(startIndex, endIndex);
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
    if (sale.user) {
      return { type: 'admin', icon: FaUser, text: `Admin: ${sale.user.first_name || sale.user.username}` };
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
  const paginatedSales = getPaginatedSales();
  
  // Actualizar total de páginas basado en las ventas filtradas
  const actualTotalPages = Math.ceil(filteredSales.length / pageSize);

  return (
    <div className="sales-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Ventas</h1>
          <p>Gestiona tus ventas y transacciones</p>
        </div>
        <div className="header-right">
          <button className="btn-secondary" onClick={refreshSales}>
            <FaSync />
            Actualizar
          </button>
          <button className="btn-primary" onClick={handleNewSale}>
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
        {paginatedSales.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FaChartLine />
            </div>
            <h3>No hay ventas registradas</h3>
            <p>Comienza registrando tu primera venta</p>
            <button className="btn-primary" onClick={handleNewSale}>
              <FaPlus />
              Registrar Primera Venta
            </button>
          </div>
        ) : (
          paginatedSales.map(sale => {
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
                    <span>{sale.client_name || sale.client?.name || 'Cliente Anónimo'}</span>
                  </div>
                  <div className="detail-item">
                    <FaCalendarAlt />
                    <span>{formatDate(sale.created_at)}</span>
                  </div>
                  <div className="detail-item">
                    <FaDollarSign />
                    <span>{sale.total_items || sale.items?.length || 0} productos</span>
                  </div>
                </div>
                
                <div className="sale-actions">
                  <button className="action-btn view" onClick={() => handleViewSale(sale.id)}>
                    <FaEye />
                    Ver Detalles
                  </button>
                  <button className="action-btn download" onClick={() => handleDownloadReceipt(sale.id)}>
                    <FaDownload />
                    Comprobante
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Paginación */}
      {filteredSales.length > 0 && actualTotalPages > 1 && (
        <div className="pagination">
          <button 
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Anterior
          </button>
          
          <div className="pagination-info">
            Página {currentPage} de {actualTotalPages}
          </div>
          
          <button 
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === actualTotalPages}
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Modal de detalles de venta */}
      {showSaleModal && selectedSale && (
        <div className="sale-modal-overlay">
          <div className="sale-modal">
            <div className="sale-modal-header">
              <h2>Detalles de la Venta</h2>
              <button className="close-modal-btn" onClick={closeSaleModal}>
                <FaTimes />
              </button>
            </div>
            
            <div className="sale-modal-content">
              <div className="sale-modal-section">
                <h3>Información General</h3>
                <div className="sale-info-grid">
                  <div className="info-item">
                    <label>ID de Venta:</label>
                    <span>{selectedSale.id}</span>
                  </div>
                  <div className="info-item">
                    <label>Fecha:</label>
                    <span>{formatDate(selectedSale.created_at)}</span>
                  </div>
                  <div className="info-item">
                    <label>Estado:</label>
                    <span>{getStatusBadge(selectedSale.status)}</span>
                  </div>
                  <div className="info-item">
                    <label>Estado de Pago:</label>
                    <span>{getPaymentStatusBadge(selectedSale.payment_status)}</span>
                  </div>
                </div>
              </div>

              <div className="sale-modal-section">
                <h3>Información del Cliente</h3>
                <div className="client-info">
                  <div className="info-item">
                    <label>Nombre:</label>
                    <span>{selectedSale.client_name || selectedSale.client?.name || 'Cliente Anónimo'}</span>
                  </div>
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{selectedSale.client_email || selectedSale.client?.email || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Teléfono:</label>
                    <span>{selectedSale.client_phone || selectedSale.client?.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="sale-modal-section">
                <h3>Productos</h3>
                <div className="products-list">
                  {selectedSale.items && selectedSale.items.length > 0 ? (
                    selectedSale.items.map((item, index) => (
                      <div key={index} className="product-item">
                        <div className="product-info">
                          <span className="product-name">{item.product?.name || 'Producto'}</span>
                          <span className="product-quantity">Cantidad: {item.quantity}</span>
                        </div>
                        <div className="product-price">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-products">
                      <p>No hay productos registrados</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="sale-modal-section">
                <h3>Totales</h3>
                <div className="totals-grid">
                  <div className="total-item">
                    <label>Subtotal:</label>
                    <span>{formatCurrency(selectedSale.subtotal || 0)}</span>
                  </div>
                  <div className="total-item">
                    <label>Descuento:</label>
                    <span>{formatCurrency(selectedSale.discount || 0)}</span>
                  </div>
                  <div className="total-item total-final">
                    <label>Total:</label>
                    <span>{formatCurrency(selectedSale.total || 0)}</span>
                  </div>
                </div>
              </div>

              {selectedSale.notes && (
                <div className="sale-modal-section">
                  <h3>Notas</h3>
                  <p className="sale-notes">{selectedSale.notes}</p>
                </div>
              )}
            </div>

            <div className="sale-modal-actions">
              <button className="btn-secondary" onClick={closeSaleModal}>
                Cerrar
              </button>
              <PDFDownloadButton
                saleId={selectedSale.id}
                receiptNumber={`NV-${selectedSale.id.slice(0, 8).toUpperCase()}`}
                saleData={{
                  sale_id: selectedSale.id,
                  subtotal: selectedSale.subtotal || 0,
                  total: selectedSale.total || 0,
                  items_count: selectedSale.total_items || selectedSale.items?.length || 1,
                  payment_method: 'efectivo',
                  message: `Venta ${selectedSale.id} - Total: $${selectedSale.total}`
                }}
                variant="primary"
                size="medium"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de nueva venta */}
      <NewSaleModal
        isOpen={showNewSaleModal}
        onClose={() => setShowNewSaleModal(false)}
        onSuccess={handleNewSaleSuccess}
      />
    </div>
  );
};

export default SalesPage;