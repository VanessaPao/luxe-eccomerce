import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import AuthModal from './Modals/AuthModal';
import './ProductCard.css';

/**
 * ProductCard — Premium fashion store card
 * Props: product { id, name, category, price, image, sale, salePrice }, isFav, onToggleFav
 */
export default function ProductCard({ product, isFav, onToggleFav }) {
  const { id, name, category, price, image } = product;
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [addedAnim, setAddedAnim] = useState(false);

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
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 800);
  };

  const handleQuickView = (e) => {
    e.stopPropagation();
    navigate(`/productos/${id}`);
  };

  const hasSale = product.sale && product.salePrice != null;

  return (
    <>
      <article className="pc-card" onClick={handleCardClick}>
        {/* ── Image Area ── */}
        <div className="pc-image-wrap">
          <img src={image} alt={name} className="pc-image" loading="lazy" />

          {/* Overlay on hover */}
          <div className="pc-overlay" />

          {/* Sale badge */}
          {hasSale && <span className="pc-badge">SALE</span>}

          {/* Floating action buttons — centered on image */}
          <div className="pc-actions">
            <button
              className="pc-action-btn"
              onClick={handleQuickView}
              aria-label="Vista rápida"
              title="Vista rápida"
            >
              <Eye size={17} strokeWidth={1.8} />
            </button>
            <button
              className={`pc-action-btn ${isFav ? 'pc-fav-active' : ''}`}
              onClick={handleFavoriteClick}
              aria-label={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              title={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            >
              <Heart size={17} strokeWidth={1.8} fill={isFav ? 'currentColor' : 'none'} />
            </button>
            <button
              className={`pc-action-btn ${addedAnim ? 'pc-added' : ''}`}
              onClick={handleAddToCart}
              aria-label="Añadir al carrito"
              title="Añadir al carrito"
            >
              <ShoppingBag size={17} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* ── Info Area ── */}
        <div className="pc-info">
          <p className="pc-category">{category || 'LUXE'}</p>
          <h3 className="pc-name">{name}</h3>
          <div className="pc-price-row">
            {hasSale ? (
              <>
                <span className="pc-price pc-price-sale">${product.salePrice}</span>
                <span className="pc-price-original">${price}</span>
              </>
            ) : (
              <span className="pc-price">${price}</span>
            )}
          </div>
        </div>
      </article>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </>
  );
}
