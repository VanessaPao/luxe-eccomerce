import React, { useState } from 'react';
import './Mujer.css';
import FiltersSidebar from '../components/FiltersSidebar';
import ProductCard from '../components/ProductCard';
import useFavourites from '../hooks/useFavourites';

const PRODUCTS = [
  {
    id: 101,
    name: 'Traje Clásico',
    category: 'Trajes',
    size: 'Grande',
    price: 850,
    material: 'Lana',
    color: 'Negro',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop',
  },
  {
    id: 102,
    name: 'Camisa Oxford',
    category: 'Camisas',
    size: 'Mediano',
    price: 95,
    material: 'Algodón',
    color: 'Blanco',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&auto=format&fit=crop',
  },
  {
    id: 103,
    name: 'Pantalón Chino',
    category: 'Pantalones',
    size: 'Mediano',
    price: 130,
    material: 'Algodón',
    color: 'Gris',
    image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&auto=format&fit=crop',
  },
  {
    id: 104,
    name: 'Abrigo Largo',
    category: 'Abrigos',
    size: 'Grande',
    price: 490,
    material: 'Lana',
    color: 'Marrón',
    image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&auto=format&fit=crop',
  },
  {
    id: 105,
    name: 'Jeans Slim',
    category: 'Pantalones',
    size: 'Chico',
    price: 110,
    material: 'Algodón',
    color: 'Azul',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&auto=format&fit=crop',
  },
  {
    id: 106,
    name: 'Polo Piqué',
    category: 'Camisas',
    size: 'Mediano',
    price: 70,
    material: 'Algodón',
    color: 'Blanco',
    image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400&auto=format&fit=crop',
  },
  {
    id: 107,
    name: 'Chaqueta Blazer',
    category: 'Trajes',
    size: 'Grande',
    price: 340,
    material: 'Lana',
    color: 'Gris',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4bca6c?w=400&auto=format&fit=crop',
  },
  {
    id: 108,
    name: 'Zapato Derby',
    category: 'Zapatos',
    size: 'Mediano',
    price: 195,
    material: 'Cuero',
    color: 'Negro',
    image: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400&auto=format&fit=crop',
  },
];

const categories = ['Trajes', 'Camisas', 'Pantalones', 'Abrigos', 'Zapatos'];
const sizes = ['Grande', 'Mediano', 'Chico'];
const materials = ['Lana', 'Algodón', 'Lino', 'Cuero'];
const colors = ['Negro', 'Azul', 'Blanco', 'Gris', 'Marrón'];

export default function Hombre() {
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
      <h1 className="page-title">Hombre</h1>
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
