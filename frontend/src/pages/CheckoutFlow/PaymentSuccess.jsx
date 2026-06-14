import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { functions, db } from '../../firebase/config';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { API_BASE_URL } from '../../utils/api';
import './PaymentStatus.css';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [orderId, setOrderId] = useState('');

  const sessionId = searchParams.get('session_id');
  const queryOrderId = searchParams.get('order_id');

  useEffect(() => {
    let active = true;

    const processPayment = async () => {
      try {
        if (sessionId) {
          // --- Flujo de Stripe Express ---
          // Llamamos al servidor Express para verificar el pago y crear la orden en Firestore de forma segura
          const response = await fetch(`${API_BASE_URL}/api/checkout/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          });

          const data = await response.json();

          if (response.ok && data.success) {
            const dbOrderId = data.orderId;
            if (active) {
              setOrderId(dbOrderId);
              // Obtener los detalles de la orden creada para mostrarlos en pantalla
              const orderSnap = await getDoc(doc(db, 'orders', dbOrderId));
              if (orderSnap.exists()) {
                setOrder(orderSnap.data());
              }
              // Vaciar el carrito de compras del usuario
              await clearCart();
            }
          } else {
            throw new Error(data.error || data.message || 'No se pudo verificar el pago con Stripe.');
          }
        } else if (queryOrderId) {
          // --- Flujo de Mercado Pago (Simulado) ---
          if (active) {
            setOrderId(queryOrderId);
            const orderSnap = await getDoc(doc(db, 'orders', queryOrderId));
            if (orderSnap.exists()) {
              setOrder(orderSnap.data());
            }
            // Vaciar el carrito de compras
            await clearCart();
          }
        } else {
          throw new Error('No se especificó un ID de sesión de pago o ID de pedido válido.');
        }
      } catch (err) {
        console.error(err);
        if (active) {
          setError(err.message || 'Ocurrió un error al procesar tu confirmación de compra.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    processPayment();

    return () => {
      active = false;
    };
  }, [sessionId, queryOrderId, clearCart]);

  if (loading) {
    return (
      <div className="status-page">
        <div className="status-card loading-pulse">
          <div className="status-icon-wrapper success">
            <span className="status-icon">🔄</span>
          </div>
          <h2 className="status-title">Procesando tu pago</h2>
          <p className="status-text">
            Estamos validando tu transacción con la pasarela de pago. Por favor no cierres esta ventana...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-page">
        <div className="status-card">
          <div className="status-icon-wrapper cancel">
            <span className="status-icon">✕</span>
          </div>
          <h2 className="status-title cancel" style={{ color: '#ff6b6b' }}>Error en la Verificación</h2>
          <p className="status-text">{error}</p>
          <div className="status-actions">
            <button className="btn-status-primary" onClick={() => navigate('/checkout')}>
              Volver al checkout
            </button>
            <button className="btn-status-secondary" onClick={() => navigate('/')}>
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="status-page">
      <div className="status-card">
        <div className="status-icon-wrapper success">
          <span className="status-icon">✓</span>
        </div>

        <h2 className="status-title success">¡Compra Completada!</h2>
        <p className="status-text">
          Tu pago ha sido procesado de forma segura y tu pedido está en camino.
        </p>

        {order && (
          <div className="order-details-box">
            <h3>Detalles de la Orden</h3>
            <p><strong>ID del Pedido:</strong> {orderId}</p>
            <p><strong>Total Pagado:</strong> ${order.total?.toFixed(2)}</p>
            <p><strong>Método de Pago:</strong> {order.paymentMethod === 'stripe' ? 'Stripe (Tarjeta)' : 'Mercado Pago (Simulado)'}</p>
            <p>
              <strong>Dirección de Envío:</strong> {order.shippingAddress?.address?.street} #{order.shippingAddress?.address?.number}, Col. {order.shippingAddress?.address?.neighborhood}, {order.shippingAddress?.address?.city}, {order.shippingAddress?.address?.state}, C.P. {order.shippingAddress?.address?.zipCode}
            </p>
          </div>
        )}

        <div className="status-actions">
          <button className="btn-status-primary" onClick={() => navigate('/')}>
            Seguir Comprando
          </button>
        </div>
      </div>
    </div>
  );
}
