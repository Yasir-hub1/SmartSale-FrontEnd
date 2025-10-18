// Servicio de pagos con Stripe
import { loadStripe } from '@stripe/stripe-js';
import api from './api';

// Verificar que la clave de Stripe esté disponible
const STRIPE_PUBLIC_KEY = process.env.REACT_APP_STRIPE_PUBLIC_KEY;

if (!STRIPE_PUBLIC_KEY) {
  console.warn('[PaymentService] REACT_APP_STRIPE_PUBLIC_KEY no está configurada');
}

// Cargar Stripe solo si la clave está disponible
const stripePromise = STRIPE_PUBLIC_KEY ? loadStripe(STRIPE_PUBLIC_KEY) : null;

class PaymentService {
  constructor() {
    this.stripe = null;
    this.initializeStripe();
  }

  async initializeStripe() {
    try {
      if (!stripePromise) {
        console.warn('[PaymentService] Stripe no disponible - clave no configurada');
        return;
      }
      this.stripe = await stripePromise;
      console.log('[PaymentService] Stripe inicializado correctamente');
    } catch (error) {
      console.error('[PaymentService] Error inicializando Stripe:', error);
    }
  }

  // Crear Payment Intent
  async createPaymentIntent(amount, currency = 'MXN', customerEmail = null, customerName = null, metadata = {}) {
    try {
      const response = await api.post('/payments/stripe/create-intent/', {
        amount,
        currency,
        customer_email: customerEmail,
        customer_name: customerName,
        metadata
      });

      return response.data;
    } catch (error) {
      console.error('[PaymentService] Error creando Payment Intent:', error);
      throw new Error('Error creando intención de pago');
    }
  }

  // Confirmar pago
  async confirmPayment(paymentIntentId) {
    try {
      const response = await api.post('/payments/stripe/confirm/', {
        payment_intent_id: paymentIntentId
      });

      return response.data;
    } catch (error) {
      console.error('[PaymentService] Error confirmando pago:', error);
      throw new Error('Error confirmando pago');
    }
  }

  // Obtener estado de pago
  async getPaymentStatus(paymentId) {
    try {
      const response = await api.get(`/payments/payments/${paymentId}/status/`);
      return response.data;
    } catch (error) {
      console.error('[PaymentService] Error obteniendo estado de pago:', error);
      throw new Error('Error obteniendo estado de pago');
    }
  }

  // Procesar pago de venta
  async processSalePayment(saleId, paymentMethod, customerEmail = null, customerName = null) {
    try {
      const response = await api.post(`/payments/sales/${saleId}/process/`, {
        payment_method: paymentMethod,
        customer_email: customerEmail,
        customer_name: customerName
      });

      return response.data;
    } catch (error) {
      console.error('[PaymentService] Error procesando pago de venta:', error);
      throw new Error('Error procesando pago');
    }
  }

  // Obtener métodos de pago disponibles
  async getPaymentMethods() {
    try {
      const response = await api.get('/payments/methods/available/');
      return response.data;
    } catch (error) {
      console.error('[PaymentService] Error obteniendo métodos de pago:', error);
      throw new Error('Error obteniendo métodos de pago');
    }
  }

  // Crear reembolso
  async createRefund(paymentId, amount = null, reason = null) {
    try {
      const response = await api.post(`/payments/payments/${paymentId}/refund/`, {
        amount,
        reason
      });

      return response.data;
    } catch (error) {
      console.error('[PaymentService] Error creando reembolso:', error);
      throw new Error('Error creando reembolso');
    }
  }

  // Procesar pago con Stripe Elements
  async processStripePayment(paymentIntent, elements, confirmParams = {}) {
    try {
      if (!this.stripe) {
        throw new Error('Stripe no está inicializado');
      }

      const { error } = await this.stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/tienda/payment/result`,
          ...confirmParams
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      console.error('[PaymentService] Error procesando pago con Stripe:', error);
      throw error;
    }
  }

  // Obtener cliente de Stripe
  getStripe() {
    return this.stripe;
  }

  // Verificar si Stripe está disponible
  isStripeAvailable() {
    return this.stripe !== null;
  }

  // Formatear monto para Stripe (convertir a centavos)
  formatAmountForStripe(amount) {
    return Math.round(amount * 100);
  }

  // Formatear monto desde Stripe (convertir desde centavos)
  formatAmountFromStripe(amount) {
    return amount / 100;
  }

  // Validar tarjeta
  async validateCard(cardElement) {
    try {
      if (!this.stripe) {
        throw new Error('Stripe no está inicializado');
      }

      const { error } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        return { valid: false, error: error.message };
      }

      return { valid: true };
    } catch (error) {
      console.error('[PaymentService] Error validando tarjeta:', error);
      return { valid: false, error: error.message };
    }
  }

  // Obtener configuración de Stripe
  getStripeConfig() {
    return {
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#3498db',
          colorBackground: '#ffffff',
          colorText: '#2c3e50',
          colorDanger: '#e74c3c',
          fontFamily: 'Inter, system-ui, sans-serif',
          spacingUnit: '4px',
          borderRadius: '8px',
        },
        rules: {
          '.Input': {
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '12px',
          },
          '.Input:focus': {
            border: '2px solid #3498db',
            boxShadow: '0 0 0 3px rgba(52, 152, 219, 0.1)',
          },
          '.Label': {
            fontWeight: '600',
            color: '#2c3e50',
          },
          '.Error': {
            color: '#e74c3c',
            fontSize: '14px',
          },
        }
      },
      locale: 'es'
    };
  }
}

// Crear instancia singleton
const paymentService = new PaymentService();

export default paymentService;
console.log('Stripe Key:', process.env.REACT_APP_STRIPE_PUBLIC_KEY);
