import React, { useState } from 'react';
import './Mujer.css';
import FiltersSidebar from '../components/FiltersSidebar';
import ProductCard from '../components/ProductCard';
import useFavourites from '../hooks/useFavourites';

const PRODUCTS = [
  {
    id: 301,
    name: 'Vestido de Verano',
    category: 'Vestidos',
    size: 'Mediano',
    price: 85,
    material: 'Lino',
    color: 'Blanco',
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&auto=format&fit=crop',
  },
  {
    id: 302,
    name: 'Camisa Slim Fit',
    category: 'Camisas',
    size: 'Chico',
    price: 55,
    material: 'Algodón',
    color: 'Azul',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&auto=format&fit=crop',
  },
  {
    id: 303,
    name: 'Blazer Estructurado',
    category: 'Blazers',
    size: 'Grande',
    price: 210,
    material: 'Lana',
    color: 'Gris',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4bca6c?w=400&auto=format&fit=crop',
  },
  {
    id: 304,
    name: 'Pantalón de Cuero',
    category: 'Pantalones',
    size: 'Mediano',
    price: 175,
    material: 'Cuero',
    color: 'Negro',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&auto=format&fit=crop',
  },
  {
    id: 305,
    name: 'Abrigo Vintage',
    category: 'Abrigos',
    size: 'Grande',
    price: 290,
    material: 'Lana',
    color: 'Marrón',
    image: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400&auto=format&fit=crop',
  },
  {
    id: 306,
    name: 'Falda Midi',
    category: 'Faldas',
    size: 'Mediano',
    price: 75,
    material: 'Algodón',
    color: 'Negro',
    image: 'https://images.unsplash.com/photo-1551163943-3f7253a97e63?w=400&auto=format&fit=crop',
  },
  {
    id: 307,
    name: 'Jersey Oversize',
    category: 'Jerseys',
    size: 'Grande',
    price: 110,
    material: 'Lana',
    color: 'Gris',
    image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&auto=format&fit=crop',
  },
  {
    id: 308,
    name: 'Bolso Tote',
    category: 'Bolsos',
    size: 'Grande',
    price: 130,
    material: 'Algodón',
    color: 'Blanco',
    image: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=400&auto=format&fit=crop',
  },
];

const categories = ['Vestidos', 'Camisas', 'Blazers', 'Pantalones', 'Abrigos', 'Faldas', 'Jerseys'];
const sizes = ['Grande', 'Mediano', 'Chico'];
const materials = ['Lino', 'Algodón', 'Lana', 'Cuero'];
const colors = ['Negro', 'Azul', 'Blanco', 'Gris', 'Marrón'];

export default function Rebajas() {
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
