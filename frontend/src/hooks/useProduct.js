// src/hooks/useProduct.js  (singular — un solo producto)
//
// Análogo a useProducts (plural), pero consume GET /api/products/:id
// en lugar de GET /api/products.
//
// ¿Por qué un hook separado y no ampliar useProducts?
// Porque tienen responsabilidades distintas:
//   - useProducts  → lista paginable, filtrable, de múltiples items
//   - useProduct   → un único objeto completo para mostrar su detalle
// Separarlos mantiene cada hook pequeño, predecible y fácil de testear.

import { useState, useEffect } from 'react';

/**
 * useProduct — obtiene un producto específico desde GET /api/products/:id
 *
 * @param {string} id — ID del documento en Firestore (viene de la URL de React Router)
 *
 * @returns {{
 *   product: Object|null,   — el producto, o null mientras carga / si no existe
 *   loading: boolean,       — true mientras espera la respuesta del servidor
 *   error: string|null      — mensaje de error si algo salió mal
 * }}
 *
 * Ejemplo de uso en ProductDetail.jsx:
 *   const { id } = useParams();                    // React Router extrae el ID de la URL
 *   const { product, loading, error } = useProduct(id);
 */
export default function useProduct(id) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Si no hay ID (ej. el componente se monta antes de que la URL esté lista),
    // no hacemos nada. Sin esta guarda, haríamos fetch('/api/products/undefined').
    if (!id) return;

    let active = true; // Guarda para evitar actualizar un componente desmontado

    const fetchProduct = async () => {
      // Reseteamos los estados al inicio de cada fetch.
      // Esto es importante si el usuario navega de un producto a otro:
      // evitamos que el producto anterior siga visible mientras carga el nuevo.
      setLoading(true);
      setError(null);
      setProduct(null);

      try {
        // Construimos la URL con el ID interpolado.
        // El proxy de Vite (vite.config.js) redirige /api/* a http://localhost:3001
        // durante desarrollo, así que aquí escribimos solo la ruta relativa.
        const response = await fetch(`/api/products/${id}`);

        // ── Caso 404: el producto no existe ────────────────────────────────
        // fetch() NO lanza un error automáticamente con 404 o 500.
        // Debemos verificar response.ok (true si status está entre 200-299).
        // Si el servidor respondió 404, response.ok es false y response.status es 404.
        if (!response.ok) {
          // Intentamos leer el mensaje de error que envió Express ({ error: "..." })
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || `Error ${response.status}`);
        }

        // ── Caso 200: el producto existe ────────────────────────────────────
        const data = await response.json();

        if (active) {
          setProduct(data);
          setLoading(false);
        }
      } catch (err) {
        console.error(`❌ useProduct — Error al obtener producto "${id}":`, err);
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchProduct();

    // Cleanup: si el usuario sale de la página de detalle antes de que
    // el fetch termine, cancelamos la actualización de estado.
    return () => {
      active = false;
    };

  // "id" en el array de dependencias significa que si el ID cambia
  // (ej. el usuario va de /productos/abc a /productos/xyz sin recargar),
  // React vuelve a ejecutar el useEffect automáticamente con el nuevo ID.
  }, [id]);

  return { product, loading, error };
}
