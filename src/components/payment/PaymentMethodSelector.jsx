import React, { useState, useEffect } from 'react';
import { FaCreditCard, FaMoneyBillWave, FaUniversity, FaCheck } from 'react-icons/fa';
import paymentService from '../../services/paymentService';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import './PaymentMethodSelector.css';

const PaymentMethodSelector = ({ 
  selectedMethod, 
  onMethodChange, 
  amount, 
  currency = 'MXN',
  showStripeForm = false,
  onStripePayment = null,
  customerEmail = null,
  customerName = null,
  metadata = {}
}) => {
  const { handleApiError } = useErrorHandler();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      console.log('[PaymentMethodSelector] Cargando métodos de pago...');
      
      // Intentar cargar desde la API
      try {
        const methods = await paymentService.getPaymentMethods();
        console.log('[PaymentMethodSelector] Métodos cargados desde API:', methods);
        
        // Si la API devuelve un array vacío, usar métodos por defecto
        if (!methods || methods.length === 0) {
          console.log('[PaymentMethodSelector] API devolvió array vacío, usando métodos por defecto');
          const defaultMethods = [
            {
              id: 1,
              code: 'stripe',
              name: 'Tarjeta de Crédito/Débito',
              is_active: true,
              description: 'Pago seguro con tarjeta'
            },
            {
              id: 2,
              code: 'cash',
              name: 'Efectivo',
              is_active: true,
              description: 'Pago en efectivo'
            },
            {
              id: 3,
              code: 'transfer',
              name: 'Transferencia Bancaria',
              is_active: true,
              description: 'Transferencia directa'
            }
          ];
          setPaymentMethods(defaultMethods);
        } else {
          setPaymentMethods(methods);
        }
      } catch (apiError) {
        console.warn('[PaymentMethodSelector] Error cargando desde API, usando métodos por defecto:', apiError);
        
        // Métodos de pago por defecto si la API falla
        const defaultMethods = [
          {
            id: 1,
            code: 'stripe',
            name: 'Tarjeta de Crédito/Débito',
            is_active: true,
            description: 'Pago seguro con tarjeta'
          },
          {
            id: 2,
            code: 'cash',
            name: 'Efectivo',
            is_active: true,
            description: 'Pago en efectivo'
          },
          {
            id: 3,
            code: 'transfer',
            name: 'Transferencia Bancaria',
            is_active: true,
            description: 'Transferencia directa'
          }
        ];
        
        console.log('[PaymentMethodSelector] Usando métodos por defecto:', defaultMethods);
        setPaymentMethods(defaultMethods);
      }
    } catch (error) {
      console.error('[PaymentMethodSelector] Error cargando métodos:', error);
      handleApiError(error, 'Cargar métodos de pago');
      
      // Fallback con métodos básicos
      const fallbackMethods = [
        {
          id: 1,
          code: 'cash',
          name: 'Efectivo',
          is_active: true,
          description: 'Pago en efectivo'
        }
      ];
      setPaymentMethods(fallbackMethods);
    } finally {
      setLoading(false);
    }
  };

  const getMethodIcon = (code) => {
    switch (code) {
      case 'stripe':
        return <FaCreditCard />;
      case 'cash':
        return <FaMoneyBillWave />;
      case 'transfer':
        return <FaUniversity />;
      default:
        return <FaCreditCard />;
    }
  };

  const getMethodDescription = (code) => {
    switch (code) {
      case 'stripe':
        return 'Pago seguro con tarjeta de crédito o débito';
      case 'cash':
        return 'Pago en efectivo al recibir el producto';
      case 'transfer':
        return 'Transferencia bancaria directa';
      default:
        return 'Método de pago disponible';
    }
  };

  const handleMethodSelect = (method) => {
    onMethodChange(method);
  };

  if (loading) {
    return (
      <div className="payment-methods-loading">
        <div className="loading-spinner"></div>
        <p>Cargando métodos de pago...</p>
      </div>
    );
  }

  console.log('[PaymentMethodSelector] Renderizando con métodos:', paymentMethods);

  return (
    <div className="payment-method-selector">
      <div className="selector-header">
        <h3>Selecciona tu método de pago</h3>
        <div className="payment-amount">
          Total: {currency} ${amount.toFixed(2)}
        </div>
      </div>

      <div className="payment-methods-grid">
        {paymentMethods.length > 0 ? (
          paymentMethods.map((method) => (
          <div
            key={method.id}
            className={`payment-method-card ${
              selectedMethod?.code === method.code ? 'selected' : ''
            } ${!method.is_active ? 'disabled' : ''}`}
            onClick={() => method.is_active && handleMethodSelect(method)}
          >
            <div className="method-icon">
              {getMethodIcon(method.code)}
            </div>
            
            <div className="method-info">
              <h4>{method.name}</h4>
              <p>{getMethodDescription(method.code)}</p>
            </div>

            {selectedMethod?.code === method.code && (
              <div className="method-selected">
                <FaCheck />
              </div>
            )}

            {!method.is_active && (
              <div className="method-disabled">
                <span>No disponible</span>
              </div>
            )}
          </div>
          ))
        ) : (
          <div className="no-payment-methods">
            <p>No hay métodos de pago disponibles</p>
          </div>
        )}
      </div>

      {selectedMethod && (
        <div className="selected-method-info">
          <div className="method-details">
            <h4>Método seleccionado: {selectedMethod.name}</h4>
            <p>{getMethodDescription(selectedMethod.code)}</p>
            
            {selectedMethod.code === 'stripe' && (
              <div className="stripe-info">
                <p>🔒 Pago 100% seguro con encriptación SSL</p>
                <p>💳 Aceptamos Visa, Mastercard, American Express</p>
                <p>⚡ Procesamiento instantáneo</p>
              </div>
            )}
            
            {selectedMethod.code === 'cash' && (
              <div className="cash-info">
                <p>💵 Pago al recibir el producto</p>
                <p>📦 Entrega en el momento de la compra</p>
                <p>✅ Sin comisiones adicionales</p>
              </div>
            )}
            
            {selectedMethod.code === 'transfer' && (
              <div className="transfer-info">
                <p>🏦 Transferencia bancaria directa</p>
                <p>📧 Te enviaremos los datos bancarios</p>
                <p>⏰ Procesamiento en 24-48 horas</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showStripeForm && selectedMethod?.code === 'stripe' && onStripePayment && (
        <div className="stripe-form-container">
          {onStripePayment({
            amount,
            currency,
            customerEmail,
            customerName,
            metadata
          })}
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;
