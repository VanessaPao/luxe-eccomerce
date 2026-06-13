// routes/products.js
//
// RESPONSABILIDAD: Solo definir las rutas HTTP y delegar al controlador.
// NO contiene lógica de negocio ni acceso a datos.

import express from "express";
import {
  getProducts,
  getProduct,
  addProduct,
  editProduct,
  removeProduct,
} from "../controllers/productController.js";

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

/**
 * @openapi
 * /api/products:
 *   post:
 *     tags: [Productos]
 *     summary: Crear un nuevo producto (Solo Admin)
 *     description: Registra un nuevo producto en el catálogo de Firestore.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - department
 *               - type
 *               - size
 *               - material
 *               - color
 *               - stock
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               department:
 *                 type: string
 *                 enum: [mujer, hombre, accesorios]
 *               type:
 *                 type: string
 *               size:
 *                 type: string
 *               material:
 *                 type: string
 *               color:
 *                 type: string
 *               stock:
 *                 type: integer
 *               image:
 *                 type: string
 *               description:
 *                 type: string
 *               sale:
 *                 type: boolean
 *               salePrice:
 *                 type: number
 *     responses:
 *       201:
 *         description: Producto creado exitosamente.
 *       400:
 *         description: Error en los datos proporcionados.
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/", addProduct);

/**
 * @openapi
 * /api/products/{id}:
 *   patch:
 *     tags: [Productos]
 *     summary: Actualizar parcialmente un producto (Solo Admin)
 *     description: Modifica los campos indicados de un producto en Firestore según su ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del producto en Firestore
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               department:
 *                 type: string
 *                 enum: [mujer, hombre, accesorios]
 *               type:
 *                 type: string
 *               size:
 *                 type: string
 *               material:
 *                 type: string
 *               color:
 *                 type: string
 *               stock:
 *                 type: integer
 *               image:
 *                 type: string
 *               description:
 *                 type: string
 *               sale:
 *                 type: boolean
 *               salePrice:
 *                 type: number
 *     responses:
 *       200:
 *         description: Producto actualizado correctamente.
 *       400:
 *         description: Error en la validación de los datos.
 *       404:
 *         description: Producto no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.patch("/:id", editProduct);

/**
 * @openapi
 * /api/products/{id}:
 *   delete:
 *     tags: [Productos]
 *     summary: Eliminar un producto (Solo Admin)
 *     description: Elimina definitivamente un producto de Firestore según su ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del producto en Firestore
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente.
 *       404:
 *         description: Producto no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.delete("/:id", removeProduct);

export default router;
