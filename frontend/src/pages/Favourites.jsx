import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useFavourites from '../hooks/useFavourites';
import './Favourites.css';

export default function Favourites() {
  const { user } = useAuth();
  const { favourites } = useFavourites();
  const navigate = useNavigate();

  // Redirigir si no hay sesión
  if (!user) {
    return (
      <div className="favs-page">
        <div className="favs-empty">
          <div className="favs-lock-icon">🔐</div>
          <h1>Tus Favoritos</h1>
          <p>Inicia sesión para ver y guardar tus productos favoritos.</p>
          <div className="favs-auth-actions">
            <button className="favs-btn primary" onClick={() => navigate('/login', { state: { mode: 'login' } })}>
              Iniciar sesión
            </button>
            <button className="favs-btn secondary" onClick={() => navigate('/login', { state: { mode: 'register' } })}>
              Crear cuenta
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (favourites.length === 0) {
    return (
      <div className="favs-page">
        <h1 className="favs-title">Mis Favoritos</h1>
        <div className="favs-empty">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              fill="rgba(212,175,55,0.08)"
              stroke="rgba(212,175,55,0.3)"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p>Aún no tienes favoritos guardados</p>
          <a href="/" className="favs-shop-link">Explorar productos</a>
        </div>
      </div>
    );
  }

  return (
    <div className="favs-page">
      <h1 className="favs-title">Mis Favoritos <span className="favs-count">({favourites.length})</span></h1>
      <p className="favs-subtitle">
        Tienes {favourites.length} producto{favourites.length !== 1 ? 's' : ''} guardado{favourites.length !== 1 ? 's' : ''}.
      </p>
      <div className="favs-grid-placeholder">
        {/* Los productos se muestran desde las páginas de categoría con el corazón activo */}
        <p className="favs-hint">
          Navega las categorías para ver tus productos favoritos marcados con ❤️
        </p>
        <a href="/" className="favs-shop-link">Ir a la tienda</a>
      </div>
    </div>
  );
}
