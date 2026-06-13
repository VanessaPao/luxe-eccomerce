// Utilidad para centralizar la URL del backend
// En desarrollo, usa localhost:3001. En producción, usará la URL de Render (inyectada por variables de entorno de Vite).
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
