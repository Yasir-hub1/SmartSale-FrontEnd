import React, { useState, useEffect } from 'react';
import { FaShoppingCart, FaSearch, FaFilter, FaPlus, FaMinus, FaTrash, FaCreditCard, FaUser, FaEnvelope, FaPhone, FaHome, FaRobot } from 'react-icons/fa';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { productsService, cartService } from '../services/api';
import CheckoutModal from '../components/checkout/CheckoutModal';
import AIAgentChat from '../components/ai/AIAgentChat';
import './PublicShopPage.css';

const PublicShopPage = () => {
  const { handleApiError, handleSuccess } = useErrorHandler();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAIAgent, setShowAIAgent] = useState(false);
  const [cart, setCart] = useState({
    items: [],
    total: 0,
    itemCount: 0
  });
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cartId, setCartId] = useState('');

  // Cargar productos y categorías
  useEffect(() => {
    loadProducts();
    loadCategories();
    loadCart();
  }, []);

  // Escuchar evento para abrir modal de checkout
  useEffect(() => {
    const handleOpenCheckoutModal = () => {
      setShowCheckout(true);
    };

    window.addEventListener('openCheckoutModal', handleOpenCheckoutModal);
    
    return () => {
      window.removeEventListener('openCheckoutModal', handleOpenCheckoutModal);
    };
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

  const loadCart = async () => {
    try {
      const cartData = await cartService.getCart();
      setCart({
        items: cartData.items || [],
        total: cartData.total_amount || 0,
        itemCount: cartData.total_items || 0
      });
      setCartId(cartData.id || '');
    } catch (error) {
      console.log('Carrito vacío o error cargando:', error);
    }
  };

  const handleAddToCart = async (product) => {
    try {
      await cartService.addProduct(product.id, 1);
      await loadCart();
      handleSuccess(`${product.name} agregado al carrito`);
    } catch (error) {
      handleApiError(error, 'Agregar al carrito');
    }
  };

  const handleRemoveFromCart = async (itemId) => {
    try {
      await cartService.removeItem(itemId);
      await loadCart();
      handleSuccess('Producto removido del carrito');
    } catch (error) {
      handleApiError(error, 'Remover del carrito');
    }
  };

  const handleUpdateQuantity = async (itemId, quantity) => {
    try {
      if (quantity <= 0) {
        await handleRemoveFromCart(itemId);
      } else {
        await cartService.updateItem(itemId, quantity);
        await loadCart();
      }
    } catch (error) {
      handleApiError(error, 'Actualizar cantidad');
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
    setShowCheckout(false);
    setShowCart(false);
    loadCart(); // Recargar carrito vacío
    console.log('Venta creada:', sale);
  };

  // Handlers para el agente inteligente
  const handleProductsFound = (foundProducts) => {
    // Filtrar productos mostrados basado en los encontrados por el agente
    const productIds = foundProducts.map(p => p.id);
    setProducts(prevProducts => 
      prevProducts.filter(p => productIds.includes(p.id))
    );
    handleSuccess(`Mostrando ${foundProducts.length} productos encontrados`);
  };

  const handleCartUpdated = () => {
    loadCart();
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

  const getTax = () => {
    return getTotalPrice() * 0.16; // 16% IVA
  };

  const getFinalTotal = () => {
    return getTotalPrice() + getTax();
  };

  if (loading) {
    return (
      <div className="public-shop-loading">
        <div className="loading-spinner"></div>
        <p>Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="public-shop-page">
      {/* Header */}
      <div className="public-shop-header">
        <div className="shop-title">
          <h1>🛍️ SmartSales365 - Tienda Pública</h1>
          <p>Bienvenido a nuestra tienda online. Explora nuestros productos y realiza tu compra.</p>
        </div>
        
        {/* Botones de acción */}
        <div className="action-buttons">
          {/* Botón del Agente Inteligente */}
          <button 
            className="ai-agent-btn"
            onClick={() => setShowAIAgent(true)}
            title="Asistente Inteligente"
          >
            <FaRobot />
            <span>Asistente</span>
          </button>
          
          {/* Carrito flotante */}
          <div className="cart-float" onClick={() => setShowCart(!showCart)}>
            <FaShoppingCart />
            <span className="cart-count">{cart.itemCount}</span>
          </div>
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
                      onClick={() => handleUpdateQuantity(cartItem.id, cartItem.quantity - 1)}
                      className="quantity-btn"
                    >
                      <FaMinus />
                    </button>
                    <span className="quantity">{cartItem.quantity}</span>
                    <button 
                      onClick={() => handleUpdateQuantity(cartItem.id, cartItem.quantity + 1)}
                      className="quantity-btn"
                    >
                      <FaPlus />
                    </button>
                    <button 
                      onClick={() => handleRemoveFromCart(cartItem.id)}
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
                <div key={item.id} className="cart-item">
                  <div className="item-info">
                    <h4>{item.product.name}</h4>
                    <p>${item.price} x {item.quantity}</p>
                  </div>
                  <div className="item-controls">
                    <button 
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      className="quantity-btn"
                    >
                      <FaMinus />
                    </button>
                    <span>{item.quantity}</span>
                    <button 
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      className="quantity-btn"
                    >
                      <FaPlus />
                    </button>
                    <button 
                      onClick={() => handleRemoveFromCart(item.id)}
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
                <div className="price-breakdown">
                  <div className="price-line">
                    <span>Subtotal:</span>
                    <span>${getTotalPrice().toFixed(2)}</span>
                  </div>
                  <div className="price-line">
                    <span>IVA (16%):</span>
                    <span>${getTax().toFixed(2)}</span>
                  </div>
                  <div className="price-line total">
                    <span>Total:</span>
                    <span>${getFinalTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="cart-actions">
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

      {/* Agente Inteligente */}
      <AIAgentChat
        isOpen={showAIAgent}
        onClose={() => setShowAIAgent(false)}
        cartId={cartId}
        onProductsFound={handleProductsFound}
        onCartUpdated={handleCartUpdated}
      />
    </div>
  );
};

export default PublicShopPage;
