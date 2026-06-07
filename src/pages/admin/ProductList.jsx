import React, { useEffect, useState } from 'react';
import { subscribeProducts, deleteProduct } from '../../firebase/firestore';

const ProductList = ({ onEditProduct }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeProducts((data) => {
      setProducts(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        await deleteProduct(id);
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
              <th>Precio</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">No hay productos disponibles.</td>
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
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)} 
                        className="btn-delete"
                        title="Eliminar"
                      >
                        🗑️
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
