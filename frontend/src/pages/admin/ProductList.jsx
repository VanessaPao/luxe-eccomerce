import React, { useEffect, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE_URL, authFetch } from '../../utils/api';
import { Trash2, Pencil } from 'lucide-react';

const DEPT_FILTERS = [
  { key: 'todos', label: 'Todos' },
  { key: 'mujer', label: 'Mujer' },
  { key: 'hombre', label: 'Hombre' },
  { key: 'accesorios', label: 'Accesorios' },
  { key: 'rebajas', label: 'Rebajas' },
];

const ITEMS_PER_PAGE = 10;

const ProductList = ({ onEditProduct, refreshKey }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products`);
        if (!res.ok) throw new Error('Error al obtener productos');
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error('Error cargando productos:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [refreshKey]);

  const filteredProducts = useMemo(() => {
    if (activeFilter === 'todos') return products;
    if (activeFilter === 'rebajas') return products.filter(p => p.sale === true || p.sale === 'true');
    return products.filter(p => (p.department || '').toLowerCase() === activeFilter);
  }, [products, activeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        const res = await authFetch(`${API_BASE_URL}/api/products/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Error al eliminar');
        setProducts(prev => prev.filter(p => p.id !== id));
      } catch (error) {
        console.error('Error al eliminar producto:', error);
        alert('No se pudo eliminar el producto.');
      }
    }
  };

  if (loading) {
    return <div className="loading-spinner">Cargando productos...</div>;
  }

  return (
    <div className="product-list-container">
      <div className="product-list-header">
        <h2>Gestión de Productos ({filteredProducts.length}{activeFilter !== 'todos' ? ` de ${products.length}` : ''})</h2>
        <div className="admin-dept-filters">
          {DEPT_FILTERS.map(f => (
            <button
              key={f.key}
              className={`admin-dept-btn${activeFilter === f.key ? ' active' : ''}`}
              onClick={() => { setActiveFilter(f.key); setCurrentPage(1); }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Nombre</th>
              <th>Departamento</th>
              <th>Tipo</th>
              <th>Precio Normal</th>
              <th>En Rebaja</th>
              <th>Precio Rebajado</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center">No hay productos en esta página.</td>
              </tr>
            ) : (
              paginatedProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <img 
                      src={product.image || 'https://via.placeholder.com/50'} 
                      alt={product.name} 
                      className="admin-product-img"
                    />
                  </td>
                  <td>{product.name}</td>
                  <td className="capitalize">{product.department || product.category}</td>
                  <td>{product.type || '-'}</td>
                  <td>${product.price}</td>
                  <td>
                    <span style={{ 
                      fontWeight: 'bold', 
                      color: product.sale ? '#d93025' : '#555',
                      backgroundColor: product.sale ? '#fce8e6' : '#f1f3f4',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.85rem'
                    }}>
                      {product.sale ? 'Rebaja' : 'No'}
                    </span>
                  </td>
                  <td>{product.sale && product.salePrice !== undefined && product.salePrice !== null ? `$${product.salePrice}` : '-'}</td>
                  <td>
                    <span className={`stock-badge ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => onEditProduct(product)} 
                        className="btn-edit"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)} 
                        className="btn-delete"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button
            className="admin-pagination-btn"
            disabled={safeCurrentPage <= 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="admin-pagination-info">
            Página {safeCurrentPage} de {totalPages}
          </span>
          <button
            className="admin-pagination-btn"
            disabled={safeCurrentPage >= totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductList;
