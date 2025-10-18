// Página del carrito de compras
import React from 'react';
import { useCart } from '../context/CartContext';
import { useOffline } from '../context/OfflineContext';
import { FaShoppingCart, FaTrash, FaPlus, FaMinus, FaCreditCard } from 'react-icons/fa';
import './CartPage.css';

const CartPage = () => {
  const { 
    items, 
    total, 
    itemCount, 
    isEmpty, 
    removeItem, 
    updateQuantity, 
    clearCart 
  } = useCart();
  
  const { isOfflineMode } = useOffline();

  const handleQuantityChange = async (productId, newQuantity) => {
    try {
      await updateQuantity(productId, newQuantity);
    } catch (error) {
      console.error('[CartPage] Error actualizando cantidad:', error);
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      await removeItem(productId);
    } catch (error) {
      console.error('[CartPage] Error removiendo item:', error);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      try {
        await clearCart();
      } catch (error) {
        console.error('[CartPage] Error limpiando carrito:', error);
      }
    }
  };

  const handleCheckout = () => {
    // Navegar a la página de pago
    window.location.href = '/payment';
  };

  return (
    <div className="cart-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1>Carrito de Compras</h1>
          <p>{itemCount} productos en el carrito</p>
        </div>
        {!isEmpty && (
          <div className="header-right">
            <button 
              className="btn-danger"
              onClick={handleClearCart}
            >
              <FaTrash />
              Vaciar Carrito
            </button>
          </div>
        )}
      </div>

      {/* Indicador offline */}
      {isOfflineMode && (
        <div className="offline-indicator">
          <span>📱 Carrito guardado localmente</span>
        </div>
      )}

      {isEmpty ? (
        /* Estado vacío */
        <div className="empty-cart">
          <div className="empty-icon">
            <FaShoppingCart />
          </div>
          <h3>Tu carrito está vacío</h3>
          <p>Agrega algunos productos para comenzar tu compra</p>
          <button 
            className="btn-primary"
            onClick={() => window.location.href = '/products'}
          >
            Ver Productos
          </button>
        </div>
      ) : (
        <div className="cart-content">
          {/* Lista de items */}
          <div className="cart-items">
            {items.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="item-image">
                  <div className="placeholder-image">📦</div>
                </div>
                
                <div className="item-info">
                  <h3 className="item-name">{item.product_name}</h3>
                  <p className="item-sku">SKU: {item.product_sku}</p>
                  <p className="item-price">${item.unit_price}</p>
                </div>
                
                <div className="item-quantity">
                  <button
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <FaMinus />
                  </button>
                  <span className="quantity-value">{item.quantity}</span>
                  <button
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                  >
                    <FaPlus />
                  </button>
                </div>
                
                <div className="item-subtotal">
                  <span className="subtotal-value">${item.subtotal.toFixed(2)}</span>
                </div>
                
                <div className="item-actions">
                  <button
                    className="remove-btn"
                    onClick={() => handleRemoveItem(item.product_id)}
                    title="Eliminar del carrito"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen del carrito */}
          <div className="cart-summary">
            <div className="summary-header">
              <h3>Resumen del Pedido</h3>
            </div>
            
            <div className="summary-details">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>IVA (16%):</span>
                <span>${(total * 0.16).toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <span>Total:</span>
                <span>${(total * 1.16).toFixed(2)}</span>
              </div>
            </div>
            
            <div className="summary-actions">
              <button 
                className="btn-primary checkout-btn"
                onClick={handleCheckout}
              >
                <FaCreditCard />
                Proceder al Pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
