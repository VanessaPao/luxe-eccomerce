import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, authFetch } from '../../utils/api';
import { uploadImageToCloudinary } from '../../utils/cloudinary';
import { Image, Plus, Trash2, Eye, EyeOff, Save, X, ArrowUp, ArrowDown } from 'lucide-react';
import './Admin.css';

const CarouselManager = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSlide, setEditingSlide] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const emptySlide = {
    image: '',
    tag: '',
    title: '',
    subtitle: '',
    ctaText: 'Explorar',
    ctaLink: '/mujer',
    order: 0,
    active: true,
  };

  const fetchSlides = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/carousel`);
      if (res.ok) {
        const data = await res.json();
        setSlides(data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      }
    } catch (err) {
      console.error('Error cargando slides:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setEditingSlide((prev) => ({ ...prev, image: url }));
    } catch (err) {
      console.error('Error subiendo imagen:', err);
      alert('Error al subir la imagen. Verifica tus credenciales de Cloudinary.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!editingSlide.image || !editingSlide.title) {
      alert('La imagen y el título son obligatorios.');
      return;
    }
    setSaving(true);
    try {
      const isNew = !editingSlide.id;
      const url = isNew
        ? `${API_BASE_URL}/api/carousel`
        : `${API_BASE_URL}/api/carousel/${editingSlide.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSlide),
      });

      if (!res.ok) throw new Error('Error al guardar');
      setEditingSlide(null);
      setIsCreating(false);
      await fetchSlides();
    } catch (err) {
      console.error('Error guardando slide:', err);
      alert('Error al guardar el slide.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este slide?')) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/api/carousel/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      await fetchSlides();
    } catch (err) {
      console.error('Error eliminando slide:', err);
      alert('Error al eliminar el slide.');
    }
  };

  const handleToggleActive = async (slide) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/api/carousel/${slide.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !slide.active }),
      });
      if (!res.ok) throw new Error('Error');
      await fetchSlides();
    } catch (err) {
      console.error('Error toggling slide:', err);
      alert('Error al actualizar el slide.');
    }
  };

  const handleSeedDefaults = async () => {
    if (!window.confirm('¿Cargar los 5 slides por defecto? No se duplicarán si ya existen.')) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/api/carousel/seed`, { method: 'POST' });
      const data = await res.json();
      alert(data.message);
      await fetchSlides();
    } catch (err) {
      console.error('Error sembrando slides:', err);
      alert('Error al cargar slides por defecto.');
    }
  };

  const handleMove = async (index, direction) => {
    const newSlides = [...slides];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= newSlides.length) return;

    [newSlides[index], newSlides[swapIndex]] = [newSlides[swapIndex], newSlides[index]];
    const reordered = newSlides.map((s, i) => ({ ...s, order: i }));
    setSlides(reordered);

    try {
      await authFetch(`${API_BASE_URL}/api/carousel/reorder/batch`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides: reordered.map(s => ({ id: s.id, order: s.order })) }),
      });
    } catch (err) {
      console.error('Error reordenando:', err);
      await fetchSlides();
    }
  };

  // ── Formulario de edición ──
  if (editingSlide) {
    return (
      <div className="carousel-manager-form">
        <div className="carousel-form-header">
          <h3>{isCreating ? 'Nuevo Slide' : 'Editar Slide'}</h3>
          <button className="admin-btn-icon" onClick={() => { setEditingSlide(null); setIsCreating(false); }}>
            <X size={18} />
          </button>
        </div>

        <div className="carousel-form-body">
          {/* Preview de imagen */}
          <div className="carousel-image-preview">
            {editingSlide.image ? (
              <img src={editingSlide.image} alt="Preview" />
            ) : (
              <div className="carousel-image-placeholder">
                <Image size={32} />
                <span>1920 × 1080 px (16:9)</span>
              </div>
            )}
          </div>

          {/* Upload */}
          <label className="carousel-upload-btn">
            {uploading ? 'Subiendo...' : 'Cambiar imagen (1920×1080)'}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>

          {/* Campos */}
          <div className="carousel-form-fields">
            <div className="form-group">
              <label>Tag (etiqueta superior)</label>
              <input
                type="text"
                value={editingSlide.tag}
                onChange={(e) => setEditingSlide({ ...editingSlide, tag: e.target.value })}
                placeholder="Ej: JUST DROPPED, Y2K COLLECTION"
              />
            </div>

            <div className="form-group">
              <label>Título (máximo 4 palabras) *</label>
              <input
                type="text"
                value={editingSlide.title}
                onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                placeholder="Ej: Tu nueva era"
                required
              />
            </div>

            <div className="form-group">
              <label>Subtítulo (1 frase corta)</label>
              <input
                type="text"
                value={editingSlide.subtitle}
                onChange={(e) => setEditingSlide({ ...editingSlide, subtitle: e.target.value })}
                placeholder="Ej: Moda premium que define tendencia."
              />
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label>Texto del botón CTA</label>
                <input
                  type="text"
                  value={editingSlide.ctaText}
                  onChange={(e) => setEditingSlide({ ...editingSlide, ctaText: e.target.value })}
                  placeholder="Ej: Ver Ahora"
                />
              </div>
              <div className="form-group">
                <label>Enlace del botón</label>
                <input
                  type="text"
                  value={editingSlide.ctaLink}
                  onChange={(e) => setEditingSlide({ ...editingSlide, ctaLink: e.target.value })}
                  placeholder="Ej: /mujer"
                />
              </div>
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label>Orden</label>
                <input
                  type="number"
                  value={editingSlide.order}
                  onChange={(e) => setEditingSlide({ ...editingSlide, order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label>Activo</label>
                <button
                  type="button"
                  className={`toggle-btn ${editingSlide.active ? 'active' : ''}`}
                  onClick={() => setEditingSlide({ ...editingSlide, active: !editingSlide.active })}
                >
                  {editingSlide.active ? <><Eye size={14} /> Sí</> : <><EyeOff size={14} /> No</>}
                </button>
              </div>
            </div>
          </div>

          <div className="carousel-form-actions">
            <button className="admin-btn-cancel" onClick={() => { setEditingSlide(null); setIsCreating(false); }}>
              Cancelar
            </button>
            <button className="admin-btn-primary" onClick={handleSave} disabled={saving || uploading}>
              <Save size={14} />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Lista de slides ──
  return (
    <div className="carousel-manager">
      <div className="carousel-manager-header">
        <p className="carousel-manager-hint">
          Imágenes recomendadas: <strong>1920 × 1080 px</strong> (relación 16:9). Formato JPG o WebP, menos de 300 KB.
        </p>
        <button
          className="admin-btn-primary"
          onClick={() => { setEditingSlide({ ...emptySlide }); setIsCreating(true); }}
        >
          <Plus size={14} /> Nuevo Slide
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)', padding: '2rem' }}>Cargando slides...</p>
      ) : slides.length === 0 ? (
        <div className="carousel-empty">
          <Image size={48} />
          <p>No hay slides en el carrusel.</p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              className="admin-btn-primary"
              onClick={handleSeedDefaults}
            >
              Cargar slides por defecto
            </button>
            <button
              className="admin-btn-cancel"
              onClick={() => { setEditingSlide({ ...emptySlide }); setIsCreating(true); }}
            >
              <Plus size={14} /> Crear desde cero
            </button>
          </div>
        </div>
      ) : (
        <div className="carousel-slides-list">
          {slides.map((slide, index) => (
            <div key={slide.id} className={`carousel-slide-item ${!slide.active ? 'inactive' : ''}`}>
              <div className="carousel-slide-preview">
                {slide.image ? (
                  <img src={slide.image} alt={slide.title} />
                ) : (
                  <div className="carousel-image-placeholder small"><Image size={20} /></div>
                )}
              </div>
              <div className="carousel-slide-info">
                <div className="carousel-slide-tag">{slide.tag || 'Sin tag'}</div>
                <div className="carousel-slide-title">{slide.title}</div>
                <div className="carousel-slide-subtitle">{slide.subtitle}</div>
                <div className="carousel-slide-cta">
                  CTA: <strong>{slide.ctaText}</strong> → {slide.ctaLink}
                </div>
              </div>
              <div className="carousel-slide-actions">
                <button title="Mover arriba" onClick={() => handleMove(index, -1)} disabled={index === 0}>
                  <ArrowUp size={14} />
                </button>
                <button title="Mover abajo" onClick={() => handleMove(index, 1)} disabled={index === slides.length - 1}>
                  <ArrowDown size={14} />
                </button>
                <button title={slide.active ? 'Ocultar' : 'Mostrar'} onClick={() => handleToggleActive(slide)}>
                  {slide.active ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button title="Editar" onClick={() => { setEditingSlide(slide); setIsCreating(false); }}>
                  ✏️
                </button>
                <button title="Eliminar" onClick={() => handleDelete(slide.id)} className="delete-btn">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CarouselManager;
