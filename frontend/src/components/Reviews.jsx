import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, authFetch } from '../utils/api';
import { uploadImageToCloudinary } from '../utils/cloudinary';
import { MessageSquare, ThumbsUp, ThumbsDown, Trash2, Image as ImageIcon, Send, Star } from 'lucide-react';
import './Reviews.css';

const MAX_CHARS = 500;

export default function Reviews({ productId, onRatingChange }) {
  const { user, profile } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const isAdmin = profile?.role === 'admin';
  const charCount = text.length;

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews/${productId}`);
      if (res.ok) {
        const data = await res.json();      setReviews(data);
      // Notificar al padre del promedio de rating
      if (onRatingChange) {
        const rated = data.filter(r => r.rating);
        if (rated.length > 0) {
          const avg = rated.reduce((sum, r) => sum + r.rating, 0) / rated.length;
          onRatingChange(avg, rated.length);
        } else {
          onRatingChange(null, 0);
        }
      }
    }
  } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || text.length > MAX_CHARS) return;
    setSubmitting(true);
    setError('');

    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImageToCloudinary(imageFile);
      }

      const res = await authFetch(`${API_BASE_URL}/api/reviews/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userName: profile?.firstName
            ? `${profile.firstName} ${profile.lastName || ''}`.trim()
            : user.displayName || user.email || 'Anónimo',
          userPhoto: profile?.photoURL || user.photoURL || null,
          text: text.trim(),
          image: imageUrl,
          rating: rating > 0 ? rating : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al publicar review');
      }

      setText('');
      setRating(0);
      setHoverRating(0);
      setImageFile(null);
      setImagePreview(null);
      if (fileRef.current) fileRef.current.value = '';
      await fetchReviews();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('¿Eliminar este comentario?')) return;
    try {
      await authFetch(`${API_BASE_URL}/api/reviews/${productId}/${reviewId}`, { method: 'DELETE' });
      await fetchReviews();
    } catch (err) {
      console.error('Error deleting review:', err);
    }
  };

  const handleLike = async (reviewId) => {
    if (!user) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/api/reviews/${productId}/${reviewId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });
      if (res.ok) {
        const data = await res.json();
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? { ...r, likes: data.likes, dislikes: data.dislikes } : r))
        );
      }
    } catch (err) {
      console.error('Error liking review:', err);
    }
  };

  const handleDislike = async (reviewId) => {
    if (!user) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/api/reviews/${productId}/${reviewId}/dislike`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });
      if (res.ok) {
        const data = await res.json();
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? { ...r, likes: data.likes, dislikes: data.dislikes } : r))
        );
      }
    } catch (err) {
      console.error('Error disliking review:', err);
    }
  };

  return (
    <div className="reviews-section">
      <h2 className="reviews-title">
        <MessageSquare size={22} />
        Comentarios de Clientes
        {reviews.length > 0 && <span className="reviews-count">{reviews.length}</span>}
      </h2>

      {/* ── Resumen de estrellas ── */}
      {reviews.length > 0 && (() => {
        const rated = reviews.filter(r => r.rating);
        if (rated.length === 0) return null;
        const avg = rated.reduce((sum, r) => sum + r.rating, 0) / rated.length;
        return (
          <div className="reviews-summary">
            <div className="reviews-avg">
              <span className="reviews-avg-number">{avg.toFixed(1)}</span>
              <div className="reviews-avg-stars">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={16} className={s <= Math.round(avg) ? 'star-filled' : 'star-empty'} fill={s <= Math.round(avg) ? 'currentColor' : 'none'} />
                ))}
              </div>
              <span className="reviews-avg-count">de {rated.length} {rated.length === 1 ? 'calificación' : 'calificaciones'}</span>
            </div>
          </div>
        );
      })()}

      {/* ── Formulario de review ── */}
      {user ? (
        <form className="review-form" onSubmit={handleSubmit}>
          <div className="review-form-header">
            <div className="review-avatar">
              {user.photoURL ? (
                <img src={user.photoURL} alt="avatar" />
              ) : (
                <span>{(profile?.firstName || user.email || 'U')[0].toUpperCase()}</span>
              )}
            </div>
            <span className="review-form-name">
              {profile?.firstName
                ? `${profile.firstName} ${profile.lastName || ''}`.trim()
                : user.displayName || user.email}
            </span>
          </div>

          <div className="review-textarea-wrap">
            <textarea
              className="review-textarea"
              placeholder="Comparte tu experiencia con este producto..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={MAX_CHARS}
              rows={3}
            />
            <span className={`review-char-count ${charCount >= MAX_CHARS * 0.9 ? 'near-limit' : ''}`}>
              {charCount}/{MAX_CHARS}
            </span>
          </div>

          {imagePreview && (
            <div className="review-image-preview">
              <img src={imagePreview} alt="preview" />
              <button type="button" className="review-remove-image" onClick={removeImage}>✕</button>
            </div>
          )}

          {/* ── Selector de estrellas ── */}
          <div className="review-rating">
            <span className="review-rating-label">Puntuación:</span>
            <div className="review-stars-input">
              {[1,2,3,4,5].map(s => (
                <button
                  key={s}
                  type="button"
                  className={`review-star-btn ${s <= (hoverRating || rating) ? 'active' : ''}`}
                  onClick={() => setRating(s === rating ? 0 : s)}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  title={`${s} estrella${s > 1 ? 's' : ''}`}
                >
                  <Star size={22} fill={s <= (hoverRating || rating) ? 'currentColor' : 'none'} />
                </button>
              ))}
              {rating > 0 && <span className="review-rating-text">{rating}/5</span>}
            </div>
          </div>

          <div className="review-form-actions">
            <label className="review-upload-btn">
              <ImageIcon size={18} />
              <span>Imagen</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </label>
            <button
              type="submit"
              className="review-submit-btn"
              disabled={submitting || !text.trim() || charCount > MAX_CHARS}
            >
              <Send size={16} />
              {submitting ? 'Publicando...' : 'Publicar'}
            </button>
          </div>

          {error && <p className="review-error">{error}</p>}
        </form>
      ) : (
        <p className="review-login-hint">Inicia sesión para dejar un comentario</p>
      )}

      {/* ── Lista de reviews ── */}
      {loading ? (
        <div className="reviews-loading">Cargando comentarios...</div>
      ) : reviews.length === 0 ? (
        <div className="reviews-empty">
          <Star size={32} />
          <p>Sé el primero en comentar este producto</p>
        </div>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => {
            const userHasLiked = user && review.likes?.includes(user.uid);
            const userHasDisliked = user && review.dislikes?.includes(user.uid);

            return (
              <div key={review.id} className="review-card">
                <div className="review-card-header">
                  <div className="review-author">
                    {review.userPhoto ? (
                      <img src={review.userPhoto} alt="" className="review-author-img" />
                    ) : (
                      <span className="review-author-avatar">
                        {(review.userName || 'U')[0].toUpperCase()}
                      </span>
                    )}
                    <div>
                      <span className="review-author-name">{review.userName}</span>
                      <span className="review-date">
                        {review.createdAt
                          ? new Date(review.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
                          : ''}
                      </span>
                    </div>
                  </div>
                  {isAdmin && (
                    <button className="review-delete-btn" onClick={() => handleDelete(review.id)} title="Eliminar comentario">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {review.rating && (
                  <div className="review-stars-display">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={14} className={s <= review.rating ? 'star-filled' : 'star-empty'} fill={s <= review.rating ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                )}

                <p className="review-text">{review.text}</p>

                {review.image && (
                  <div className="review-image">
                    <img src={review.image} alt="Review" />
                  </div>
                )}

                <div className="review-actions">
                  <button
                    className={`review-vote-btn ${userHasLiked ? 'active-like' : ''}`}
                    onClick={() => handleLike(review.id)}
                    disabled={!user}
                    title={user ? 'Útil' : 'Inicia sesión para votar'}
                  >
                    <ThumbsUp size={15} />
                    <span>{review.likes?.length || 0}</span>
                  </button>
                  <button
                    className={`review-vote-btn ${userHasDisliked ? 'active-dislike' : ''}`}
                    onClick={() => handleDislike(review.id)}
                    disabled={!user}
                    title={user ? 'No útil' : 'Inicia sesión para votar'}
                  >
                    <ThumbsDown size={15} />
                    <span>{review.dislikes?.length || 0}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
