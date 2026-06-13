// src/hooks/useProducts.js
//
// Hook personalizado que centraliza la obtención de productos desde Express.
//
// ¿Por qué un hook y no una función normal?
// Un hook de React puede manejar estado (useState) y efectos secundarios
// (useEffect) de forma integrada. Una función utilitaria normal no puede
// "hablar" con el sistema de renderizado de React. Con este hook, cualquier
// página que lo use obtiene automáticamente: loading, error y los datos,
// y React re-renderiza solo cuando alguno de esos valores cambia.
//
// ¿Por qué aceptar un parámetro "department"?
// Para no duplicar lógica. Mujer, Hombre y Accesorios solo necesitan
// los productos de su departamento. Rebajas necesita los que tienen
// sale === true. Pasando parámetros opcionales, un único hook sirve
// para todos los casos sin tener que escribir 4 fetchs distintos.

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/api';

/**
 * useProducts — obtiene productos desde GET /api/products (Express → Firestore).
 *
 * @param {Object} options
 * @param {string}  [options.department] — Si se pasa ('mujer'|'hombre'|'accesorios'),
 *                                          filtra por ese departamento en el cliente.
 * @param {boolean} [options.saleOnly]   — Si es true, solo devuelve productos con sale === true.
 *
 * @returns {{ products: Array, loading: boolean, error: string|null }}
 *
 * Ejemplo de uso en Mujer.jsx:
 *   const { products, loading, error } = useProducts({ department: 'mujer' });
 *
 * Ejemplo de uso en Rebajas.jsx:
 *   const { products, loading, error } = useProducts({ saleOnly: true });
 */
export default function useProducts({ department, saleOnly } = {}) {
  // "rawProducts" guarda todos los productos que devuelve Express.
  // Los filtramos DESPUÉS para no hacer múltiples llamadas a la API.
  const [rawProducts, setRawProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // "active" actúa como un interruptor de seguridad.
    // Si el usuario navega a otra página antes de que el fetch termine,
    // React desmonta este componente. Sin este flag, el callback del fetch
    // intentaría actualizar el estado de un componente que ya no existe,
    // generando un warning: "Can't perform a React state update on an
    // unmounted component". Con "active = false" en el cleanup, lo evitamos.
    let active = true;

    const fetchProducts = async () => {
      try {
        // fetch() es la API nativa del navegador para hacer peticiones HTTP.
        // Durante desarrollo, Vite intercepta esta URL y la redirige a
        // http://localhost:3001/api/products gracias al proxy que configuramos
        // en vite.config.js. En producción apuntará al servidor real.
        const response = await fetch(`${API_BASE_URL}/api/products`);

        // Si el servidor respondió con un código de error (4xx, 5xx),
        // response.ok será false. Lanzamos un error manualmente para
        // que el catch lo capture y lo muestre al usuario.
        if (!response.ok) {
          throw new Error(`Error del servidor: ${response.status}`);
        }

        // response.json() parsea el cuerpo de la respuesta de texto JSON
        // a un array de objetos JavaScript. Es equivalente a JSON.parse(),
        // pero devuelve una Promesa porque la respuesta puede ser grande
        // y llegar en partes (streaming).
        const data = await response.json();

        // Solo actualizamos el estado si el componente sigue montado.
        if (active) {
          setRawProducts(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('❌ useProducts — Error al obtener productos:', err);
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchProducts();

    // Función de limpieza: se ejecuta cuando el componente se desmonta
    // o cuando las dependencias del useEffect cambian.
    return () => {
      active = false;
    };
  }, []); // [] = solo se ejecuta una vez al montar. Los productos no cambian
          // frecuentemente, no necesitamos re-fetching automático.

  // ── Filtrado en el cliente ─────────────────────────────────────────────
  // Hacemos UNA sola petición a Express y filtramos localmente.
  // Alternativa más avanzada: pasar query params (?department=mujer&sale=true)
  // a Express para que Firestore filtre en origen. Por ahora, el catálogo
  // LUXE es pequeño y este approach es más simple y suficiente.

  let products = rawProducts;

  // Normalizamos el campo "category" para que ProductCard y FiltersSidebar
  // reciban siempre el tipo de producto (ej. "Vestidos") y no el departamento
  // (ej. "mujer"). El campo "type" contiene el tipo específico en Firestore.
  products = products.map((p) => ({
    ...p,
    category: p.type || p.category,
  }));

  // Filtro por departamento (para Mujer, Hombre, Accesorios)
  if (department) {
    products = products.filter(
      (p) => p.department === department || p.category === department
    );
  }

  // Filtro por rebaja (para Rebajas)
  if (saleOnly) {
    products = products.filter((p) => p.sale === true);
  }

  return { products, loading, error };
}
