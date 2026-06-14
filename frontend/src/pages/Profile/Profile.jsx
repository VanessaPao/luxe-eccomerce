import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../utils/api';
import './Profile.css';

const STATUS_LABELS = {
  pending: 'Pendiente',
  processing: 'Procesando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  paid: 'Pagado',
};

const STATUS_COLORS = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#22c55e',
  cancelled: '#ef4444',
  paid: '#22c55e',
};

export default function Profile() {
  const { user, profile, loading } = useAuth();
  const { items: cartItems } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      setOrdersLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/orders/user/${user.uid}`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        } else {
          setOrdersError(true);
        }
      } catch (err) {
        console.error('Error cargando pedidos:', err);
        setOrdersError(true);
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

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
          {/* ── Mis Pedidos ── */}
          <div className="profile-section">
            <h2>
              <i className="bi bi-bag"></i> Mis Pedidos
              {orders.length > 0 && <span className="order-count">{orders.length}</span>}
            </h2>

            {ordersLoading ? (
              <p className="section-hint">Cargando pedidos...</p>
            ) : ordersError ? (
              <p className="section-hint" style={{ color: '#ef4444' }}>
                Error al cargar tus pedidos. Intenta de nuevo más tarde.
              </p>
            ) : orders.length === 0 ? (
              <p className="section-hint">
                Los pedidos aparecerán aquí una vez que realices una compra.
              </p>
            ) : (
              <div className="orders-list">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className={`order-card ${expandedOrder === order.id ? 'expanded' : ''}`}
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  >
                    <div className="order-card-header">
                      <div className="order-card-info">
                        <span className="order-id">#{order.id.slice(0, 8)}</span>
                        <span
                          className="order-status"
                          style={{ background: STATUS_COLORS[order.status] || '#888' }}
                        >
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </div>
                      <div className="order-card-meta">
                        <span className="order-total">${order.total?.toFixed(2)}</span>
                        <span className="order-date">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString('es-MX', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : ''}
                        </span>
                      </div>
                    </div>

                    {expandedOrder === order.id && (
                      <div className="order-card-details">
                        <div className="order-items">
                          {(order.items || []).map((item, i) => (
                            <div key={i} className="order-item">
                              {item.image && (
                                <img src={item.image} alt={item.name} className="order-item-img" />
                              )}
                              <div className="order-item-info">
                                <span className="order-item-name">{item.name}</span>
                                <span className="order-item-qty">
                                  x{item.quantity || 1} — ${item.price?.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        {order.shippingAddress && (
                          <div className="order-shipping">
                            <strong>Envío a:</strong>{' '}
                            {order.shippingAddress.address?.street} #{order.shippingAddress.address?.number},
                            Col. {order.shippingAddress.address?.neighborhood},
                            {order.shippingAddress.address?.city}, {order.shippingAddress.address?.state}
                          </div>
                        )}
                        <div className="order-payment-method">
                          <strong>Pago:</strong>{' '}
                          {order.paymentMethod === 'stripe' ? 'Stripe (Tarjeta)' : 'Mercado Pago'}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
