import React, { useState } from 'react';
import { FaCreditCard, FaUser, FaEnvelope, FaPhone, FaTimes, FaCheck } from 'react-icons/fa';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { cartService } from '../../services/api';
import PaymentMethodSelector from '../payment/PaymentMethodSelector';
import StripePaymentForm from '../payment/StripePaymentForm';
import './CheckoutModal.css';

const CheckoutModal = ({ isOpen, onClose, cart, onSuccess }) => {
  const { handleApiError, handleSuccess } = useErrorHandler();
  const [loading, setLoading] = useState(false);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClientInfo(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod(method);
    setPaymentMethod(method.code);
    setShowStripeForm(method.code === 'stripe');
  };

  const handleStripeSuccess = async (paymentData) => {
    try {
      console.log('[CheckoutModal] Pago exitoso con Stripe:', paymentData);
      
      // Después del pago exitoso con Stripe, procesar el checkout
      console.log('[CheckoutModal] Procesando checkout con datos:', {
        client: clientInfo,
        payment_method: 'stripe',
        stripe_payment_intent_id: paymentData.payment_intent_id
      });
      
      const response = await cartService.checkout(
        clientInfo,
        'stripe',
        paymentData.payment_intent_id
      );
      
      console.log('[CheckoutModal] Checkout exitoso:', response);
      handleSuccess('¡Pago procesado exitosamente!');
      onSuccess(response);
      onClose();
    } catch (error) {
      console.error('[CheckoutModal] Error en checkout:', error);
      handleApiError(error, 'Procesar checkout después del pago');
    }
  };

  const handleStripeError = (error) => {
    handleApiError(error, 'Procesar pago con Stripe');
  };

  const handleStripePayment = (stripeData) => {
    return (
      <StripePaymentForm
        amount={getFinalTotal()}
        currency="MXN"
        customerEmail={clientInfo.email}
        customerName={clientInfo.name}
        onSuccess={handleStripeSuccess}
        onError={handleStripeError}
        metadata={{
          cart_id: cart.id,
          client_name: clientInfo.name,
          client_email: clientInfo.email
        }}
      />
    );
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
      // Para métodos de pago no-Stripe (efectivo, transferencia)
      const response = await cartService.checkout(
        clientInfo,
        selectedPaymentMethod.code
      );
      
      handleSuccess('¡Compra realizada exitosamente!');
      onSuccess(response);
      onClose();
      
    } catch (error) {
      handleApiError(error, 'Procesar compra');
    } finally {
      setLoading(false);
    }
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

  if (!isOpen) return null;

  return (
    <div className="checkout-modal-overlay">
      <div className="checkout-modal">
        <div className="checkout-header">
          <h2>🛒 Finalizar Compra</h2>
          <button onClick={onClose} className="close-btn">
            <FaTimes />
          </button>
        </div>

        <div className="checkout-content">
          {/* Resumen del carrito */}
          <div className="cart-summary">
            <h3>Resumen de tu compra</h3>
            <div className="cart-items">
              {cart.items.map((item, index) => (
                <div key={item.id || item.product_id || index} className="summary-item">
                  <div className="item-info">
                    <h4>{item.product?.name || item.product_name}</h4>
                    <p>Cantidad: {item.quantity}</p>
                  </div>
                  <div className="item-price">
                    ${((item.price || item.unit_price) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            
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

          {/* Formulario de información del cliente */}
          <div className="checkout-form">
            <div className="form-section">
              <h3>
                <FaUser />
                Información del Cliente
              </h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Nombre completo *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={clientInfo.name}
                    onChange={handleInputChange}
                    className={errors.name ? 'error' : ''}
                    placeholder="Ingresa tu nombre completo"
                  />
                  {errors.name && <span className="error-message">{errors.name}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={clientInfo.email}
                    onChange={handleInputChange}
                    className={errors.email ? 'error' : ''}
                    placeholder="tu@email.com"
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Teléfono *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={clientInfo.phone}
                    onChange={handleInputChange}
                    className={errors.phone ? 'error' : ''}
                    placeholder="+52 55 1234 5678"
                  />
                  {errors.phone && <span className="error-message">{errors.phone}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="address">Dirección</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={clientInfo.address}
                    onChange={handleInputChange}
                    placeholder="Calle, número, colonia"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">Ciudad</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={clientInfo.city}
                    onChange={handleInputChange}
                    placeholder="Ciudad"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="country">País</label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={clientInfo.country}
                    onChange={handleInputChange}
                    placeholder="País"
                  />
                </div>
              </div>
            </div>

            {/* Método de pago */}
            <div className="form-section">
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
                  cart_id: cart.id,
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
                      cart_id: cart.id,
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

            {/* Botones */}
            <div className="checkout-actions">
              <button
                type="button"
                onClick={onClose}
                className="cancel-btn"
                disabled={loading}
              >
                Cancelar
              </button>
              
              <button
                type="button"
                onClick={handleSubmit}
                className="confirm-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <FaCheck />
                    Confirmar Compra
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
