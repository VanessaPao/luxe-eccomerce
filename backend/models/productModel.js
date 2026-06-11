// models/productModel.js
//
// RESPONSABILIDAD: Acceso a datos de productos en Firestore.
// Solo se encarga de hablar con la base de datos, sin lógica de negocio.

import { db } from "../firebase/admin.js";

/**
 * Obtiene todos los productos del catálogo.
 * @returns {Promise<Array>} Lista de productos con id y datos
 */
export async function getAllProducts() {
  const snapshot = await db.collection("products").get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Obtiene un producto específico por su ID.
 * @param {string} id - ID del documento en Firestore
 * @returns {Promise<Object|null>} Producto encontrado o null
 */
export async function getProductById(id) {
  const docSnap = await db.collection("products").doc(id).get();
  if (!docSnap.exists) return null;
  return { id: docSnap.id, ...docSnap.data() };
}
