import React, { useState, useEffect } from 'react';
import { uploadImageToCloudinary } from '../../utils/cloudinary';
import { API_BASE_URL } from '../../utils/api';

const TYPE_OPTIONS = {
  mujer: [
    'Vestidos',
    'Faldas',
    'Pantalones',
    'Camisas',
    'Chaquetas',
    'Abrigos',
    'Zapatos'
  ],
  hombre: [
    'Camisas',
    'Pantalones',
    'Hoodies',
    'Chaquetas',
    'Abrigos',
    'Zapatos'
  ],
  accesorios: [
    'Lentes',
    'Joyería',
    'Bolsas',
    'Relojes',
    'Pulseras',
    'Collares',
    'Anillos',
    'Aretes'
  ]
};

const SIZE_OPTIONS = {
  mujer: ['Chico', 'Mediano', 'Grande'],
  hombre: ['Chico', 'Mediano', 'Grande'],
  accesorios: ['Única']
};

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
    sale: false,
    salePrice: '',
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
        sale: editingProduct.sale || false,
        salePrice: editingProduct.salePrice || '',
      });
    }
  }, [editingProduct]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox'
          ? checked
          : (name === 'price' || name === 'stock' || name === 'salePrice' ? (value === '' ? '' : Number(value)) : value),
      };

      if (name === 'department') {
        const typeOpts = TYPE_OPTIONS[value] || [];
        if (typeOpts.length > 0) {
          updated.type = typeOpts[0];
        }
        const sizeOpts = SIZE_OPTIONS[value] || [];
        if (sizeOpts.length > 0) {
          updated.size = sizeOpts[0];
        }
      }

      return updated;
    });
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
        sale: !!formData.sale,
        salePrice: formData.sale ? Number(formData.salePrice) : null,
        category: formData.department, // Mantenemos compatibilidad
        image: imageUrl,
      };

      if (editingProduct) {
        const res = await fetch(`${API_BASE_URL}/api/products/${editingProduct.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });
        if (!res.ok) throw new Error('Error al actualizar producto');
      } else {
        const res = await fetch(`${API_BASE_URL}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });
        if (!res.ok) throw new Error('Error al crear producto');
      }

      onSave();
    } catch (err) {
      console.error(err);
      setError('Hubo un error al guardar el producto.');
    } finally {
      setLoading(false);
    }
  };

  const currentOptions = TYPE_OPTIONS[formData.department] || [];
  const optionsToRender = [...currentOptions];
  if (formData.type && !currentOptions.includes(formData.type)) {
    optionsToRender.unshift(formData.type);
  }

  const currentSizes = SIZE_OPTIONS[formData.department] || ['Chico', 'Mediano', 'Grande'];
  const sizesToRender = [...currentSizes];
  if (formData.size && !currentSizes.includes(formData.size)) {
    sizesToRender.unshift(formData.size);
  }

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
          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', alignSelf: 'center' }}>
            <input
              type="checkbox"
              name="sale"
              id="sale"
              checked={formData.sale}
              onChange={handleChange}
              style={{ width: 'auto', cursor: 'pointer', margin: 0 }}
            />
            <label htmlFor="sale" style={{ cursor: 'pointer', marginBottom: 0 }}>Producto en rebaja</label>
          </div>
          {formData.sale && (
            <div className="form-group">
              <label>Precio rebajado ($)</label>
              <input
                type="number"
                name="salePrice"
                value={formData.salePrice}
                onChange={handleChange}
                required={formData.sale}
                min="0"
                step="0.01"
              />
            </div>
          )}
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label>Departamento</label>
            <select name="department" value={formData.department} onChange={handleChange} required>
              <option value="mujer">Mujer</option>
              <option value="hombre">Hombre</option>
              <option value="accesorios">Accesorios</option>
            </select>
          </div>
          <div className="form-group">
            <label>Tipo</label>
            <select name="type" value={formData.type} onChange={handleChange} required>
              {optionsToRender.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label>Talla</label>
            <select name="size" value={formData.size} onChange={handleChange} required>
              {sizesToRender.map((sizeOption) => (
                <option key={sizeOption} value={sizeOption}>
                  {sizeOption}
                </option>
              ))}
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
