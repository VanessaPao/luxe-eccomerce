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
import { getAllProducts } from "../models/productModel.js";

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
 * /api/products/sale:
 *   get:
 *     tags: [Productos]
 *     summary: Obtener productos en rebaja
 *     description: Devuelve únicamente los productos que tienen sale === true.
 *     responses:
 *       200:
 *         description: Lista de productos en rebaja
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Product"
 *       500:
 *         description: Error del servidor
 */
router.get("/sale", async (req, res) => {
  try {
    let products = await getAllProducts();
    if (!Array.isArray(products)) return res.json([]);

    products = products.filter(p => p.sale === true);

    // Aplicar los mismos filtros que GET /api/products
    const { category, type, size, material, color, priceMin, priceMax } = req.query;

    if (category) {
      const cat = category.toLowerCase();
      products = products.filter(p => (p.type || p.category || '').toLowerCase() === cat);
    }
    if (type) {
      const t = type.toLowerCase();
      products = products.filter(p => (p.type || '').toLowerCase() === t);
    }
    if (size) {
      const sizeList = size.split(',').map(s => s.trim());
      products = products.filter(p => {
        if (p.sizes && typeof p.sizes === 'object') return Object.keys(p.sizes).some(s => sizeList.includes(s));
        return sizeList.includes(p.size);
      });
    }
    if (material) {
      const matList = material.split(',').map(m => m.trim());
      products = products.filter(p => matList.includes(p.material));
    }
    if (color) {
      const colList = color.split(',').map(c => c.trim());
      products = products.filter(p => colList.includes(p.color));
    }
    if (priceMin !== undefined || priceMax !== undefined) {
      const min = priceMin !== undefined ? Number(priceMin) : 0;
      const max = priceMax !== undefined ? Number(priceMax) : Infinity;
      products = products.filter(p => {
        const activePrice = (p.sale && p.salePrice != null) ? p.salePrice : p.price;
        return activePrice >= min && activePrice <= max;
      });
    }

    res.json(products);
  } catch (error) {
    console.error("Error obteniendo productos en rebaja:", error);
    res.status(500).json({ error: "Error al obtener productos en rebaja." });
  }
});

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
