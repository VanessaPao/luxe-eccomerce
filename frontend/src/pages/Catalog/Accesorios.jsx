import './Mujer.css';
import FiltersSidebar from '../../components/Layout/FiltersSidebar';
import ProductCard from '../../components/ProductCard';
import useFavourites from '../../hooks/useFavourites';
import useFilteredProducts from '../../hooks/useFilteredProducts';

const categories = ['Bolsos', 'Cinturones', 'Joyería', 'Gafas', 'Pañuelos', 'Sombreros', 'Mochilas'];
const sizes = [];
const materials = ['Cuero', 'Metal', 'Seda', 'Perla', 'Paja', 'Lino', 'Algodón'];
const colors = ['Negro', 'Azul', 'Blanco', 'Gris', 'Multicolor'];

export default function Accesorios() {
  const { products, loading, filters, toggleArrayFilter, clearFilter, handlePriceChange, maxPrice } = useFilteredProducts({ department: 'accesorios' });
  const { isFav, toggle } = useFavourites();

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
