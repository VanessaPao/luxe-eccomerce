import React, { useState, useEffect } from 'react';
import './Mujer.css';
// Importamos el componente de filtros de la barra lateral
import FiltersSidebar from '../components/FiltersSidebar';
// Importamos el componente de la tarjeta de producto
import ProductCard from '../components/ProductCard';
// Hook personalizado para verificar y alternar productos favoritos en Firestore
import useFavourites from '../hooks/useFavourites';
// Función para traer todos los productos de Firestore
import { getProducts } from '../firebase/firestore';

// Opciones predefinidas para los filtros (se muestran en la barra lateral)
const categories = ['Vestidos', 'Pantalones', 'Camisas', 'Abrigos', 'Zapatos', 'Faldas', 'Chaquetas'];
const sizes = ['Grande', 'Mediano', 'Chico'];
const materials = ['Seda', 'Algodón', 'Lino', 'Lana', 'Cuero'];
const colors = ['Negro', 'Azul', 'Blanco', 'Gris', 'Marrón'];

export default function Mujer() {
  // Estado para guardar la lista total de productos traídos de Firestore
  const [products, setProducts] = useState([]);
  
  // Estado para controlar si el componente está cargando los datos
  const [loading, setLoading] = useState(true);
  
  // Estado para almacenar los valores de los filtros seleccionados por el usuario
  const [filters, setFilters] = useState({
    category: [],
    size: [],
    priceMin: 0,
    priceMax: 1000,
    material: [],
    color: [],
  });

  // Obtenemos las funciones e información del hook de favoritos
  const { isFav, toggle } = useFavourites();

  // Hook useEffect que se ejecuta una sola vez cuando el componente se monta (carga por primera vez)
  useEffect(() => {
    // Variable para controlar si el componente sigue montado y evitar fugas de memoria
    let active = true;
    
    // Función interna asíncrona para obtener los productos
    const fetchProducts = async () => {
      try {
        // Obtenemos los productos desde Firestore
        const data = await getProducts();
        // Si el componente sigue activo/montado, actualizamos los estados correspondientes
        if (active) {
          setProducts(data); // Guardamos los productos en el estado
          setLoading(false); // Apagamos el indicador de carga
        }
      } catch (error) {
        // En caso de error, lo mostramos en la consola
        console.error('Error fetching products from Firestore:', error);
        // Si sigue montado, apagamos el indicador de carga para no dejar al usuario esperando indefinidamente
        if (active) {
          setLoading(false);
        }
      }
    };
    
    // Ejecutamos la función de carga
    fetchProducts();
    
    // Función de limpieza que se ejecuta cuando el componente se desmonta
    return () => {
      active = false; // Marcamos como inactivo para cancelar actualizaciones pendientes
    };
  }, []);

  // Función para activar/desactivar filtros de selección múltiple (arreglos)
  const toggleArrayFilter = (key, value) => {
    setFilters((prev) => {
      const current = new Set(prev[key]); // Usamos Set para buscar y manipular de forma óptima
      // Si ya tiene el valor lo quitamos, si no lo tiene lo agregamos
      current.has(value) ? current.delete(value) : current.add(value);
      // Retornamos el estado anterior pero con la propiedad actualizada como un array limpio
      return { ...prev, [key]: Array.from(current) };
    });
  };

  // Función para vaciar/limpiar un filtro específico (por ejemplo, limpiar todas las categorías)
  const clearFilter = (key) => {
    setFilters((prev) => ({ ...prev, [key]: [] }));
  };

  // Función para manejar el cambio en el rango de precios (mínimo y máximo)
  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    // Actualizamos el estado de filtros convirtiendo el valor a tipo numérico
    setFilters((prev) => ({ ...prev, [name]: Number(value) }));
  };

  // Paso 1: Filtramos los productos para mostrar únicamente los que pertenecen al departamento "mujer"
  const mujerProducts = products
    .filter((p) => p.department === 'mujer' || p.category === 'mujer')
    // Mapeamos el resultado para normalizar el campo 'category' que lee ProductCard y los filtros
    .map((p) => ({
      ...p,
      // Si el producto tiene 'type' (ej. Vestidos), lo usamos como category. Si no, mantenemos el original.
      category: p.type || p.category,
    }));

  // Paso 2: Filtramos localmente en el cliente con las opciones seleccionadas en el Sidebar
  const filteredProducts = mujerProducts.filter((p) => {
    const { category, size, priceMin, priceMax, material, color } = filters;
    return (
      // Si no hay categorías seleccionadas, pasa el filtro. Si hay, el tipo/categoría debe estar incluido en la lista.
      (category.length === 0 || category.includes(p.category)) &&
      // Si no hay tallas seleccionadas, pasa. Si hay, la talla del producto debe coincidir.
      (size.length === 0 || size.includes(p.size)) &&
      // Si no hay materiales seleccionados, pasa. Si hay, el material debe coincidir.
      (material.length === 0 || material.includes(p.material)) &&
      // Si no hay colores seleccionados, pasa. Si hay, el color debe coincidir.
      (color.length === 0 || color.includes(p.color)) &&
      // El precio del producto debe estar dentro del rango mínimo y máximo configurado en la barra lateral
      p.price >= priceMin && p.price <= priceMax
    );
  });

  return (
    <div className="mujer-page">
      {/* Título de la página */}
      <h1 className="page-title">Mujer</h1>
      
      <div className="content-wrapper">
        {/* Componente lateral de filtros pasando los estados y funciones creadas */}
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
        
        {/* Grid de productos */}
        <section className="products-grid">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            /* Si no cargamos, pero la lista resultante está vacía, mostramos mensaje */
            <p className="no-results">No hay productos que coincidan con los filtros.</p>
          ) : (
            /* Si hay productos, mapeamos cada uno y renderizamos su tarjeta de producto */
            filteredProducts.map((p) => (
              <ProductCard
                key={p.id} // Clave única requerida por React
                product={p} // Objeto del producto
                isFav={isFav(p.id)} // Verifica si está marcado como favorito
                onToggleFav={toggle} // Función para añadir/remover favoritos en base al ID
              />
            ))
          )}
        </section>
      </div>
    </div>
  );
}
