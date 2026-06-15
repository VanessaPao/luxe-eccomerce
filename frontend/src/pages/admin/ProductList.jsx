import React, { useEffect, useState } from 'react';
import { API_BASE_URL, authFetch } from '../../utils/api';
import { Trash2, Pencil } from 'lucide-react';

const ProductList = ({ onEditProduct, refreshKey }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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
        <h2>Gestión de Productos ({products.length})</h2>
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
            {products.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center">No hay productos disponibles.</td>
              </tr>
            ) : (
              products.map((product) => (
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
    </div>
  );
};

export default ProductList;
