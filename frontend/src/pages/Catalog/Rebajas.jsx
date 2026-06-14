import './Mujer.css';
import FiltersSidebar from '../../components/Layout/FiltersSidebar';
import ProductCard from '../../components/ProductCard';
import useFavourites from '../../hooks/useFavourites';
import useFilteredProducts from '../../hooks/useFilteredProducts';

const categories = ['Vestidos', 'Pantalones', 'Camisas', 'Abrigos', 'Zapatos', 'Faldas', 'Chaquetas', 'Trajes', 'Bolsos', 'Cinturones', 'Joyería', 'Gafas', 'Pañuelos', 'Sombreros'];
const sizes = ['Grande', 'Mediano', 'Chico'];
const materials = ['Seda', 'Algodón', 'Lino', 'Lana', 'Cuero', 'Metal', 'Perla', 'Paja'];
const colors = ['Negro', 'Azul', 'Blanco', 'Gris', 'Marrón'];

export default function Rebajas() {
  const { products, loading, filters, toggleArrayFilter, clearFilter, handlePriceChange, maxPrice } = useFilteredProducts({ saleOnly: true });
  const { isFav, toggle } = useFavourites();

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
          maxPrice={maxPrice}
        />
        <section className="products-grid">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          ) : products.length === 0 ? (
            <p className="no-results">No hay productos que coincidan con los filtros.</p>
          ) : (
            products.map((p) => (
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
