import { Router } from "express";
import {
  getReviews,
  createReview,
  deleteReview,
  likeReview,
  dislikeReview,
} from "../controllers/reviewController.js";

const router = Router();

/**
 * GET /api/reviews/:productId
 * Obtiene todos los reviews de un producto.
 */
router.get("/:productId", getReviews);

/**
 * POST /api/reviews/:productId
 * Crea un review para un producto.
 */
router.post("/:productId", createReview);

/**
 * DELETE /api/reviews/:productId/:reviewId
 * Elimina un review (solo admin).
 */
router.delete("/:productId/:reviewId", deleteReview);

/**
 * POST /api/reviews/:productId/:reviewId/like
 * Toggle like en un review.
 */
router.post("/:productId/:reviewId/like", likeReview);

/**
 * POST /api/reviews/:productId/:reviewId/dislike
 * Toggle dislike en un review.
 */
router.post("/:productId/:reviewId/dislike", dislikeReview);

export default router;
