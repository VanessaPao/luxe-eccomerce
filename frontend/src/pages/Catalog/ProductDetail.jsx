import { useParams, useNavigate } from 'react-router-dom';
import useProduct from '../../hooks/useProduct';
import { useCart } from '../../context/CartContext';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const { product, loading, error } = useProduct(id);
  const { addItem } = useCart();
  const navigate = useNavigate();

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

  const handleAddToCart = () => {
    addItem(product, 1);
  };

  return (
    <div className="detail-page">
      <button className="detail-back" onClick={() => navigate(-1)}>
        <i className="bi bi-arrow-left"></i> Volver al catálogo
      </button>

      <div className="detail-container">
        {/* Imagen del producto con sutil zoom on hover */}
        <div className="detail-image">
          <img src={product.image} alt={product.name} />
          {product.sale && <span className="sale-tag">Rebajas especiales</span>}
        </div>

        {/* Información y llamada a la acción */}
        <div className="detail-info">
          <span className="detail-department">{product.department || 'LUXE Exclusive'}</span>
          <h1 className="detail-name">{product.name}</h1>

          <div className="detail-prices">
            <span className="detail-price">${activePrice}</span>
            {product.sale && product.salePrice != null && (
              <span className="detail-original-price">${product.price}</span>
            )}
          </div>

          {product.description && (
            <p className="detail-description">{product.description}</p>
          )}

          {/* Atributos del producto con efecto Glassmorphism */}
          <div className="detail-meta">
            {product.color && (
              <div className="meta-item">
                <strong>Color</strong>
                <span>{product.color}</span>
              </div>
            )}
            {product.size && (
              <div className="meta-item">
                <strong>Talla</strong>
                <span>{product.size}</span>
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
              <span className={`stock-status ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                <i className={`bi ${product.stock > 0 ? 'bi-circle-fill' : 'bi-x-circle-fill'}`}></i>
                {product.stock > 0 ? `${product.stock} unidades en stock` : 'Agotado temporalmente'}
              </span>
            </div>
          </div>

          {/* Botón de compra premium */}
          <button
            className="detail-add-btn"
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
          >
            <i className="bi bi-bag-plus"></i>
            {product.stock > 0 ? 'Agregar a la bolsa' : 'Fuera de stock'}
          </button>
        </div>
      </div>
    </div>
  );
}
