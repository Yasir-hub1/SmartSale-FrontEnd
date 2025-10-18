import React from 'react';
import { FaStore, FaShoppingCart, FaUsers, FaChartLine, FaArrowRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './PublicHomePage.css';

const PublicHomePage = () => {
  return (
    <div className="public-home-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>Bienvenido a SmartSales365</h1>
          <p>Tu tienda online de confianza con los mejores productos y precios</p>
          <div className="hero-actions">
            <Link to="/tienda" className="btn-primary">
              <FaStore />
              Explorar Tienda
            </Link>
            <Link to="/tienda" className="btn-secondary">
              <FaShoppingCart />
              Ver Productos
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-illustration">
            🛍️
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <div className="container">
          <h2>¿Por qué elegir SmartSales365?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <FaStore />
              </div>
              <h3>Tienda Online</h3>
              <p>Explora nuestra amplia gama de productos desde la comodidad de tu hogar</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <FaShoppingCart />
              </div>
              <h3>Carrito Inteligente</h3>
              <p>Agrega productos fácilmente y gestiona tu compra de manera intuitiva</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <FaUsers />
              </div>
              <h3>Atención Personalizada</h3>
              <p>Recibe el mejor servicio al cliente y soporte personalizado</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <FaChartLine />
              </div>
              <h3>Precios Competitivos</h3>
              <p>Encuentra los mejores precios del mercado con ofertas exclusivas</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>¿Listo para comenzar a comprar?</h2>
            <p>Descubre nuestros productos y encuentra exactamente lo que necesitas</p>
            <Link to="/tienda" className="btn-cta">
              <FaArrowRight />
              Ir a la Tienda
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="public-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>SmartSales365</h3>
              <p>Tu tienda online de confianza</p>
            </div>
            
            <div className="footer-section">
              <h4>Enlaces Rápidos</h4>
              <ul>
                <li><Link to="/tienda">Tienda</Link></li>
                <li><Link to="/tienda">Productos</Link></li>
                <li><Link to="/tienda">Carrito</Link></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4>Contacto</h4>
              <p>📧 info@smartsales365.com</p>
              <p>📞 +52 55 1234 5678</p>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2024 SmartSales365. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicHomePage;
