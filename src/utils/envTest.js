// Archivo de prueba para verificar variables de entorno
console.log('=== VERIFICACIÓN DE VARIABLES DE ENTORNO ===');
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('REACT_APP_STRIPE_PUBLIC_KEY:', process.env.REACT_APP_STRIPE_PUBLIC_KEY);
console.log('REACT_APP_STRIPE_PUBLIC_KEY length:', process.env.REACT_APP_STRIPE_PUBLIC_KEY?.length);
console.log('REACT_APP_STRIPE_PUBLIC_KEY type:', typeof process.env.REACT_APP_STRIPE_PUBLIC_KEY);
console.log('==========================================');

export const ENV_TEST = {
  API_URL: process.env.REACT_APP_API_URL,
  STRIPE_KEY: process.env.REACT_APP_STRIPE_PUBLIC_KEY,
  STRIPE_KEY_LENGTH: process.env.REACT_APP_STRIPE_PUBLIC_KEY?.length,
  STRIPE_KEY_TYPE: typeof process.env.REACT_APP_STRIPE_PUBLIC_KEY
};
