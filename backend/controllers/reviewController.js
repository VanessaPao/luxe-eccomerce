import {
  getReviewsByProduct,
  createReview as createReviewInDB,
  deleteReview as deleteReviewFromDB,
  toggleLike as toggleLikeInDB,
  toggleDislike as toggleDislikeInDB,
} from "../models/reviewModel.js";

/**
 * GET /api/reviews/:productId
 */
export async function getReviews(req, res) {
  const { productId } = req.params;
  if (!productId) {
    return res.status(400).json({ error: "Se requiere el ID del producto." });
  }

  try {
    const reviews = await getReviewsByProduct(productId);
    res.status(200).json(reviews);
  } catch (error) {
    console.error("Error obteniendo reviews:", error);
    res.status(500).json({ error: "Error al obtener los reviews." });
  }
}

/**
 * POST /api/reviews/:productId
 */
export async function createReview(req, res) {
  const { productId } = req.params;
  const { userId, userName, userPhoto, text, image, rating } = req.body;

  if (!productId || !userId || !text) {
    return res.status(400).json({ error: "Faltan datos requeridos (productId, userId, text)." });
  }

  if (text.trim().length > 500) {
    return res.status(400).json({ error: "El comentario no puede exceder 500 caracteres." });
  }

  if (rating !== undefined && rating !== null && (typeof rating !== "number" || rating < 1 || rating > 5)) {
    return res.status(400).json({ error: "La puntuación debe ser un número del 1 al 5." });
  }

  try {
    const reviewId = await createReviewInDB(productId, { userId, userName, userPhoto, text, image, rating });
    res.status(201).json({ message: "Review creado exitosamente.", reviewId });
  } catch (error) {
    console.error("Error creando review:", error);
    res.status(500).json({ error: "Error al crear el review." });
  }
}

/**
 * DELETE /api/reviews/:productId/:reviewId
 */
export async function deleteReview(req, res) {
  const { productId, reviewId } = req.params;

  if (!productId || !reviewId) {
    return res.status(400).json({ error: "Faltan datos requeridos." });
  }

  try {
    const deleted = await deleteReviewFromDB(productId, reviewId);
    if (!deleted) {
      return res.status(404).json({ error: "Review no encontrado." });
    }
    res.status(200).json({ message: "Review eliminado exitosamente." });
  } catch (error) {
    console.error("Error eliminando review:", error);
    res.status(500).json({ error: "Error al eliminar el review." });
  }
}

/**
 * POST /api/reviews/:productId/:reviewId/like
 */
export async function likeReview(req, res) {
  const { productId, reviewId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Se requiere userId." });
  }

  try {
    const result = await toggleLikeInDB(productId, reviewId, userId);
    if (!result) {
      return res.status(404).json({ error: "Review no encontrado." });
    }
    res.status(200).json(result);
  } catch (error) {
    console.error("Error en like:", error);
    res.status(500).json({ error: "Error al procesar like." });
  }
}

/**
 * POST /api/reviews/:productId/:reviewId/dislike
 */
export async function dislikeReview(req, res) {
  const { productId, reviewId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Se requiere userId." });
  }

  try {
    const result = await toggleDislikeInDB(productId, reviewId, userId);
    if (!result) {
      return res.status(404).json({ error: "Review no encontrado." });
    }
    res.status(200).json(result);
  } catch (error) {
    console.error("Error en dislike:", error);
    res.status(500).json({ error: "Error al procesar dislike." });
  }
}
