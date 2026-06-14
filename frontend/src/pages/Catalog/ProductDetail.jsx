import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useCallback, useEffect } from 'react';
import useProduct from '../../hooks/useProduct';
import { useCart } from '../../context/CartContext';
import Reviews from '../../components/Reviews';
import { Star } from 'lucide-react';
import './ProductDetail.css';

const SIZES = ['Grande', 'Mediano', 'Chico'];
const ZOOM_FACTOR = 2.5;
const LENS_SIZE = 180;

function getTouchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

export default function ProductDetail() {
  const { id } = useParams();
  const { product, loading, error } = useProduct(id);
  const { addItem } = useCart();
  const navigate = useNavigate();

  const [selectedSize, setSelectedSize] = useState(null);
  const [showSizeWarning, setShowSizeWarning] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [avgRating, setAvgRating] = useState(null);
  const [ratingCount, setRatingCount] = useState(0);

  // ── Inline zoom state ──
  const [lensActive, setLensActive] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [bgPos, setBgPos] = useState({ x: 0, y: 0 });
  const imageWrapRef = useRef(null);

  // ── Click-to-zoom (inline expanded) state ──
  const [clickZoomed, setClickZoomed] = useState(false);
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [clickZoomOrigin, setClickZoomOrigin] = useState({ x: 50, y: 50 });

  // ── Mobile pinch-to-zoom state ──
  const [mobileZoom, setMobileZoom] = useState(1);
  const [mobilePan, setMobilePan] = useState({ x: 0, y: 0 });
  const mobileTouchDist = useRef(0);
  const mobilePanStart = useRef({ x: 0, y: 0 });
  const mobilePanOffset = useRef({ x: 0, y: 0 });
  const isMobileDragging = useRef(false);

  const handleRatingChange = (avg, count) => {
    setAvgRating(avg);
    setRatingCount(count);
  };

  // ── Desktop: lens magnifier ──
  const handleMouseEnter = useCallback(() => {
    if (window.innerWidth <= 900) return;
    setIsHoveringImage(true);
    if (!clickZoomed) setLensActive(true);
  }, [clickZoomed]);

  const handleMouseLeave = useCallback(() => {
    setIsHoveringImage(false);
    setLensActive(false);
  }, []);

  const handleMouseMove = useCallback((e) => {
    const wrap = imageWrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (clickZoomed) {
      // Pan the zoomed image by adjusting transform-origin
      const originX = (x / rect.width) * 100;
      const originY = (y / rect.height) * 100;
      setClickZoomOrigin({ x: originX, y: originY });
      return;
    }

    // Clamp lens position within container
    const halfLens = LENS_SIZE / 2;
    const clampedX = Math.max(halfLens, Math.min(rect.width - halfLens, x));
    const clampedY = Math.max(halfLens, Math.min(rect.height - halfLens, y));

    setLensPos({ x: clampedX, y: clampedY });

    // Calculate background position for zoomed image inside lens
    const bgX = (x / rect.width) * 100;
    const bgY = (y / rect.height) * 100;
    setBgPos({ x: bgX, y: bgY });
  }, [clickZoomed]);

  // ── Toggle click zoom ──
  const handleImageClick = useCallback(() => {
    if (window.innerWidth <= 900) return;
    setClickZoomed((prev) => {
      const next = !prev;
      if (next) {
        setLensActive(false);
        setClickZoomOrigin({ x: 50, y: 50 });
      } else {
        setLensActive(true);
      }
      return next;
    });
  }, []);

  // ESC key exits click zoom
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setClickZoomed(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      mobileTouchDist.current = getTouchDist(e.touches);
    } else if (e.touches.length === 1 && mobileZoom > 1) {
      isMobileDragging.current = true;
      mobilePanStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      mobilePanOffset.current = { ...mobilePan };
    }
  }, [mobileZoom, mobilePan]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const newDist = getTouchDist(e.touches);
      const scale = newDist / mobileTouchDist.current;
      mobileTouchDist.current = newDist;
      setMobileZoom((prev) => Math.max(1, Math.min(3, prev * scale)));
    } else if (e.touches.length === 1 && isMobileDragging.current) {
      const dx = e.touches[0].clientX - mobilePanStart.current.x;
      const dy = e.touches[0].clientY - mobilePanStart.current.y;
      setMobilePan({
        x: mobilePanOffset.current.x + dx,
        y: mobilePanOffset.current.y + dy,
      });
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isMobileDragging.current = false;
  }, []);

  // Reset mobile zoom when pinch ends at scale 1
  useEffect(() => {
    if (mobileZoom <= 1) setMobilePan({ x: 0, y: 0 });
  }, [mobileZoom]);

  if (loading) {
    return (
      <div className="detail-page">
        <div className="detail-loading">Cargando producto...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-page">
        <div className="detail-error">
          <i className="bi bi-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={() => navigate(-1)}>Volver</button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="detail-page">
        <div className="detail-error">
          <i className="bi bi-emoji-frown"></i>
          <p>Producto no encontrado</p>
          <button onClick={() => navigate('/')}>Ir al inicio</button>
        </div>
      </div>
    );
  }

  const activePrice = product.sale && product.salePrice != null
    ? product.salePrice
    : product.price;

  const hasSizes = (product.department === 'mujer' || product.department === 'hombre') && product.sizes;
  const isAccesorio = product.department === 'accesorios';

  const getStockForSize = (size) => {
    if (product.sizes && product.sizes[size] !== undefined) {
      return product.sizes[size];
    }
    return 0;
  };

  const selectedStock = hasSizes && selectedSize ? getStockForSize(selectedSize) : product.stock;
  const isInStock = selectedStock > 0;

  const handleAddToCart = () => {
    if (hasSizes && !selectedSize) {
      setShowSizeWarning(true);
      return;
    }
    setShowSizeWarning(false);

    const productToAdd = {
      ...product,
      selectedSize: hasSizes ? selectedSize : (product.size || null),
    };
    addItem(productToAdd, 1);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="detail-page">
      <button className="detail-back" onClick={() => navigate(-1)}>
        <i className="bi bi-arrow-left"></i> Volver al catálogo
      </button>

      <div className="detail-container">
        {/* ── Image with inline hover zoom ── */}
        <div
          className={`detail-image${lensActive ? ' lens-active' : ''}${clickZoomed ? ' click-zoomed' : ''}`}
          ref={imageWrapRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
          onClick={handleImageClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Image — always rendered, zoom via transform: scale */}
          <img
            src={product.image}
            alt={product.name}
            className={`detail-image-img${mobileZoom > 1 ? ' mobile-zoomed' : ''}${clickZoomed ? ' click-zoom-active' : ''}`}
            draggable={false}
            style={clickZoomed ? {
              transform: `scale(${ZOOM_FACTOR})`,
              transformOrigin: `${clickZoomOrigin.x}% ${clickZoomOrigin.y}%`,
              transition: 'transform-origin 0.08s linear',
            } : mobileZoom > 1 ? {
              transform: `scale(${mobileZoom}) translate(${mobilePan.x / mobileZoom}px, ${mobilePan.y / mobileZoom}px)`,
            } : undefined}
          />

          {/* Magnifier lens — desktop only, only when not click-zoomed */}
          {lensActive && !clickZoomed && (
            <div
              className="detail-lens"
              style={{
                left: lensPos.x,
                top: lensPos.y,
                backgroundImage: `url(${product.image})`,
                backgroundPosition: `${bgPos.x}% ${bgPos.y}%`,
                backgroundSize: `${ZOOM_FACTOR * 100}%`,
              }}
            />
          )}

          {/* Lupa icon hint on hover — bottom-right corner */}
          {isHoveringImage && !clickZoomed && (
            <div className="detail-zoom-hint">
              <i className="bi bi-zoom-in"></i>
            </div>
          )}

          {/* Exit zoom hint while click-zoomed */}
          {clickZoomed && (
            <div className="detail-zoom-exit">
              <i className="bi bi-zoom-out"></i>
              <span>Clic para salir</span>
            </div>
          )}

          {product.sale && <span className="sale-tag">Rebajas especiales</span>}

          {/* Mobile zoom indicator */}
          {mobileZoom > 1 && (
            <div className="mobile-zoom-badge">
              {Math.round(mobileZoom * 100)}%
            </div>
          )}
        </div>

        <div className="detail-info">
          <span className="detail-department">{product.department || 'LUXE Exclusive'}</span>
          <h1 className="detail-name">{product.name}</h1>

          {avgRating !== null && (
            <div className="detail-rating">
              <div className="detail-rating-stars">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={18} className={s <= Math.round(avgRating) ? 'star-filled' : 'star-empty'} fill={s <= Math.round(avgRating) ? 'currentColor' : 'none'} />
                ))}
              </div>
              <span className="detail-rating-text">{avgRating.toFixed(1)}</span>
              <span className="detail-rating-count">({ratingCount} {ratingCount === 1 ? 'calificación' : 'calificaciones'})</span>
            </div>
          )}

          <div className="detail-prices">
            <span className="detail-price">${activePrice}</span>
            {product.sale && product.salePrice != null && (
              <span className="detail-original-price">${product.price}</span>
            )}
          </div>

          {product.description && (
            <p className="detail-description">{product.description}</p>
          )}

          {hasSizes && (
            <div className="detail-size-selector">
              <label className="detail-size-label">Talla *</label>
              <div className="detail-size-options">
                {SIZES.map((sz) => {
                  const stock = getStockForSize(sz);
                  const outOfStock = stock <= 0;
                  return (
                    <button
                      key={sz}
                      className={`detail-size-btn ${selectedSize === sz ? 'selected' : ''} ${outOfStock ? 'out-of-stock' : ''}`}
                      onClick={() => { setSelectedSize(sz); setShowSizeWarning(false); }}
                      disabled={outOfStock}
                      type="button"
                    >
                      <span className="size-name">{sz}</span>
                      <span className="size-stock">{stock > 0 ? `${stock} disp.` : 'Agotado'}</span>
                    </button>
                  );
                })}
              </div>
              {showSizeWarning && (
                <p className="detail-size-warning">
                  <i className="bi bi-info-circle"></i> Selecciona una talla antes de agregar al carrito
                </p>
              )}
            </div>
          )}

          {isAccesorio && product.size && (
            <div className="detail-meta">
              <div className="meta-item">
                <strong>Talla</strong>
                <span>{product.size}</span>
              </div>
            </div>
          )}

          <div className="detail-meta">
            {product.color && (
              <div className="meta-item">
                <strong>Color</strong>
                <span>{product.color}</span>
              </div>
            )}
            {product.material && (
              <div className="meta-item">
                <strong>Material</strong>
                <span>{product.material}</span>
              </div>
            )}
            <div className="meta-item">
              <strong>Disponibilidad</strong>
              <span className={`stock-status ${isInStock ? 'in-stock' : 'out-of-stock'}`}>
                <i className={`bi ${isInStock ? 'bi-circle-fill' : 'bi-x-circle-fill'}`}></i>
                {hasSizes && selectedSize
                  ? (isInStock ? `${selectedStock} unidades en talla ${selectedSize}` : `Sin stock en talla ${selectedSize}`)
                  : (hasSizes
                    ? 'Selecciona una talla'
                    : (product.stock > 0 ? `${product.stock} unidades en stock` : 'Agotado temporalmente')
                  )
                }
              </span>
            </div>
          </div>

          <button
            className={`detail-add-btn ${addedToCart ? 'added' : ''}`}
            onClick={handleAddToCart}
            disabled={isAccesorio && product.stock <= 0}
          >
            <i className={`bi ${addedToCart ? 'bi-check-lg' : 'bi-bag-plus'}`}></i>
            {addedToCart
              ? '¡Agregado!'
              : (hasSizes
                ? 'Agregar a la bolsa'
                : (product.stock > 0 ? 'Agregar a la bolsa' : 'Fuera de stock')
              )
            }
          </button>
        </div>
      </div>

      <Reviews productId={id} onRatingChange={handleRatingChange} />
    </div>
  );
}
