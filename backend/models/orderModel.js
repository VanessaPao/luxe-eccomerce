// models/orderModel.js
//
// RESPONSABILIDAD: Acceso a datos de órdenes en Firestore.
// Solo se encarga de hablar con la base de datos, sin lógica de negocio.

import { db } from "../firebase/admin.js";

/**
 * Crea una nueva orden en Firestore.
 * @param {Object} orderData - Datos de la orden
 * @returns {Promise<string>} ID de la orden creada
 */
export async function createOrder(orderData) {
  const docRef = await db.collection("orders").add(orderData);
  return docRef.id;
}
