import React from 'react';
import '../../pages/Catalog/Mujer.css';

const COLOR_MAP = {
  Negro: '#000000',
  Azul: '#1e90ff',
  Blanco: '#ffffff',
  Gris: '#808080',
  'Marrón': '#8b4513',
};

export default function FiltersSidebar({
  filters,
  toggleArrayFilter,
  clearFilter,
  handlePriceChange,
  categories,
  sizes,
  materials,
  colors,
}) {
  return (
    <aside className="filters-sidebar">

      {/* Categoría — con opción "Todos" */}
      <section className="filter-group">
        <h3>Categoría</h3>

        {/* "Todos" limpia la selección */}
        <label
          className={`filter-option${filters.category.length === 0 ? ' selected' : ''}`}
          onClick={() => clearFilter('category')}
          style={{ cursor: 'pointer' }}
        >
          Todos
        </label>

        {categories.map((cat) => (
          <label
            key={cat}
            className={`filter-option${filters.category.includes(cat) ? ' selected' : ''}`}
          >
            <input
              type="checkbox"
              checked={filters.category.includes(cat)}
              onChange={() => toggleArrayFilter('category', cat)}
              style={{ display: 'none' }}
            />
            {cat}
          </label>
        ))}
      </section>

      {/* Talla */}
      <section className="filter-group">
        <h3>Talla</h3>
        <label
          className={`filter-option${filters.size.length === 0 ? ' selected' : ''}`}
          onClick={() => clearFilter('size')}
          style={{ cursor: 'pointer' }}
        >
          Todas
        </label>
        {sizes.map((sz) => (
          <label
            key={sz}
            className={`filter-option${filters.size.includes(sz) ? ' selected' : ''}`}
          >
            <input
              type="checkbox"
              checked={filters.size.includes(sz)}
              onChange={() => toggleArrayFilter('size', sz)}
              style={{ display: 'none' }}
            />
            {sz}
          </label>
        ))}
      </section>

      {/* Precio */}
      <section className="filter-group">
        <h3>Precio</h3>
        <div className="price-range">
          <input
            type="range"
            name="priceMin"
            min="0"
            max="1000"
            value={filters.priceMin}
            onChange={handlePriceChange}
          />
          <input
            type="range"
            name="priceMax"
            min="0"
            max="1000"
            value={filters.priceMax}
            onChange={handlePriceChange}
          />
          <div className="price-values">
            ${filters.priceMin} – ${filters.priceMax}
          </div>
        </div>
      </section>

      {/* Material */}
      <section className="filter-group">
        <h3>Material</h3>
        <label
          className={`filter-option${filters.material.length === 0 ? ' selected' : ''}`}
          onClick={() => clearFilter('material')}
          style={{ cursor: 'pointer' }}
        >
          Todos
        </label>
        {materials.map((mat) => (
          <label
            key={mat}
            className={`filter-option${filters.material.includes(mat) ? ' selected' : ''}`}
          >
            <input
              type="checkbox"
              checked={filters.material.includes(mat)}
              onChange={() => toggleArrayFilter('material', mat)}
              style={{ display: 'none' }}
            />
            {mat}
          </label>
        ))}
      </section>

      {/* Color – horizontal */}
      <section className="filter-group color-group">
        <h3>Color</h3>
        {colors.map((col) => (
          <label key={col} className="filter-option color-option" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={filters.color.includes(col)}
              onChange={() => toggleArrayFilter('color', col)}
              style={{ display: 'none' }}
              aria-label={col}
            />
            <span
              className="color-circle"
              style={{
                backgroundColor: COLOR_MAP[col] || col.toLowerCase(),
                outline: filters.color.includes(col) ? '2px solid #ffd700' : 'none',
                outlineOffset: '2px',
              }}
              title={col}
            />
          </label>
        ))}
      </section>

    </aside>
  );
}
