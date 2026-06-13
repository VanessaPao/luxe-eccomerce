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

/**
 * Crea un nuevo producto en Firestore.
 * @param {Object} productData - Datos del producto
 * @returns {Promise<string>} ID del producto creado
 */
export async function createProduct(productData) {
  const docRef = await db.collection("products").add({
    ...productData,
    createdAt: new Date(),
  });
  return docRef.id;
}

/**
 * Actualiza un producto existente en Firestore.
 * @param {string} id - ID del producto
 * @param {Object} productData - Campos a actualizar
 * @returns {Promise<boolean>} true si se actualizó, false si no existía el producto
 */
export async function updateProduct(id, productData) {
  const docRef = db.collection("products").doc(id);
  const docSnap = await docRef.get();
  if (!docSnap.exists) return false;

  await docRef.update({
    ...productData,
    updatedAt: new Date(),
  });
  return true;
}

/**
 * Elimina un producto de Firestore.
 * @param {string} id - ID del producto
 * @returns {Promise<boolean>} true si se eliminó, false si no existía el producto
 */
export async function deleteProduct(id) {
  const docRef = db.collection("products").doc(id);
  const docSnap = await docRef.get();
  if (!docSnap.exists) return false;

  await docRef.delete();
  return true;
}

