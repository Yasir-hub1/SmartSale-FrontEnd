import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { FaCreditCard, FaSpinner, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import paymentService from '../../services/paymentService';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import '../../utils/envTest'; // Importar para verificar variables de entorno
import './StripePaymentForm.css';

// Componente interno para el formulario de pago
const PaymentForm = ({ 
  amount, 
  currency = 'MXN', 
  customerEmail, 
  customerName, 
  onSuccess, 
  onError,
  metadata = {} 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { handleApiError, handleSuccess } = useErrorHandler();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    if (event) event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[StripePaymentForm] Iniciando proceso de pago...');
      console.log('[StripePaymentForm] Datos:', { amount, currency, customerEmail, customerName, metadata });
      
      // Crear Payment Intent
      const paymentIntentData = await paymentService.createPaymentIntent(
        amount,
        currency,
        customerEmail,
        customerName,
        metadata
      );
      
      console.log('[StripePaymentForm] Payment Intent creado:', paymentIntentData);

      // Confirmar pago
      console.log('[StripePaymentForm] Confirmando pago con Stripe...');
      const { error: stripeError } = await stripe.confirmCardPayment(
        paymentIntentData.client_secret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              email: customerEmail,
              name: customerName,
            },
          }
        }
      );
      
      console.log('[StripePaymentForm] Resultado de confirmación:', { stripeError });

      if (stripeError) {
        console.error('[StripePaymentForm] Error de Stripe:', stripeError);
        setError(stripeError.message);
        onError && onError(stripeError);
      } else {
        console.log('[StripePaymentForm] Pago exitoso!');
        setSuccess(true);
        handleSuccess('Pago procesado exitosamente');
        onSuccess && onSuccess(paymentIntentData);
      }
    } catch (error) {
      console.error('Error procesando pago:', error);
      const errorMessage = error.message || 'Error procesando el pago';
      setError(errorMessage);
      onError && onError(error);
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#2c3e50',
        fontFamily: 'Inter, system-ui, sans-serif',
        '::placeholder': {
          color: '#7f8c8d',
        },
      },
      invalid: {
        color: '#e74c3c',
      },
    },
    hidePostalCode: false,
  };

  if (success) {
    return (
      <div className="payment-success">
        <FaCheck className="success-icon" />
        <h3>¡Pago Exitoso!</h3>
        <p>Tu pago ha sido procesado correctamente.</p>
      </div>
    );
  }

  return (
    <div className="stripe-payment-form">
      <div className="payment-header">
        <h3>
          <FaCreditCard />
          Información de Pago
        </h3>
        <div className="payment-amount">
          {currency} ${amount.toFixed(2)}
        </div>
      </div>

      <div className="card-element-container">
        <label htmlFor="card-element">Datos de la Tarjeta</label>
        <CardElement
          id="card-element"
          options={cardElementOptions}
          className="card-element"
        />
      </div>

      {error && (
        <div className="payment-error">
          <FaExclamationTriangle />
          {error}
        </div>
      )}

      <div className="payment-actions">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!stripe || loading}
          className="pay-button"
        >
          {loading ? (
            <>
              <FaSpinner className="spinner" />
              Procesando...
            </>
          ) : (
            <>
              <FaCreditCard />
              Pagar ${amount.toFixed(2)}
            </>
          )}
        </button>
      </div>

      <div className="payment-security">
        <p>
          🔒 Tus datos están protegidos con encriptación SSL de 256 bits
        </p>
        <p>
          💳 Aceptamos Visa, Mastercard, American Express y más
        </p>
      </div>
    </div>
  );
};

// Componente principal con Elements
const StripePaymentForm = ({ 
  amount, 
  currency = 'MXN', 
  customerEmail, 
  customerName, 
  onSuccess, 
  onError,
  metadata = {} 
}) => {
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        const stripeKey = process.env.REACT_APP_STRIPE_PUBLIC_KEY;
        console.log('[StripePaymentForm] Clave de Stripe:', stripeKey ? 'Presente' : 'No encontrada');
        
        if (!stripeKey) {
          console.error('[StripePaymentForm] REACT_APP_STRIPE_PUBLIC_KEY no está configurada');
          return;
        }
        
        const stripe = await loadStripe(stripeKey);
        setStripePromise(stripe);
        console.log('[StripePaymentForm] Stripe inicializado correctamente');
      } catch (error) {
        console.error('Error cargando Stripe:', error);
      }
    };

    initializeStripe();
  }, []);

  if (!stripePromise) {
    return (
      <div className="stripe-loading">
        <FaSpinner className="spinner" />
        <p>Cargando sistema de pagos...</p>
      </div>
    );
  }

  return (
    <Elements 
      stripe={stripePromise} 
      options={{
        appearance: paymentService.getStripeConfig().appearance,
        locale: 'es'
      }}
    >
      <PaymentForm
        amount={amount}
        currency={currency}
        customerEmail={customerEmail}
        customerName={customerName}
        onSuccess={onSuccess}
        onError={onError}
        metadata={metadata}
      />
    </Elements>
  );
};

export default StripePaymentForm;
