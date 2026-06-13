import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import CheckoutAuthModal from '../../components/Modals/CheckoutAuthModal';
import './Cart.css';

export default function Cart() {
  const { items, removeItem, updateQty, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Al presionar "Proceder al pago", verificamos si el usuario está autenticado
  const handleCheckoutClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      navigate('/checkout');
    }
  };

  // Si el usuario se autentica mientras el modal está abierto, redirigir automáticamente
  useEffect(() => {
    if (user && showAuthModal) {
      setShowAuthModal(false);
      navigate('/checkout');
    }
  }, [user, showAuthModal, navigate]);

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <h1 className="cart-title">Tu Carrito</h1>
        <div className="cart-empty">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"
              stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="3" y1="6" x2="21" y2="6" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M16 10a4 4 0 0 1-8 0" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p>Tu carrito está vacío</p>
          <a href="/" className="cart-shop-link">Explorar productos</a>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1 className="cart-title">Tu Carrito <span className="cart-count">({items.length})</span></h1>

      <div className="cart-layout">
        {/* Items */}
        <ul className="cart-list">
          {items.map((item) => (
            <li key={item.productId || item.id} className="cart-item">
              <img src={item.image} alt={item.name} className="cart-item-img" />
              <div className="cart-item-info">
                <h3 className="cart-item-name">{item.name}</h3>
                <p className="cart-item-price">${item.price}</p>
              </div>
              <div className="cart-item-qty">
                <button onClick={() => updateQty(item.productId || item.id, (item.quantity || 1) - 1)}>−</button>
                <span>{item.quantity || 1}</span>
                <button onClick={() => updateQty(item.productId || item.id, (item.quantity || 1) + 1)}>+</button>
              </div>
              <p className="cart-item-subtotal">${(item.price * (item.quantity || 1)).toFixed(2)}</p>
              <button
                className="cart-item-remove"
                onClick={() => removeItem(item.productId || item.id)}
                aria-label="Eliminar"
              >✕</button>
            </li>
          ))}
        </ul>

        {/* Summary */}
        <aside className="cart-summary">
          <h2>Resumen</h2>
          <div className="cart-summary-row">
            <span>Subtotal</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          <div className="cart-summary-row">
            <span>Envío</span>
            <span className="cart-free">Gratis</span>
          </div>
          <div className="cart-summary-total">
            <span>Total</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          <button className="cart-checkout-btn" onClick={handleCheckoutClick}>
            Proceder al pago
          </button>
          <button className="cart-clear-btn" onClick={clearCart}>
            Vaciar carrito
          </button>
        </aside>
      </div>

      {/* Modal de autenticación en checkout si el usuario no tiene sesión */}
      {showAuthModal && (
        <CheckoutAuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            navigate('/checkout');
          }}
        />
      )}
    </div>
  );
}
