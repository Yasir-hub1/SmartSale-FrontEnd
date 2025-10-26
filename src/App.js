import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// Contextos
import { AuthProvider } from './context/AuthContext';
import { OfflineProvider } from './context/OfflineContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider, NotificationContainer } from './components/common/NotificationSystem';

// Componentes
import Layout from './components/layout/Layout';
import OnlineStatusIndicator from './components/common/OnlineStatusIndicator';
import SyncButton from './components/common/SyncButton';
import OfflineWarning from './components/common/OfflineWarning';
import AuthManager from './components/auth/AuthManager';
import SimpleErrorBoundary from './components/debug/SimpleErrorBoundary';

// Páginas
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ClientsPage from './pages/ClientsPage';
import CartPage from './pages/CartPage';
import SalesPage from './pages/SalesPage';
import DashboardPage from './pages/DashboardPage';
import ReportsPage from './pages/ReportsPage';
import PaymentPage from './pages/PaymentPage';
import ShopPage from './pages/ShopPage';
import PublicShopPage from './pages/PublicShopPage';
import PublicHomePage from './pages/PublicHomePage';
import SalesPredictionDashboard from './pages/SalesPredictionDashboard';

// Servicios
import indexedDBService from './services/indexedDBService';

// Estilos
import './App.css';

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);

  // Inicializar servicios
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('[App] Inicializando Ventas Inteligentes en Línea...');
        
        // Inicializar IndexedDB
        const dbInitialized = await indexedDBService.initialize();
        if (!dbInitialized) {
          throw new Error('Error inicializando base de datos local');
        }

        // Registrar Service Worker
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('[App] Service Worker registrado:', registration);
          } catch (error) {
            console.warn('[App] Error registrando Service Worker:', error);
          }
        }

        // Limpiar caché expirado
        await indexedDBService.clearExpiredCache();

        console.log('[App] Aplicación inicializada correctamente');
        setIsInitialized(true);
      } catch (error) {
        console.error('[App] Error inicializando aplicación:', error);
        setInitError(error.message);
        setIsInitialized(true); // Permitir que la app funcione aunque haya errores
      }
    };

    initializeApp();
  }, []);

  // Mostrar pantalla de carga
  if (!isInitialized) {
    return (
      <div className="app-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Ventas Inteligentes</h2>
          <p>Inicializando aplicación...</p>
          {initError && (
            <div className="init-error">
              <p>Error: {initError}</p>
              <p>La aplicación funcionará en modo limitado</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <SimpleErrorBoundary>
      <NotificationProvider>
        <AuthProvider>
          <OfflineProvider>
            <CartProvider>
              <Router>
                <AuthManager>
                <div className="App">
                  <NotificationContainer />
                  {/* Rutas */}
                        <Routes>
                          <Route path="/login" element={<LoginPage />} />
                          <Route path="/" element={
                            <Layout>
                              <HomePage />
                            </Layout>
                          } />
                          <Route path="/shop" element={
                            <Layout>
                              <ShopPage />
                            </Layout>
                          } />
                          <Route path="/tienda" element={<PublicShopPage />} />
                          <Route path="/public" element={<PublicHomePage />} />
                          <Route path="/products" element={
                            <Layout>
                              <ProductsPage />
                            </Layout>
                          } />
                          <Route path="/clients" element={
                            <Layout>
                              <ClientsPage />
                            </Layout>
                          } />
                          <Route path="/cart" element={
                            <Layout>
                              <CartPage />
                            </Layout>
                          } />
                          <Route path="/sales" element={
                            <Layout>
                              <SalesPage />
                            </Layout>
                          } />
                          <Route path="/dashboard" element={
                            <Layout>
                              <DashboardPage />
                            </Layout>
                          } />
                          <Route path="/reports" element={
                            <Layout>
                              <ReportsPage />
                            </Layout>
                          } />
                          <Route path="/payment" element={
                            <Layout>
                              <PaymentPage />
                            </Layout>
                          } />
                          <Route path="/sales-prediction" element={
                            <Layout>
                              <SalesPredictionDashboard />
                            </Layout>
                          } />
                        </Routes>
            
            {/* Toast notifications - Temporalmente deshabilitado */}
            {/* <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            /> */}
                </div>
              </AuthManager>
            </Router>
          </CartProvider>
        </OfflineProvider>
      </AuthProvider>
      </NotificationProvider>
    </SimpleErrorBoundary>
  );
}

export default App;
