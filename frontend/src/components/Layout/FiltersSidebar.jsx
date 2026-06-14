import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
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
  maxPrice = 1000,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Bloquear scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    if (drawerOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [drawerOpen]);

  // Función de selección única (radio): si ya está seleccionado, lo deselecciona;
  // si no, limpia y selecciona solo el nuevo valor.
  const selectFilter = (key, value) => {
    if (filters[key].includes(value)) {
      clearFilter(key);
    } else {
      clearFilter(key);
      toggleArrayFilter(key, value);
    }
  };

  const filterContent = (
    <>
      {/* Categoría */}
      <section className="filter-group">
        <h3>Categoría</h3>
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
            onClick={(e) => { e.preventDefault(); selectFilter('category', cat); }}
            style={{ cursor: 'pointer' }}
          >
            <span className={`filter-radio${filters.category.includes(cat) ? ' checked' : ''}`} />
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
            onClick={(e) => { e.preventDefault(); selectFilter('size', sz); }}
            style={{ cursor: 'pointer' }}
          >
            <span className={`filter-radio${filters.size.includes(sz) ? ' checked' : ''}`} />
            {sz}
          </label>
        ))}
      </section>

      {/* Precio */}
      <section className="filter-group">
        <h3>Precio</h3>
        <div className="price-dual-range">
          <div
            className="price-track"
            style={{
              '--price-min': `${(filters.priceMin / maxPrice) * 100}%`,
              '--price-max': `${(filters.priceMax / maxPrice) * 100}%`,
            }}
          />
          <input
            type="range"
            name="priceMin"
            min="0"
            max={maxPrice}
            value={filters.priceMin}
            onChange={handlePriceChange}
            className="price-thumb price-thumb-min"
          />
          <input
            type="range"
            name="priceMax"
            min="0"
            max={maxPrice}
            value={filters.priceMax}
            onChange={handlePriceChange}
            className="price-thumb price-thumb-max"
          />
        </div>
        <div className="price-values">
          ${filters.priceMin} – ${filters.priceMax}
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
            onClick={(e) => { e.preventDefault(); selectFilter('material', mat); }}
            style={{ cursor: 'pointer' }}
          >
            <span className={`filter-radio${filters.material.includes(mat) ? ' checked' : ''}`} />
            {mat}
          </label>
        ))}
      </section>

      {/* Color */}
      <section className="filter-group color-group">
        <h3>Color</h3>
        {colors.map((col) => (
          <label key={col} className="filter-option color-option" style={{ cursor: 'pointer' }}>
            <span
              className="color-circle"
              onClick={(e) => { e.preventDefault(); selectFilter('color', col); }}
              style={{
                backgroundColor: COLOR_MAP[col] || col.toLowerCase(),
                outline: filters.color.includes(col) ? '2px solid var(--accent-gold)' : 'none',
                outlineOffset: '2px',
              }}
              title={col}
            />
          </label>
        ))}
      </section>
    </>
  );

  return (
    <>
      {/* ── Botón "Filtros" — solo visible en móvil ── */}
      <button
        className="filters-mobile-toggle"
        onClick={() => setDrawerOpen(true)}
        aria-label="Abrir filtros"
      >
        <SlidersHorizontal size={16} />
        Filtros
      </button>

      {/* ── Sidebar desktop — visible solo en desktop ── */}
      <aside className="filters-sidebar">
        {filterContent}
      </aside>

      {/* ── Drawer móvil — overlay + panel deslizante ── */}
      {drawerOpen && (
        <div className="filters-drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div
            className="filters-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="filters-drawer-header">
              <h2>Filtros</h2>
              <button
                className="filters-drawer-close"
                onClick={() => setDrawerOpen(false)}
                aria-label="Cerrar filtros"
              >
                <X size={20} />
              </button>
            </div>
            <div className="filters-drawer-body">
              {filterContent}
            </div>
            <div className="filters-drawer-footer">
              <button
                className="filters-drawer-apply"
                onClick={() => setDrawerOpen(false)}
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
