import { Router } from "express";
import {
  getReviews,
  createReview,
  deleteReview,
  likeReview,
  dislikeReview,
} from "../controllers/reviewController.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = Router();

/**
 * @openapi
 * /api/reviews/{productId}:
 *   get:
 *     tags: [Reseñas]
 *     summary: Obtener reseñas de un producto
 *     description: Devuelve todas las reseñas asociadas a un producto específico.
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: ID del producto en Firestore
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de reseñas del producto
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Review"
 *       500:
 *         description: Error del servidor
 */
router.get("/:productId", getReviews);

/**
 * @openapi
 * /api/reviews/{productId}:
 *   post:
 *     tags: [Reseñas]
 *     summary: Crear una reseña
 *     security:
 *       - BearerAuth: []
 *     description: Registra una nueva reseña para un producto.
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: ID del producto
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, userName, rating, text]
 *             properties:
 *               userId: { type: string }
 *               userName: { type: string }
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               text: { type: string }
 *     responses:
 *       201:
 *         description: Reseña creada exitosamente
 *       400:
 *         description: Datos faltantes o inválidos
 *       500:
 *         description: Error del servidor
 */
router.post("/:productId", authenticateToken, createReview);

/**
 * @openapi
 * /api/reviews/{productId}/{reviewId}:
 *   delete:
 *     tags: [Reseñas]
 *     summary: Eliminar una reseña (Solo Admin)
 *     security:
 *       - BearerAuth: []
 *     description: Elimina una reseña específica de un producto.
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reseña eliminada
 *       404:
 *         description: Reseña no encontrada
 *       500:
 *         description: Error del servidor
 */
router.delete("/:productId/:reviewId", authenticateToken, requireRole("admin"), deleteReview);

/**
 * @openapi
 * /api/reviews/{productId}/{reviewId}/like:
 *   post:
 *     tags: [Reseñas]
 *     summary: Toggle like en una reseña
 *     security:
 *       - BearerAuth: []
 *     description: Agrega o quita un like a una reseña (toggle).
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId: { type: string }
 *     responses:
 *       200:
 *         description: Like actualizado
 *       500:
 *         description: Error del servidor
 */
router.post("/:productId/:reviewId/like", authenticateToken, likeReview);

/**
 * @openapi
 * /api/reviews/{productId}/{reviewId}/dislike:
 *   post:
 *     tags: [Reseñas]
 *     summary: Toggle dislike en una reseña
 *     security:
 *       - BearerAuth: []
 *     description: Agrega o quita un dislike a una reseña (toggle).
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId: { type: string }
 *     responses:
 *       200:
 *         description: Dislike actualizado
 *       500:
 *         description: Error del servidor
 */
router.post("/:productId/:reviewId/dislike", authenticateToken, dislikeReview);

export default router;
