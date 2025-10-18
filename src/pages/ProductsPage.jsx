// Página de productos
import React, { useState, useEffect } from 'react';
import { FaSearch, FaPlus, FaFilter, FaTh, FaList, FaMicrophone, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { useOffline } from '../context/OfflineContext';
import { productsService } from '../services/api';
import indexedDBService from '../services/indexedDBService';
import ProductForm from '../components/forms/ProductForm';
import { useErrorHandler } from '../hooks/useErrorHandler';
import './ProductsPage.css';

const ProductsPage = () => {
  const { isOfflineMode } = useOffline();
  const { handleApiError, handleSuccess } = useErrorHandler();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Cargar productos
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      if (isOfflineMode) {
        // Cargar desde IndexedDB cuando esté offline
        const productsData = await indexedDBService.getProducts();
        setProducts(productsData);
      } else {
        // Cargar desde API cuando esté online
        const response = await productsService.getProducts();
        setProducts(response.results || response);
      }
    } catch (error) {
      console.error('[ProductsPage] Error cargando productos:', error);
      handleApiError(error, 'Cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await productsService.deleteProduct(productId);
        handleSuccess('Producto eliminado exitosamente');
        loadProducts();
      } catch (error) {
        console.error('Error eliminando producto:', error);
        handleApiError(error, 'Eliminar producto');
      }
    }
  };

  const handleFormClose = () => {
    setShowProductForm(false);
    setSelectedProduct(null);
  };

  const handleFormSave = () => {
    loadProducts();
  };

  // Filtrar productos
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="products-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1>Productos</h1>
          <p>{filteredProducts.length} productos encontrados</p>
        </div>
        <div className="header-right">
          <button className="btn-primary" onClick={handleCreateProduct}>
            <FaPlus />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="filters-section">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="voice-search-btn" title="Búsqueda por voz">
            <FaMicrophone />
          </button>
        </div>
        
        <div className="view-controls">
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <FaTh />
          </button>
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <FaList />
          </button>
          <button
            className="filter-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter />
            Filtros
          </button>
        </div>
      </div>

      {/* Indicador offline */}
      {isOfflineMode && (
        <div className="offline-indicator">
          <span>📱 Trabajando con datos locales</span>
        </div>
      )}

      {/* Lista de productos */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Cargando productos...</p>
        </div>
      ) : (
        <div className={`products-container ${viewMode}`}>
          {filteredProducts.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                {product.image ? (
                  <img src={product.image} alt={product.name} />
                ) : (
                  <div className="placeholder-image">
                    <span>📦</span>
                  </div>
                )}
              </div>
              
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-sku">SKU: {product.sku}</p>
                <p className="product-price">${product.price}</p>
                <div className="product-stock">
                  <span className={`stock-badge ${product.stock_status}`}>
                    {product.stock} unidades
                  </span>
                </div>
              </div>
              
              <div className="product-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => handleEditProduct(product)}
                  title="Editar producto"
                >
                  <FaEdit />
                </button>
                <button 
                  className="btn-danger"
                  onClick={() => handleDeleteProduct(product.id)}
                  title="Eliminar producto"
                >
                  <FaTrash />
                </button>
                <button className="btn-primary">
                  Agregar al Carrito
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado vacío */}
      {!loading && filteredProducts.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No se encontraron productos</h3>
          <p>
            {searchTerm 
              ? 'Intenta con otros términos de búsqueda'
              : 'No hay productos disponibles'
            }
          </p>
          <button className="btn-primary" onClick={handleCreateProduct}>
            <FaPlus />
            Agregar Primer Producto
          </button>
        </div>
      )}

      {/* Formulario de producto */}
      {showProductForm && (
        <ProductForm
          product={selectedProduct}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}
    </div>
  );
};

export default ProductsPage;
