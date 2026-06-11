import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PaymentStatus.css';

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div className="status-page">
      <div className="status-card">
        <div className="status-icon-wrapper cancel">
          <span className="status-icon">✕</span>
        </div>

        <h2 className="status-title cancel" style={{ color: '#ff6b6b' }}>Pago Cancelado</h2>
        <p className="status-text">
          Has cancelado el proceso de pago o la transacción fue rechazada. No se ha realizado ningún cargo a tu cuenta.
        </p>

        <div className="status-actions">
          <button className="btn-status-primary" onClick={() => navigate('/checkout')}>
            Intentar de Nuevo (Checkout)
          </button>
          <button className="btn-status-secondary" onClick={() => navigate('/carrito')}>
            Regresar al Carrito
          </button>
        </div>
      </div>
    </div>
  );
}
