import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthModal.css';

/**
 * AuthModal — Se muestra cuando un usuario sin sesión
 * intenta agregar un producto a favoritos.
 */
export default function AuthModal({ onClose }) {
  const navigate = useNavigate();

  const goToLogin = (mode) => {
    onClose();
    navigate('/login', { state: { mode } });
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button className="auth-modal-close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>

        {/* Icon */}
        <div className="auth-modal-icon">
          <svg viewBox="0 0 24 24" width="36" height="36">
            <path
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              fill="rgba(212,175,55,0.15)"
              stroke="#d4af37"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 className="auth-modal-title">Guarda tus favoritos</h2>
        <p className="auth-modal-text">
          Inicia sesión o crea una cuenta para guardar productos en tu lista de favoritos y acceder a ellos desde cualquier dispositivo.
        </p>

        <div className="auth-modal-actions">
          <button
            className="auth-modal-btn primary"
            onClick={() => goToLogin('login')}
          >
            Iniciar sesión
          </button>
          <button
            className="auth-modal-btn secondary"
            onClick={() => goToLogin('register')}
          >
            Crear cuenta gratis
          </button>
        </div>

        <button className="auth-modal-skip" onClick={onClose}>
          Continuar sin registrarme
        </button>
      </div>
    </div>
  );
}
