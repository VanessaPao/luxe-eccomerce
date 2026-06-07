import React, { useState, useEffect } from 'react';
import { uploadImageToCloudinary } from '../../utils/cloudinary';
import { createProduct, updateProduct } from '../../firebase/firestore';

const ProductForm = ({ editingProduct, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    department: 'mujer', // Replaces category visually
    type: 'Vestidos',
    size: 'Mediano',
    material: 'Algodón',
    color: '',
    stock: '',
    image: '',
    description: '',
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || '',
        price: editingProduct.price || '',
        department: editingProduct.department || editingProduct.category || 'mujer',
        type: editingProduct.type || 'Vestidos',
        size: editingProduct.size || 'Mediano',
        material: editingProduct.material || 'Algodón',
        color: editingProduct.color || '',
        stock: editingProduct.stock || '',
        image: editingProduct.image || '',
        description: editingProduct.description || '',
      });
    }
  }, [editingProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value,
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let imageUrl = formData.image;
      if (file) {
        imageUrl = await uploadImageToCloudinary(file);
      }

      const productData = {
        ...formData,
        category: formData.department, // Mantenemos compatibilidad
        image: imageUrl,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await createProduct(productData);
      }

      onSave();
    } catch (err) {
      console.error(err);
      setError('Hubo un error al guardar el producto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-form-container">
      <h3>{editingProduct ? 'Editar Producto' : 'Añadir Nuevo Producto'}</h3>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-group">
          <label>Nombre del Producto</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Ej. Bolso de cuero"
          />
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label>Precio ($)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label>Stock</label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              required
              min="0"
            />
          </div>
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label>Departamento</label>
            <select name="department" value={formData.department} onChange={handleChange} required>
              <option value="mujer">Mujer</option>
              <option value="hombre">Hombre</option>
              <option value="accesorios">Accesorios</option>
              <option value="rebajas">Rebajas</option>
            </select>
          </div>
          <div className="form-group">
            <label>Tipo de Prenda</label>
            <select name="type" value={formData.type} onChange={handleChange} required>
              <option value="Vestidos">Vestidos</option>
              <option value="Pantalones">Pantalones</option>
              <option value="Camisas">Camisas</option>
              <option value="Abrigos">Abrigos</option>
              <option value="Zapatos">Zapatos</option>
              <option value="Faldas">Faldas</option>
              <option value="Chaquetas">Chaquetas</option>
            </select>
          </div>
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label>Talla</label>
            <select name="size" value={formData.size} onChange={handleChange} required>
              <option value="Chico">Chico</option>
              <option value="Mediano">Mediano</option>
              <option value="Grande">Grande</option>
            </select>
          </div>
          <div className="form-group">
            <label>Material</label>
            <select name="material" value={formData.material} onChange={handleChange} required>
              <option value="Seda">Seda</option>
              <option value="Algodón">Algodón</option>
              <option value="Lino">Lino</option>
              <option value="Lana">Lana</option>
              <option value="Cuero">Cuero</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Color</label>
          <input
            type="text"
            name="color"
            value={formData.color}
            onChange={handleChange}
            placeholder="Ej. Negro, Rojo, Azul marino"
            required
          />
        </div>

        <div className="form-group">
          <label>Descripción</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            placeholder="Breve descripción del producto..."
          />
        </div>

        <div className="form-group">
          <label>Imagen del Producto</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          {formData.image && !file && (
            <div className="image-preview">
              <img src={formData.image} alt="Preview" width="100" />
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Producto'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
