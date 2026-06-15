// Utilidad para centralizar la URL del backend
// En desarrollo, usa localhost:3001. En producción, usará la URL de Render (inyectada por variables de entorno de Vite).
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

import { auth } from '../firebase/config';

/**
 * authFetch: Wrapper de fetch que adjunta automáticamente el ID Token de Firebase.
 *
 * USO:
 *   import { authFetch } from '../utils/api';
 *
 *   // Reemplaza fetch() por authFetch() — funciona igual pero agrega el header Authorization.
 *   const res = await authFetch(`${API_BASE_URL}/api/cart/user123`);
 *   const data = await res.json();
 *
 * Si el usuario no está autenticado, envía la petición SIN token (el backend rechazará con 401 si el endpoint lo requiere).
 */
export async function authFetch(url, options = {}) {
  const user = auth.currentUser;
  if (!user) {
    // Usuario no logueado: la petición irá sin token.
    // El backend responderá 401 si el endpoint requiere autenticación.
    return fetch(url, options);
  }

  const token = await user.getIdToken();
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  return fetch(url, { ...options, headers });
}
