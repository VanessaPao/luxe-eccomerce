// controllers/productController.js
//
// RESPONSABILIDAD: Manejar las peticiones HTTP de productos.
// Valida datos, llama al modelo y devuelve la respuesta.

import { getAllProducts, getProductById } from "../models/productModel.js";

/**
 * GET /api/products
 * Devuelve todos los productos del catálogo.
 */
export async function getProducts(req, res) {
  try {
    const products = await getAllProducts();
    res.json(products);
  } catch (error) {
    console.error("❌ Error al obtener productos de Firestore:", error);
    res.status(500).json({ error: "Error al obtener los productos." });
  }
}

/**
 * GET /api/products/:id
 * Devuelve un producto específico por su ID.
 */
export async function getProduct(req, res) {
  const { id } = req.params;

  try {
    const product = await getProductById(id);

    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado." });
    }

    res.json(product);
  } catch (error) {
    console.error(`❌ Error al obtener el producto con ID "${id}":`, error);
    res.status(500).json({ error: "Error al obtener el producto." });
  }
}
