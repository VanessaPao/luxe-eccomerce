import React, { useState } from 'react';
import './Mujer.css';
import FiltersSidebar from '../components/FiltersSidebar';
import ProductCard from '../components/ProductCard';
import useFavourites from '../hooks/useFavourites';

const PRODUCTS = [
  {
    id: 1,
    name: 'Vestido Elegante',
    category: 'Vestidos',
    size: 'Grande',
    price: 350,
    material: 'Seda',
    color: 'Negro',
    image: 'https://images.unsplash.com/photo-1520975912219-2b3c7e5a0b4f?w=400&auto=format&fit=crop',
  },
  {
    id: 2,
    name: 'Pantalón Denim',
    category: 'Pantalones',
    size: 'Mediano',
    price: 120,
    material: 'Algodón',
    color: 'Azul',
    image: 'https://images.unsplash.com/photo-1512499617640-71bff8c6ef0d?w=400&auto=format&fit=crop',
  },
  {
    id: 3,
    name: 'Camisa Blanca',
    category: 'Camisas',
    size: 'Chico',
    price: 80,
    material: 'Lino',
    color: 'Blanco',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&auto=format&fit=crop',
  },
  {
    id: 4,
    name: 'Abrigo de Lana',
    category: 'Abrigos',
    size: 'Grande',
    price: 620,
    material: 'Lana',
    color: 'Gris',
    image: 'https://images.unsplash.com/photo-1542068829-1115f725f81a?w=400&auto=format&fit=crop',
  },
  {
    id: 5,
    name: 'Zapatos de Cuero',
    category: 'Zapatos',
    size: 'Mediano',
    price: 210,
    material: 'Cuero',
    color: 'Marrón',
    image: 'https://images.unsplash.com/photo-1485963631009-8fa4a09e9d9f?w=400&auto=format&fit=crop',
  },
  {
    id: 6,
    name: 'Falda Plisada',
    category: 'Faldas',
    size: 'Chico',
    price: 95,
    material: 'Algodón',
    color: 'Blanco',
    image: 'https://images.unsplash.com/photo-1583496661160-fb5218afa9a4?w=400&auto=format&fit=crop',
  },
  {
    id: 7,
    name: 'Blusa Floral',
    category: 'Camisas',
    size: 'Mediano',
    price: 65,
    material: 'Lino',
    color: 'Azul',
    image: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&auto=format&fit=crop',
  },
  {
    id: 8,
    name: 'Chaqueta Cuero',
    category: 'Chaquetas',
    size: 'Grande',
    price: 480,
    material: 'Cuero',
    color: 'Negro',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&auto=format&fit=crop',
  },
  {
    id: 9,
    name: 'Vestido Midi',
    category: 'Vestidos',
    size: 'Mediano',
    price: 145,
    material: 'Lino',
    color: 'Blanco',
    image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&auto=format&fit=crop',
  },
  {
    id: 10,
    name: 'Blazer Sastre',
    category: 'Chaquetas',
    size: 'Grande',
    price: 390,
    material: 'Lana',
    color: 'Gris',
    image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&auto=format&fit=crop',
  },
  {
    id: 11,
    name: 'Top Satinado',
    category: 'Camisas',
    size: 'Chico',
    price: 58,
    material: 'Seda',
    color: 'Azul',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&auto=format&fit=crop',
  },
  {
    id: 12,
    name: 'Pantalón Recto',
    category: 'Pantalones',
    size: 'Mediano',
    price: 135,
    material: 'Algodón',
    color: 'Negro',
    image: 'https://images.unsplash.com/photo-1584865288642-42078afe6942?w=400&auto=format&fit=crop',
  },
  {
    id: 13,
    name: 'Abrigo Largo',
    category: 'Abrigos',
    size: 'Grande',
    price: 560,
    material: 'Lana',
    color: 'Marrón',
    image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&auto=format&fit=crop',
  },
  {
    id: 14,
    name: 'Falda Plisada',
    category: 'Faldas',
    size: 'Chico',
    price: 92,
    material: 'Algodón',
    color: 'Blanco',
    image: 'https://images.unsplash.com/photo-1583496661160-fb5218afa9a4?w=400&auto=format&fit=crop',
  },
  {
    id: 15,
    name: 'Zapato Estilo Mary Jane',
    category: 'Zapatos',
    size: 'Mediano',
    price: 225,
    material: 'Cuero',
    color: 'Negro',
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&auto=format&fit=crop',
  },
  {
    id: 16,
    name: 'Chaqueta Denim',
    category: 'Chaquetas',
    size: 'Mediano',
    price: 180,
    material: 'Algodón',
    color: 'Azul',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&auto=format&fit=crop',
  },
];

const categories = ['Vestidos', 'Pantalones', 'Camisas', 'Abrigos', 'Zapatos', 'Faldas', 'Chaquetas'];
const sizes = ['Grande', 'Mediano', 'Chico'];
const materials = ['Seda', 'Algodón', 'Lino', 'Lana', 'Cuero'];
const colors = ['Negro', 'Azul', 'Blanco', 'Gris', 'Marrón'];

export default function Mujer() {
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
      <h1 className="page-title">Mujer</h1>
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
