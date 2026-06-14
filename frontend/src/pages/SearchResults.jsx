import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import useFavourites from '../hooks/useFavourites';
import { API_BASE_URL } from '../utils/api';
import './Catalog/Mujer.css';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isFav, toggle } = useFavourites();

  useEffect(() => {
    if (!query.trim()) {
      setProducts([]);
      setLoading(false);
      return;
    }

    let active = true;

    const fetchAndFilter = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/products`);
        if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);
        const data = await response.json();

        const q = query.toLowerCase().trim();
        const filtered = data.filter((p) => {
          const name = (p.name || '').toLowerCase();
          const desc = (p.description || '').toLowerCase();
          const dept = (p.department || '').toLowerCase();
          const cat = (p.type || p.category || '').toLowerCase();
          const color = (p.color || '').toLowerCase();
          const material = (p.material || '').toLowerCase();
          return (
            name.includes(q) ||
            desc.includes(q) ||
            dept.includes(q) ||
            cat.includes(q) ||
            color.includes(q) ||
            material.includes(q)
          );
        });

        if (active) {
          setProducts(filtered);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error searching products:', err);
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchAndFilter();
    return () => { active = false; };
  }, [query]);

  if (!query.trim()) {
    return (
      <div className="detail-page" style={{ textAlign: 'center', padding: '6rem 1.5rem' }}>
        <h1 style={{ marginBottom: '1rem' }}>Buscar Productos</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Escribe un término de búsqueda en la barra de arriba.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="detail-page" style={{ textAlign: 'center', padding: '6rem 1.5rem' }}>
        <p>Buscando productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-page" style={{ textAlign: 'center', padding: '6rem 1.5rem' }}>
        <p style={{ color: '#ff6b6b' }}>Error al buscar: {error}</p>
        <Link to="/" style={{ marginTop: '1rem', display: 'inline-block' }}>Volver al inicio</Link>
      </div>
    );
  }

  return (
    <div className="catalog-page">
      <div className="catalog-header">
        <h1 className="catalog-title">
          Resultados para "<span style={{ color: 'var(--accent-gold, #d4af37)' }}>{query}</span>"
        </h1>
        <p className="catalog-subtitle">
          {products.length} producto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
        </p>
      </div>

      {products.length === 0 ? (
        <div className="detail-page" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
            No se encontraron productos para "{query}"
          </p>
          <Link to="/" style={{ color: 'var(--accent-gold, #d4af37)', fontWeight: 600 }}>
            Explorar todos los productos
          </Link>
        </div>
      ) : (
        <div className="catalog-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFav={isFav(product.id)}
              onToggleFav={toggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
