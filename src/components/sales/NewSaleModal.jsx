import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaMinus, FaTrash, FaUser, FaEnvelope, FaPhone, FaHome, FaCreditCard, FaShoppingCart } from 'react-icons/fa';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { productsService, salesService } from '../../services/api';
import PaymentMethodSelector from '../payment/PaymentMethodSelector';
import StripePaymentForm from '../payment/StripePaymentForm';
import './NewSaleModal.css';

const NewSaleModal = ({ isOpen, onClose, onSuccess }) => {
  const { handleApiError, handleSuccess } = useErrorHandler();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState([]);
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'México'
  });
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [errors, setErrors] = useState({});
  const [showStripeForm, setShowStripeForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProducts();
      loadCategories();
    }
  }, [isOpen]);

  const loadProducts = async () => {
    try {
      const response = await productsService.getProducts();
      setProducts(response.results || response);
    } catch (error) {
      handleApiError(error, 'Cargar productos');
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

  const getFilteredProducts = () => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const getCartItem = (productId) => {
    return cart.find(item => item.product.id === productId);
  };

  const handleAddToCart = (product) => {
    const existingItem = getCartItem(product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        id: Date.now() + Math.random(), // ID temporal
        product: product,
        quantity: 1,
        price: product.price
      }]);
    }
  };

  const handleRemoveFromCart = (productId) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const handleUpdateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
    } else {
      setCart(cart.map(item => 
        item.product.id === productId 
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClientInfo(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!clientInfo.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    
    if (!clientInfo.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(clientInfo.email)) {
      newErrors.email = 'El email no es válido';
    }
    
    if (!clientInfo.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }
    
    if (cart.length === 0) {
      newErrors.cart = 'Debe agregar al menos un producto';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod(method);
    setPaymentMethod(method.code);
    setShowStripeForm(method.code === 'stripe');
  };

  const handleStripeSuccess = async (paymentIntentData) => {
    try {
      setLoading(true);
      
      console.log('[NewSaleModal] Payment Intent Data:', paymentIntentData);
      console.log('[NewSaleModal] Cart:', cart);
      console.log('[NewSaleModal] Client Info:', clientInfo);
      
      const saleData = {
        client: clientInfo,
        items: cart.map(item => ({
          product: item.product.id,
          quantity: item.quantity,
          price: item.price
        })),
        payment_method: 'stripe',
        stripe_payment_intent_id: paymentIntentData.payment_intent_id,
        total: getTotalPrice(),
        subtotal: getTotalPrice()
      };
      
      console.log('[NewSaleModal] Sale Data:', saleData);
      
      const response = await salesService.createSale(saleData);
      
      console.log('[NewSaleModal] Sale created:', response);
      
      handleSuccess('¡Venta creada exitosamente!');
      onSuccess(response);
      handleClose();
      
    } catch (error) {
      handleApiError(error, 'Crear venta');
    } finally {
      setLoading(false);
    }
  };

  const handleStripeError = (error) => {
    handleApiError(error, 'Procesar pago con Stripe');
  };

  const handleStripePayment = () => {
    // Esta función se llama cuando se selecciona Stripe
    // El formulario de Stripe manejará el pago
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!selectedPaymentMethod) {
      setErrors({ payment: 'Selecciona un método de pago' });
      return;
    }

    // Si es Stripe, no procesar aquí - se maneja en handleStripeSuccess
    if (selectedPaymentMethod.code === 'stripe') {
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('[NewSaleModal] Creating sale with payment method:', selectedPaymentMethod.code);
      console.log('[NewSaleModal] Cart:', cart);
      console.log('[NewSaleModal] Client Info:', clientInfo);
      
      const saleData = {
        client: clientInfo,
        items: cart.map(item => ({
          product: item.product.id,
          quantity: item.quantity,
          price: item.price
        })),
        payment_method: selectedPaymentMethod.code,
        total: getTotalPrice(),
        subtotal: getTotalPrice()
      };
      
      console.log('[NewSaleModal] Sale Data:', saleData);
      
      const response = await salesService.createSale(saleData);
      
      console.log('[NewSaleModal] Sale created:', response);
      
      handleSuccess('¡Venta creada exitosamente!');
      onSuccess(response);
      handleClose();
      
    } catch (error) {
      handleApiError(error, 'Crear venta');
    } finally {
      setLoading(false);
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getFinalTotal = () => {
    return getTotalPrice(); // Sin impuestos según los requerimientos
  };

  const handleClose = () => {
    setCart([]);
    setClientInfo({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: 'México'
    });
    setPaymentMethod(null);
    setSelectedPaymentMethod(null);
    setShowStripeForm(false);
    setErrors({});
    setSearchTerm('');
    setSelectedCategory('');
    onClose();
  };

  if (!isOpen) return null;

  const filteredProducts = getFilteredProducts();

  return (
    <div className="new-sale-modal-overlay">
      <div className="new-sale-modal">
        <div className="new-sale-modal-header">
          <h2>Nueva Venta</h2>
          <button className="close-modal-btn" onClick={handleClose}>
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="new-sale-form">
          <div className="new-sale-content">
            {/* Sección de productos */}
            <div className="products-section">
              <h3>Productos</h3>
              
              {/* Filtros de productos */}
              <div className="product-filters">
                <div className="search-bar">
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
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
                        <h4>{product.name}</h4>
                        <p className="product-description">{product.description}</p>
                        <div className="product-price">
                          <span className="price">${product.price}</span>
                          <span className="stock">Stock: {product.stock}</span>
                        </div>
                        
                        {isInCart ? (
                          <div className="cart-controls">
                            <button 
                              type="button"
                              onClick={() => handleUpdateQuantity(product.id, cartItem.quantity - 1)}
                              className="quantity-btn"
                            >
                              <FaMinus />
                            </button>
                            <span className="quantity">{cartItem.quantity}</span>
                            <button 
                              type="button"
                              onClick={() => handleUpdateQuantity(product.id, cartItem.quantity + 1)}
                              className="quantity-btn"
                            >
                              <FaPlus />
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleRemoveFromCart(product.id)}
                              className="remove-btn"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        ) : (
                          <button 
                            type="button"
                            onClick={() => handleAddToCart(product)}
                            className="add-to-cart-btn"
                            disabled={product.stock === 0}
                          >
                            <FaPlus />
                            {product.stock === 0 ? 'Sin stock' : 'Agregar'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sección de carrito y cliente */}
            <div className="checkout-section">
              {/* Carrito */}
              <div className="cart-section">
                <h3>
                  <FaShoppingCart />
                  Carrito ({cart.length} productos)
                </h3>
                
                {cart.length === 0 ? (
                  <p className="empty-cart">No hay productos en el carrito</p>
                ) : (
                  <div className="cart-items">
                    {cart.map(item => (
                      <div key={item.id} className="cart-item">
                        <div className="item-info">
                          <h4>{item.product.name}</h4>
                          <p>${item.price} x {item.quantity}</p>
                        </div>
                        <div className="item-total">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                    
                    <div className="cart-total">
                      <strong>Total: ${getFinalTotal().toFixed(2)}</strong>
                    </div>
                  </div>
                )}
                
                {errors.cart && (
                  <div className="error-message">
                    {errors.cart}
                  </div>
                )}
              </div>

              {/* Información del cliente */}
              <div className="client-section">
                <h3>
                  <FaUser />
                  Información del Cliente
                </h3>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      <FaUser />
                      Nombre *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={clientInfo.name}
                      onChange={handleInputChange}
                      placeholder="Nombre completo"
                    />
                    {errors.name && <span className="error">{errors.name}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label>
                      <FaEnvelope />
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={clientInfo.email}
                      onChange={handleInputChange}
                      placeholder="email@ejemplo.com"
                    />
                    {errors.email && <span className="error">{errors.email}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label>
                      <FaPhone />
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={clientInfo.phone}
                      onChange={handleInputChange}
                      placeholder="+52 55 1234 5678"
                    />
                    {errors.phone && <span className="error">{errors.phone}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label>
                      <FaHome />
                      Dirección
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={clientInfo.address}
                      onChange={handleInputChange}
                      placeholder="Dirección completa"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Ciudad</label>
                    <input
                      type="text"
                      name="city"
                      value={clientInfo.city}
                      onChange={handleInputChange}
                      placeholder="Ciudad"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>País</label>
                    <input
                      type="text"
                      name="country"
                      value={clientInfo.country}
                      onChange={handleInputChange}
                      placeholder="País"
                    />
                  </div>
                </div>
              </div>

              {/* Método de pago */}
              <div className="payment-section">
                <h3>
                  <FaCreditCard />
                  Método de Pago
                </h3>
                
                <PaymentMethodSelector
                  selectedMethod={selectedPaymentMethod}
                  onMethodChange={handlePaymentMethodChange}
                  amount={getFinalTotal()}
                  currency="MXN"
                  showStripeForm={showStripeForm}
                  onStripePayment={handleStripePayment}
                  customerEmail={clientInfo.email}
                  customerName={clientInfo.name}
                  metadata={{
                    client_name: clientInfo.name,
                    client_email: clientInfo.email
                  }}
                />
                
                {showStripeForm && selectedPaymentMethod?.code === 'stripe' && (
                  <div className="stripe-form-container">
                    <StripePaymentForm
                      amount={getFinalTotal()}
                      currency="MXN"
                      customerEmail={clientInfo.email}
                      customerName={clientInfo.name}
                      onSuccess={handleStripeSuccess}
                      onError={handleStripeError}
                      metadata={{
                        client_name: clientInfo.name,
                        client_email: clientInfo.email
                      }}
                    />
                  </div>
                )}
                
                {errors.payment && (
                  <div className="error-message">
                    {errors.payment}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="new-sale-actions">
            <button type="button" className="btn-secondary" onClick={handleClose}>
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading || selectedPaymentMethod?.code === 'stripe'}
            >
              {loading ? 'Procesando...' : 'Crear Venta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewSaleModal;
