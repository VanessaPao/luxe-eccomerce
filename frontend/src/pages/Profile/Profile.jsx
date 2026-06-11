import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

export default function Profile() {
  const { user, profile, loading } = useAuth();
  const { items: cartItems } = useCart();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">Cargando perfil...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-empty">
          <i className="bi bi-person-circle"></i>
          <h2>No has iniciado sesión</h2>
          <button onClick={() => navigate('/login')}>Iniciar sesión</button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            <i className="bi bi-person-circle"></i>
          </div>
          <div className="profile-info">
            <h1>{profile?.name || user.displayName || 'Usuario'}</h1>
            <p className="profile-email">{user.email}</p>
            {profile?.role === 'admin' && (
              <span className="admin-badge">
                <i className="bi bi-shield-check"></i> Administrador
              </span>
            )}
          </div>
        </div>

        <div className="profile-sections">
          <div className="profile-section">
            <h2>
              <i className="bi bi-bag"></i> Mis Pedidos
            </h2>
            <p className="section-hint">
              Los pedidos aparecerán aquí una vez que realices una compra.
            </p>
          </div>

          <div className="profile-section">
            <h2>
              <i className="bi bi-heart"></i> Mis Favoritos
            </h2>
            <button onClick={() => navigate('/favoritos')}>
              Ver favoritos
            </button>
          </div>

          <div className="profile-section">
            <h2>
              <i className="bi bi-cart3"></i> Mi Carrito
            </h2>
            <p>
              {cartItems.length > 0
                ? `${cartItems.length} producto(s) en el carrito`
                : 'Tu carrito está vacío'}
            </p>
            <button onClick={() => navigate('/carrito')}>
              Ver carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
