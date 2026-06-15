import { Router } from "express";
import {
  getCart,
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
} from "../controllers/cartController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

/**
 * @openapi
 * /api/cart/{userId}:
 *   get:
 *     tags: [Carrito]
 *     summary: Obtener el carrito de un usuario
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de items del carrito
 */
router.get("/:userId", authenticateToken, getCart);

/**
 * @openapi
 * /api/cart/{userId}:
 *   post:
 *     tags: [Carrito]
 *     summary: Agregar un item al carrito
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, name, price]
 *             properties:
 *               productId: { type: string }
 *               name: { type: string }
 *               price: { type: number }
 *               image: { type: string }
 *               quantity: { type: integer, default: 1 }
 *               sale: { type: boolean }
 *               salePrice: { type: number }
 *     responses:
 *       200:
 *         description: Item agregado
 */
router.post("/:userId", authenticateToken, addItem);

/**
 * @openapi
 * /api/cart/{userId}/{productId}:
 *   patch:
 *     tags: [Carrito]
 *     summary: Actualizar cantidad de un item
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity: { type: integer }
 *     responses:
 *       200:
 *         description: Cantidad actualizada
 */
router.patch("/:userId/:productId", authenticateToken, updateQuantity);

/**
 * @openapi
 * /api/cart/{userId}/{productId}:
 *   delete:
 *     tags: [Carrito]
 *     summary: Eliminar un item del carrito
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item eliminado
 */
router.delete("/:userId/:productId", authenticateToken, removeItem);

/**
 * @openapi
 * /api/cart/{userId}:
 *   delete:
 *     tags: [Carrito]
 *     summary: Vaciar todo el carrito
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Carrito vaciado
 */
router.delete("/:userId", authenticateToken, clearCart);

export default router;
