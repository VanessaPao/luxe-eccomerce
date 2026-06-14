// routes/orders.js
//
// RESPONSABILIDAD: Solo definir las rutas HTTP y delegar al controlador.
// NO contiene lógica de negocio ni acceso a datos.

import express from "express";
import { create } from "../controllers/orderController.js";
import { db } from "../firebase/admin.js";

const router = express.Router();

/**
 * @openapi
 * /api/orders:
 *   post:
 *     tags: [Órdenes]
 *     summary: Crear una nueva orden
 *     description: >
 *       Crea una orden en Firestore tras validar los datos del cliente.
 *       Requiere userId, items (array no vacío), total y shippingAddress.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, items, total, shippingAddress]
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID del usuario en Firebase Auth
 *                 example: "abc123xyz"
 *               items:
 *                 type: array
 *                 description: Productos del pedido
 *                 items:
 *                   type: object
 *                   required: [name, price, quantity]
 *                   properties:
 *                     productId:
 *                       type: string
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *                     quantity:
 *                       type: integer
 *                     image:
 *                       type: string
 *               total:
 *                 type: number
 *                 description: Monto total del pedido
 *                 example: 149.99
 *               shippingAddress:
 *                 type: object
 *                 required: [phone, address]
 *                 properties:
 *                   phone:
 *                     type: string
 *                   address:
 *                     type: object
 *                     properties:
 *                       street:
 *                         type: string
 *                       number:
 *                         type: string
 *                       neighborhood:
 *                         type: string
 *                       city:
 *                         type: string
 *                       state:
 *                         type: string
 *                       zipCode:
 *                         type: string
 *     responses:
 *       201:
 *         description: Orden creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Orden creada exitosamente."
 *                 orderId:
 *                   type: string
 *                   description: ID de la orden en Firestore
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.post("/", create);

/**
 * @openapi
 * /api/orders/user/{userId}:
 *   get:
 *     tags: [Órdenes]
 *     summary: Obtener órdenes de un usuario
 *     description: Devuelve todas las órdenes de un usuario específico, ordenadas por fecha descendente.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID del usuario en Firebase Auth
 *         schema:
 *           type: string
 *         example: "abc123xyz"
 *     responses:
 *       200:
 *         description: Lista de órdenes del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Order"
 *       500:
 *         description: Error del servidor
 */
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const snapshot = await db
      .collection("orders")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    const orders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? doc.data().createdAt ?? null,
    }));

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error obteniendo órdenes del usuario:", error);
    res.status(500).json({ error: "Error al obtener las órdenes del usuario." });
  }
});

export default router;
