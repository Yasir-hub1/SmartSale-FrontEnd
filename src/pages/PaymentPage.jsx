// Página de pago
import React, { useState } from 'react';
import { FaCreditCard, FaDollarSign, FaCheck, FaSync } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { useOffline } from '../context/OfflineContext';
import './PaymentPage.css';

const PaymentPage = () => {
  const { total, items, clearCart } = useCart();
  const { isOfflineMode } = useOffline();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Simular procesamiento de pago
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Limpiar carrito
      await clearCart();
      
      // Mostrar confirmación
      alert('Pago procesado exitosamente');
      
      // Redirigir a dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error procesando pago:', error);
      alert('Error procesando el pago');
    } finally {
      setIsProcessing(false);
    }
  };

  const subtotal = total;
  const tax = total * 0.16;
  const totalAmount = subtotal + tax;

  return (
    <div className="payment-page">
      <div className="page-header">
        <h1>Procesar Pago</h1>
        <p>Completa tu compra</p>
      </div>

      {/* Indicador offline */}
      {isOfflineMode && (
        <div className="offline-indicator">
          <span>📱 Solo pagos en efectivo disponibles offline</span>
        </div>
      )}

      <div className="payment-content">
        {/* Resumen del pedido */}
        <div className="order-summary">
          <h3>Resumen del Pedido</h3>
          <div className="items-list">
            {items.map((item) => (
              <div key={item.id} className="order-item">
                <div className="item-info">
                  <span className="item-name">{item.product_name}</span>
                  <span className="item-quantity">x{item.quantity}</span>
                </div>
                <span className="item-price">${item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
          
          <div className="order-totals">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>IVA (16%):</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="total-row total">
              <span>Total:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Métodos de pago */}
        <div className="payment-methods">
          <h3>Método de Pago</h3>
          
          <div className="method-options">
            <div 
              className={`method-option ${paymentMethod === 'cash' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('cash')}
            >
              <div className="method-icon">
                <FaDollarSign />
              </div>
              <div className="method-info">
                <h4>Efectivo</h4>
                <p>Pago en efectivo</p>
              </div>
              <div className="method-radio">
                <input 
                  type="radio" 
                  name="payment" 
                  value="cash" 
                  checked={paymentMethod === 'cash'}
                  onChange={() => setPaymentMethod('cash')}
                />
              </div>
            </div>

            <div 
              className={`method-option ${paymentMethod === 'card' ? 'selected' : ''} ${isOfflineMode ? 'disabled' : ''}`}
              onClick={() => !isOfflineMode && setPaymentMethod('card')}
            >
              <div className="method-icon">
                <FaCreditCard />
              </div>
              <div className="method-info">
                <h4>Tarjeta de Crédito</h4>
                <p>Pago con tarjeta</p>
                {isOfflineMode && <span className="offline-note">Requiere conexión</span>}
              </div>
              <div className="method-radio">
                <input 
                  type="radio" 
                  name="payment" 
                  value="card" 
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  disabled={isOfflineMode}
                />
              </div>
            </div>
          </div>

          {/* Formulario de pago */}
          {paymentMethod === 'card' && !isOfflineMode && (
            <div className="card-form">
              <h4>Información de la Tarjeta</h4>
              <div className="form-group">
                <label>Número de tarjeta</label>
                <input type="text" placeholder="1234 5678 9012 3456" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Fecha de vencimiento</label>
                  <input type="text" placeholder="MM/AA" />
                </div>
                <div className="form-group">
                  <label>CVV</label>
                  <input type="text" placeholder="123" />
                </div>
              </div>
            </div>
          )}

          {/* Botón de pago */}
          <button
            className="payment-btn"
            onClick={handlePayment}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <FaSync className="spinning" />
                Procesando...
              </>
            ) : (
              <>
                <FaCheck />
                {paymentMethod === 'cash' ? 'Confirmar Pago' : 'Procesar Pago'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
