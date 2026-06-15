import express from "express";
import { createCheckoutSession, verifyStripePayment, simulateMercadoPagoOrder } from "../controllers/checkoutController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Definimos la ruta POST "/"
// En el server.js, este router estará montado bajo "/api/checkout",
// por lo que la ruta completa y final será POST /api/checkout.
// Cuando el frontend haga una petición a esta ruta enviando los productos del carrito,
// se ejecutará el controlador createCheckoutSession.

/**
 * @openapi
 * /api/checkout:
 *   post:
 *     tags: [Checkout]
 *     summary: Crear sesión de pago en Stripe
 *     security:
 *       - BearerAuth: []
 *     description: Genera una Stripe Checkout Session recibiendo los productos del carrito.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 description: Lista de productos en el carrito
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - price
 *                     - quantity
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Vestido Elegante"
 *                     price:
 *                       type: number
 *                       description: Precio unitario en MXN
 *                       example: 1200
 *                     quantity:
 *                       type: integer
 *                       example: 1
 *     responses:
 *       200:
 *         description: Sesión de Stripe creada exitosamente. Retorna la URL de pago.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   format: uri
 *                   example: "https://checkout.stripe.com/c/pay/cs_test_a1B2c3D4e5F6..."
 *       400:
 *         description: Petición inválida (carrito vacío).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "El carrito está vacío."
 *       500:
 *         description: Error interno al crear la sesión de pago.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "No se pudo crear la sesión de pago."
 */
router.post("/", authenticateToken, createCheckoutSession);

/**
 * @openapi
 * /api/checkout/verify:
 *   post:
 *     tags: [Checkout]
 *     summary: Verificar pago de Stripe y crear la orden
 *     security:
 *       - BearerAuth: []
 *     description: Verifica que la Stripe Session se haya completado y crea la orden final.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: ID de la sesión de Stripe
 *                 example: "cs_test_..."
 *     responses:
 *       200:
 *         description: Pago verificado y orden registrada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 orderId:
 *                   type: string
 *                   example: "order_abc123"
 *       400:
 *         description: Petición inválida o sesión no pagada.
 *       500:
 *         description: Error interno al verificar.
 */
router.post("/verify", authenticateToken, verifyStripePayment);

/**
 * @openapi
 * /api/checkout/mercadopago:
 *   post:
 *     tags: [Checkout]
 *     summary: Simular pago de Mercado Pago
 *     security:
 *       - BearerAuth: []
 *     description: Simula de forma atómica la creación de la orden simulando una transacción con Mercado Pago.
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
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *               total:
 *                 type: number
 *               shippingAddress:
 *                 type: object
 *     responses:
 *       201:
 *         description: Orden creada exitosamente
 *       400:
 *         description: Datos inválidos o stock insuficiente
 *       500:
 *         description: Error interno del servidor
 */
router.post("/mercadopago", authenticateToken, simulateMercadoPagoOrder);

export default router;
