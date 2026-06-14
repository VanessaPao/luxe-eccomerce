import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/api';

/**
 * useFilteredProducts — fetches products from the backend with server-side filtering.
 *
 * @param {Object} options
 * @param {string}  [options.department] — Filter by department ('mujer'|'hombre'|'accesorios')
 * @param {boolean} [options.saleOnly]   — Only return products with sale === true
 * @returns {{ products, loading, error, filters, toggleArrayFilter, clearFilter, handlePriceChange, maxPrice }}
 */
export default function useFilteredProducts({ department, saleOnly } = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [maxPrice, setMaxPrice] = useState(1000);

  const [filters, setFilters] = useState({
    category: [],
    size: [],
    priceMin: 0,
    priceMax: 1000,
    material: [],
    color: [],
  });

  // Fetch products from backend with current filters
  useEffect(() => {
    let active = true;

    const buildUrl = (applyFilters = true) => {
      const params = new URLSearchParams();
      if (department) params.set('department', department);
      if (saleOnly) params.set('sale', 'true');
      if (applyFilters) {
        if (filters.category.length > 0) params.set('category', filters.category.join(','));
        if (filters.size.length > 0) params.set('size', filters.size.join(','));
        if (filters.material.length > 0) params.set('material', filters.material.join(','));
        if (filters.color.length > 0) params.set('color', filters.color.join(','));
        if (filters.priceMin > 0) params.set('priceMin', String(filters.priceMin));
        if (filters.priceMax < maxPrice) params.set('priceMax', String(filters.priceMax));
      }

      const base = saleOnly ? '/api/products/sale' : '/api/products';
      const qs = params.toString();
      return `${API_BASE_URL}${base}${qs ? '?' + qs : ''}`;
    };

    const fetchProducts = async () => {
      try {
        // 1. Fetch filtered products
        const response = await fetch(buildUrl(true));
        if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);
        const data = await response.json();

        // 2. Calculate maxPrice from unfiltered products (only once, no filters)
        const allRes = await fetch(buildUrl(false));
        if (allRes.ok) {
          const allData = await allRes.json();
          const computedMax = Math.max(1000, ...allData.map(p => {
            const ap = p.sale && p.salePrice != null ? p.salePrice : p.price;
            return ap != null ? ap : 0;
          }));
          if (active) setMaxPrice(computedMax);
        }

        // Normalize category: use type as category when available
        const normalized = data.map(p => ({ ...p, category: p.type || p.category }));

        if (active) {
          setProducts(normalized);
          setLoading(false);
        }
      } catch (err) {
        console.error('useFilteredProducts error:', err);
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchProducts();
    return () => { active = false; };
  }, [department, saleOnly, filters.category, filters.size, filters.material, filters.color, filters.priceMin, filters.priceMax, maxPrice]);

  const toggleArrayFilter = (key, value) => {
    setFilters(prev => {
      const current = new Set(prev[key]);
      current.has(value) ? current.delete(value) : current.add(value);
      return { ...prev, [key]: Array.from(current) };
    });
  };

  const clearFilter = (key) => {
    setFilters(prev => ({ ...prev, [key]: [] }));
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: Number(value) }));
  };

  return { products, loading, error, filters, toggleArrayFilter, clearFilter, handlePriceChange, maxPrice };
}
