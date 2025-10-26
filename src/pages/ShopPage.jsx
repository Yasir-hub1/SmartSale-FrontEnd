import React, { useState, useEffect } from 'react';
import { FaShoppingCart, FaSearch, FaFilter, FaPlus, FaMinus, FaTrash, FaCreditCard } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { productsService } from '../services/api';
import CheckoutModal from '../components/checkout/CheckoutModal';
import './ShopPage.css';

const ShopPage = () => {
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart } = useCart();
  const { handleApiError, handleSuccess } = useErrorHandler();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  // Cargar productos
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productsService.getProducts();
      setProducts(response.results || response);
    } catch (error) {
      handleApiError(error, 'Cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await productsService.getCategories();
      setCategories(response.results || response);
    } catch (error) {
      handleApiError(error, 'Cargar categorías');
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    handleSuccess(`${product.name} agregado al carrito`);
  };

  const handleRemoveFromCart = (productId) => {
    removeFromCart(productId);
    handleSuccess('Producto removido del carrito');
  };

  const handleUpdateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
    } else {
      updateQuantity(productId, quantity);
    }
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) {
      handleApiError({ response: { status: 400, data: { detail: 'El carrito está vacío' } } }, 'Checkout');
      return;
    }
    setShowCheckout(true);
  };

  const handleCheckoutSuccess = (sale) => {
    handleSuccess('¡Compra realizada exitosamente!');
    clearCart();
    setShowCheckout(false);
    // Aquí podrías redirigir a una página de confirmación o mostrar el comprobante
    console.log('Venta creada:', sale);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category?.id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCartItem = (productId) => {
    return cart.items.find(item => item.product.id === productId);
  };

  const getTotalPrice = () => {
    return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  if (loading) {
    return (
      <div className="shop-loading">
        <div className="loading-spinner"></div>
        <p>Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="shop-page">
      {/* Header */}
      <div className="shop-header">
        <div className="shop-title">
          <h1> Tienda Ventas Inteligentes</h1>
          <p>Selecciona tus productos favoritos</p>
        </div>
        
        {/* Carrito flotante */}
        <div className="cart-float" onClick={() => setShowCart(!showCart)}>
          <FaShoppingCart />
          <span className="cart-count">{cart.items.length}</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="shop-filters">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="category-filter">
          <FaFilter />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de productos */}
      <div className="products-grid">
        {filteredProducts.map(product => {
          const cartItem = getCartItem(product.id);
          const isInCart = !!cartItem;
          
          return (
            <div key={product.id} className="product-card">
              <div className="product-image">
                {product.image ? (
                  <img src={product.image} alt={product.name} />
                ) : (
                  <div className="no-image">📦</div>
                )}
              </div>
              
              <div className="product-info">
                <h3>{product.name}</h3>
                <p className="product-description">{product.description}</p>
                <div className="product-price">
                  <span className="price">${product.price}</span>
                  <span className="stock">Stock: {product.stock}</span>
                </div>
                
                {isInCart ? (
                  <div className="cart-controls">
                    <button 
                      onClick={() => handleUpdateQuantity(product.id, cartItem.quantity - 1)}
                      className="quantity-btn"
                    >
                      <FaMinus />
                    </button>
                    <span className="quantity">{cartItem.quantity}</span>
                    <button 
                      onClick={() => handleUpdateQuantity(product.id, cartItem.quantity + 1)}
                      className="quantity-btn"
                    >
                      <FaPlus />
                    </button>
                    <button 
                      onClick={() => handleRemoveFromCart(product.id)}
                      className="remove-btn"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleAddToCart(product)}
                    className="add-to-cart-btn"
                    disabled={product.stock === 0}
                  >
                    <FaPlus />
                    {product.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Carrito lateral */}
      {showCart && (
        <div className="cart-sidebar">
          <div className="cart-header">
            <h3>🛒 Mi Carrito</h3>
            <button onClick={() => setShowCart(false)} className="close-cart">×</button>
          </div>
          
          <div className="cart-items">
            {cart.items.length === 0 ? (
              <p className="empty-cart">Tu carrito está vacío</p>
            ) : (
              cart.items.map(item => (
                <div key={item.product.id} className="cart-item">
                  <div className="item-info">
                    <h4>{item.product.name}</h4>
                    <p>${item.price} x {item.quantity}</p>
                  </div>
                  <div className="item-controls">
                    <button 
                      onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                      className="quantity-btn"
                    >
                      <FaMinus />
                    </button>
                    <span>{item.quantity}</span>
                    <button 
                      onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                      className="quantity-btn"
                    >
                      <FaPlus />
                    </button>
                    <button 
                      onClick={() => handleRemoveFromCart(item.product.id)}
                      className="remove-btn"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {cart.items.length > 0 && (
            <div className="cart-footer">
              <div className="cart-total">
                <h3>Total: ${getTotalPrice().toFixed(2)}</h3>
              </div>
              <div className="cart-actions">
                <button onClick={clearCart} className="clear-cart-btn">
                  Limpiar carrito
                </button>
                <button onClick={handleCheckout} className="checkout-btn">
                  <FaCreditCard />
                  Proceder al pago
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overlay para el carrito */}
      {showCart && <div className="cart-overlay" onClick={() => setShowCart(false)}></div>}

      {/* Modal de Checkout */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        cart={cart}
        onSuccess={handleCheckoutSuccess}
      />
    </div>
  );
};

export default ShopPage;
