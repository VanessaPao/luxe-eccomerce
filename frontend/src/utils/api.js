// Utilidad para centralizar la URL del backend
// En desarrollo, usa localhost:3001. En producción, usará la URL de Render (inyectada por variables de entorno de Vite).
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Espera a que Firebase resuelva el estado de autenticación.
 * Retorna el usuario actual o null si no hay sesión.
 * Se resuelve inmediatamente si Firebase ya restauró la sesión.
 */
function waitForAuthReady(timeoutMs = 5000) {
  return new Promise((resolve) => {
    let resolved = false;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!resolved) {
        resolved = true;
        unsubscribe();
        resolve(user);
      }
    });
    // Fallback: resolver con null si Firebase no resuelve en 5 segundos
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        unsubscribe();
        resolve(auth.currentUser);
      }
    }, timeoutMs);
  });
}

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
  // Esperar a que Firebase restaure la sesión antes de verificar auth.currentUser.
  // Esto evita el 401 después de recargar la página o redirecciones (ej. Stripe).
  const user = auth.currentUser || await waitForAuthReady();

  if (!user) {
    return fetch(url, options);
  }

  const token = await user.getIdToken();
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  return fetch(url, { ...options, headers });
}
