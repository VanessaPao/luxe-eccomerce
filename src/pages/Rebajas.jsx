import React, { useState, useEffect } from 'react';
import './Mujer.css';
import FiltersSidebar from '../components/FiltersSidebar';
import ProductCard from '../components/ProductCard';
import useFavourites from '../hooks/useFavourites';
import { getSaleProducts } from '../firebase/firestore';

const categories = ['Vestidos', 'Pantalones', 'Camisas', 'Abrigos', 'Zapatos', 'Faldas', 'Chaquetas', 'Trajes', 'Bolsos', 'Cinturones', 'Joyería', 'Gafas', 'Pañuelos', 'Sombreros'];
const sizes = ['Grande', 'Mediano', 'Chico'];
const materials = ['Seda', 'Algodón', 'Lino', 'Lana', 'Cuero', 'Metal', 'Perla', 'Paja'];
const colors = ['Negro', 'Azul', 'Blanco', 'Gris', 'Marrón'];

export default function Rebajas() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: [],
    size: [],
    priceMin: 0,
    priceMax: 1000,
    material: [],
    color: [],
  });

  const { isFav, toggle } = useFavourites();

  useEffect(() => {
    let active = true;
    
    const fetchProducts = async () => {
      try {
        const data = await getSaleProducts();
        if (active) {
          setProducts(data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching sale products from Firestore:', error);
        if (active) {
          setLoading(false);
        }
      }
    };
    
    fetchProducts();
    
    return () => {
      active = false;
    };
  }, []);

  const toggleArrayFilter = (key, value) => {
    setFilters((prev) => {
      const current = new Set(prev[key]);
      current.has(value) ? current.delete(value) : current.add(value);
      return { ...prev, [key]: Array.from(current) };
    });
  };

  const clearFilter = (key) => {
    setFilters((prev) => ({ ...prev, [key]: [] }));
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: Number(value) }));
  };

  // Normalizar los productos para que category contenga el type (ej. Vestidos)
  const normalizedProducts = products.map((p) => ({
    ...p,
    category: p.type || p.category,
  }));

  const filteredProducts = normalizedProducts.filter((p) => {
    const { category, size, priceMin, priceMax, material, color } = filters;
    const activePrice = p.sale && p.salePrice !== undefined && p.salePrice !== null ? p.salePrice : p.price;
    return (
      (category.length === 0 || category.includes(p.category)) &&
      (size.length === 0 || size.includes(p.size)) &&
      (material.length === 0 || material.includes(p.material)) &&
      (color.length === 0 || color.includes(p.color)) &&
      activePrice >= priceMin && activePrice <= priceMax
    );
  });

  return (
    <div className="mujer-page">
      <h1 className="page-title">Rebajas</h1>
      <div className="content-wrapper">
        <FiltersSidebar
          filters={filters}
          toggleArrayFilter={toggleArrayFilter}
          clearFilter={clearFilter}
          handlePriceChange={handlePriceChange}
          categories={categories}
          sizes={sizes}
          materials={materials}
          colors={colors}
        />
        <section className="products-grid">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <p className="no-results">No hay productos que coincidan con los filtros.</p>
          ) : (
            filteredProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                isFav={isFav(p.id)}
                onToggleFav={toggle}
              />
            ))
          )}
        </section>
      </div>
    </div>
  );
}
