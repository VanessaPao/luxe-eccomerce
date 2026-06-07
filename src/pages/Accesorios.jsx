import React, { useState } from 'react';
import './Mujer.css';
import FiltersSidebar from '../components/FiltersSidebar';
import ProductCard from '../components/ProductCard';
import useFavourites from '../hooks/useFavourites';

const PRODUCTS = [
  {
    id: 201,
    name: 'Bolso de Cuero',
    category: 'Bolsos',
    size: 'Mediano',
    price: 320,
    material: 'Cuero',
    color: 'Marrón',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&auto=format&fit=crop',
  },
  {
    id: 202,
    name: 'Cinturón Elegante',
    category: 'Cinturones',
    size: 'Mediano',
    price: 75,
    material: 'Cuero',
    color: 'Negro',
    image: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=400&auto=format&fit=crop',
  },
  {
    id: 203,
    name: 'Collar de Perlas',
    category: 'Joyería',
    size: 'Chico',
    price: 210,
    material: 'Perla',
    color: 'Blanco',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&auto=format&fit=crop',
  },
  {
    id: 204,
    name: 'Gafas de Sol',
    category: 'Gafas',
    size: 'Mediano',
    price: 155,
    material: 'Metal',
    color: 'Negro',
    image: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=400&auto=format&fit=crop',
  },
  {
    id: 205,
    name: 'Pañuelo de Seda',
    category: 'Pañuelos',
    size: 'Chico',
    price: 60,
    material: 'Seda',
    color: 'Azul',
    image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&auto=format&fit=crop',
  },
  {
    id: 206,
    name: 'Sombrero Panamá',
    category: 'Sombreros',
    size: 'Grande',
    price: 145,
    material: 'Paja',
    color: 'Blanco',
    image: 'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=400&auto=format&fit=crop',
  },
  {
    id: 207,
    name: 'Pulsera de Oro',
    category: 'Joyería',
    size: 'Chico',
    price: 385,
    material: 'Metal',
    color: 'Marrón',
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&auto=format&fit=crop',
  },
  {
    id: 208,
    name: 'Cartera Slim',
    category: 'Bolsos',
    size: 'Chico',
    price: 90,
    material: 'Cuero',
    color: 'Negro',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&auto=format&fit=crop',
  },
];

const categories = ['Bolsos', 'Cinturones', 'Joyería', 'Gafas', 'Pañuelos', 'Sombreros'];
const sizes = ['Grande', 'Mediano', 'Chico'];
const materials = ['Cuero', 'Metal', 'Seda', 'Perla', 'Paja'];
const colors = ['Negro', 'Azul', 'Blanco', 'Gris', 'Marrón'];

export default function Accesorios() {
  const [filters, setFilters] = useState({
    category: [],
    size: [],
    priceMin: 0,
    priceMax: 1000,
    material: [],
    color: [],
  });

  const { isFav, toggle } = useFavourites();

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

  const filteredProducts = PRODUCTS.filter((p) => {
    const { category, size, priceMin, priceMax, material, color } = filters;
    return (
      (category.length === 0 || category.includes(p.category)) &&
      (size.length === 0 || size.includes(p.size)) &&
      (material.length === 0 || material.includes(p.material)) &&
      (color.length === 0 || color.includes(p.color)) &&
      p.price >= priceMin && p.price <= priceMax
    );
  });

  return (
    <div className="mujer-page">
      <h1 className="page-title">Accesorios</h1>
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
          {filteredProducts.length === 0 ? (
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
