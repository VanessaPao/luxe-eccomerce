// routes/products.js
//
// RESPONSABILIDAD: Solo definir las rutas HTTP y delegar al controlador.
// NO contiene lógica de negocio ni acceso a datos.

import express from "express";
import { getProducts, getProduct } from "../controllers/productController.js";

const router = express.Router();

/**
 * @openapi
 * /api/products:
 *   get:
 *     tags: [Productos]
 *     summary: Obtener todos los productos
 *     description: Devuelve el listado completo de productos del catálogo LUXE.
 *     responses:
 *       200:
 *         description: Lista de productos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Product"
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error al obtener los productos."
 */
router.get("/", getProducts);

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     tags: [Productos]
 *     summary: Obtener un producto por ID
 *     description: Devuelve un producto específico del catálogo según su ID de Firestore.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del producto en Firestore
 *         schema:
 *           type: string
 *         example: "abc123"
 *     responses:
 *       200:
 *         description: Producto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Product"
 *       404:
 *         description: Producto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Producto no encontrado."
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error al obtener el producto."
 */
router.get("/:id", getProduct);

export default router;
