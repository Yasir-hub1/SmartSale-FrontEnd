import React, { useState, useEffect } from 'react';
import { FaCreditCard, FaMoneyBillWave, FaUniversity, FaCheck } from 'react-icons/fa';
import './PaymentMethodSelector.css';

const TestPaymentMethodSelector = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga de métodos de pago
    setTimeout(() => {
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
      setLoading(false);
    }, 1000);
  }, []);

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

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
  };

  if (loading) {
    return (
      <div className="payment-methods-loading">
        <div className="loading-spinner"></div>
        <p>Cargando métodos de pago...</p>
      </div>
    );
  }

  return (
    <div className="payment-method-selector">
      <div className="selector-header">
        <h3>Selecciona tu método de pago</h3>
        <div className="payment-amount">
          Total: MXN $100.00
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
                <p>{method.description}</p>
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
            <p>{selectedMethod.description}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestPaymentMethodSelector;
