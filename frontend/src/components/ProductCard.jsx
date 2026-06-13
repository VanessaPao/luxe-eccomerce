import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from './Modals/AuthModal';

/** HeartIcon */
function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        fill={filled ? '#e63946' : 'none'}
        stroke={filled ? '#e63946' : '#fff'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** CartIcon */
function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <path
        d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"
        fill="none"
        stroke="#111"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="3" y1="6" x2="21" y2="6" stroke="#111" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M16 10a4 4 0 0 1-8 0"
        fill="none"
        stroke="#111"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * ProductCard
 * Props: product { id, name, category, price, image }, isFav, onToggleFav
 */
export default function ProductCard({ product, isFav, onToggleFav }) {
  const { id, name, category, price, image } = product;
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Navega a la página de detalle usando el ID del producto.
  // React Router actualiza la URL a /productos/:id sin recargar la página.
  const handleCardClick = () => {
    navigate(`/productos/${id}`);
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (!user) {
      setShowAuthModal(true);
    } else {
      onToggleFav(id);
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addItem(product);
  };

  return (
    <>
      <article className="product-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
        {/* Image */}
        <div className="product-image-wrapper">
          <img src={image} alt={name} className="product-image" />

          {/* Heart button — top right */}
          <button
            className={`btn-favourite${isFav ? ' active' : ''}`}
            onClick={handleFavoriteClick}
            aria-label={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            title={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          >
            <HeartIcon filled={isFav} />
          </button>
        </div>

        {/* Body — blur + white text */}
        <div className="product-body">
          <div className="product-body-info">
            <h4 className="product-name">{name}</h4>
            <p className="product-category">{category}</p>
            {product.sale && product.salePrice !== undefined && product.salePrice !== null ? (
              <p className="product-price">
                <span className="sale-price" style={{ color: '#ffd700', fontWeight: 'bold' }}>
                  ${product.salePrice}
                </span>{' '}
                <span className="original-price" style={{ textDecoration: 'line-through', opacity: 0.5, fontSize: '0.85em', marginLeft: '6px' }}>
                  ${price}
                </span>
              </p>
            ) : (
              <p className="product-price">${price}</p>
            )}
          </div>

          {/* Cart button — white circle, black icon */}
          <button
            className="btn-cart"
            aria-label="Añadir al carrito"
            title="Añadir al carrito"
            onClick={handleAddToCart}
          >
            <CartIcon />
          </button>
        </div>
      </article>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </>
  );
}