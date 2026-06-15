import React, { useState, useEffect } from 'react';
import { uploadImageToCloudinary } from '../../utils/cloudinary';
import { API_BASE_URL, authFetch } from '../../utils/api';
import CustomSelect from '../../components/CustomSelect';

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

const SIZES = ['Grande', 'Mediano', 'Chico'];

const ProductForm = ({ editingProduct, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    department: 'mujer',
    type: 'Vestidos',
    material: 'Algodón',
    color: '',
    sizes: { Grande: 0, Mediano: 0, Chico: 0 },
    stock: '',
    image: '',
    description: '',
    sale: false,
    salePrice: '',
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasSizes = formData.department === 'mujer' || formData.department === 'hombre';

  useEffect(() => {
    if (editingProduct) {
      const dep = editingProduct.department || editingProduct.category || 'mujer';
      // Si el producto tiene sizes (mujer/hombre), usarlo; si no, crear desde stock simple
      let sizes = { Grande: 0, Mediano: 0, Chico: 0 };
      if (editingProduct.sizes && typeof editingProduct.sizes === 'object') {
        sizes = { Grande: 0, Mediano: 0, Chico: 0, ...editingProduct.sizes };
      } else if (editingProduct.size && editingProduct.stock) {
        // Producto viejo: asignar stock a su talla
        sizes[editingProduct.size] = editingProduct.stock;
      }

      setFormData({
        name: editingProduct.name || '',
        price: editingProduct.price || '',
        department: dep,
        type: editingProduct.type || 'Vestidos',
        material: editingProduct.material || 'Algodón',
        color: editingProduct.color || '',
        sizes,
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
        // Al cambiar departamento, resetear sizes/stock
        if (value === 'mujer' || value === 'hombre') {
          updated.sizes = { Grande: 0, Mediano: 0, Chico: 0 };
        } else {
          updated.stock = '';
        }
      }

      return updated;
    });
  };

  const handleSizeStockChange = (sizeName, value) => {
    const numVal = value === '' ? 0 : Math.max(0, parseInt(value) || 0);
    setFormData((prev) => ({
      ...prev,
      sizes: { ...prev.sizes, [sizeName]: numVal },
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
        name: formData.name,
        price: Number(formData.price),
        department: formData.department,
        type: formData.type,
        material: formData.material,
        color: formData.color,
        image: imageUrl,
        description: formData.description,
        sale: !!formData.sale,
        salePrice: formData.sale ? Number(formData.salePrice) : null,
        category: formData.department,
      };

      if (hasSizes) {
        productData.sizes = { ...formData.sizes };
      } else {
        productData.size = 'Única';
        productData.stock = Number(formData.stock) || 0;
      }

      if (editingProduct) {
        const res = await authFetch(`${API_BASE_URL}/api/products/${editingProduct.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Error al actualizar producto');
        }
      } else {
        const res = await authFetch(`${API_BASE_URL}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Error al crear producto');
        }
      }

      onSave();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Hubo un error al guardar el producto.');
    } finally {
      setLoading(false);
    }
  };

  const currentOptions = TYPE_OPTIONS[formData.department] || [];
  const optionsToRender = [...currentOptions];
  if (formData.type && !currentOptions.includes(formData.type)) {
    optionsToRender.unshift(formData.type);
  }

  const totalStock = hasSizes
    ? Object.values(formData.sizes).reduce((sum, v) => sum + (v || 0), 0)
    : Number(formData.stock) || 0;

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
            <label>Stock total: {totalStock}</label>
            {hasSizes && (
              <span style={{ fontSize: '0.75rem', color: '#888' }}>Calculado automáticamente</span>
            )}
            {!hasSizes && (
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
                min="0"
              />
            )}
          </div>
        </div>

        {/* ── Stock por talla (solo mujer/hombre) ── */}
        {hasSizes && (
          <div className="form-group">
            <label>Stock por Talla</label>
            <div className="form-group-row" style={{ gap: '0.75rem' }}>
              {SIZES.map((sz) => (
                <div key={sz} className="form-group" style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem' }}>{sz}</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sizes[sz] || ''}
                    onChange={(e) => handleSizeStockChange(sz, e.target.value)}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

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
            <CustomSelect
              name="department"
              value={formData.department === 'mujer' ? 'Mujer' : formData.department === 'hombre' ? 'Hombre' : 'Accesorios'}
              onChange={(e) => {
                const map = { Mujer: 'mujer', Hombre: 'hombre', Accesorios: 'accesorios' };
                handleChange({ target: { name: 'department', value: map[e.target.value] || e.target.value, type: 'text' } });
              }}
              options={['Mujer', 'Hombre', 'Accesorios']}
              required
            />
          </div>
          <div className="form-group">
            <label>Tipo</label>
            <CustomSelect
              name="type"
              value={formData.type}
              onChange={handleChange}
              options={optionsToRender}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Material</label>
          <CustomSelect
            name="material"
            value={formData.material}
            onChange={handleChange}
            options={['Seda', 'Algodón', 'Lino', 'Lana', 'Cuero', 'Metal', 'Perla', 'Paja']}
            required
          />
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
