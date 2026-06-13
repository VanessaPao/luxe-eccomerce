// models/orderModel.js
//
// RESPONSABILIDAD: Acceso a datos de órdenes en Firestore.
// Solo se encarga de hablar con la base de datos, sin lógica de negocio.

import { db } from "../firebase/admin.js";

/**
 * Crea una nueva orden en Firestore usando una transacción.
 * Actualiza el stock de cada producto comprado, asegurando consistencia.
 * @param {Object} orderData - Datos de la orden
 * @returns {Promise<string>} ID de la orden creada
 */
export async function createOrder(orderData) {
  return await db.runTransaction(async (transaction) => {
    // 1. Obtener referencias y leer el stock de los productos.
    // En Firestore, todas las lecturas de una transacción deben realizarse antes de cualquier escritura.
    const itemDetails = [];
    for (const item of orderData.items) {
      const productRef = db.collection("products").doc(item.productId);
      const productDoc = await transaction.get(productRef);
      itemDetails.push({
        item,
        productRef,
        productDoc,
      });
    }

    const updates = [];

    // 2. Validar existencias y stock suficiente
    for (const detail of itemDetails) {
      const { item, productRef, productDoc } = detail;

      if (!productDoc.exists) {
        throw new Error(`PRODUCT_NOT_FOUND: El producto "${item.name}" con ID ${productRef.id} no existe.`);
      }

      const productData = productDoc.data();
      const currentStock = Number(productData.stock);

      if (productData.stock === undefined || isNaN(currentStock) || currentStock < 0) {
        throw new Error(`INVALID_STOCK: El producto "${item.name}" no tiene un stock válido en la base de datos.`);
      }

      if (currentStock < item.quantity) {
        throw new Error(`INSUFFICIENT_STOCK: Stock insuficiente para el producto "${item.name}". Stock disponible: ${currentStock}, Solicitado: ${item.quantity}`);
      }

      const newStock = currentStock - item.quantity;
      if (newStock < 0) {
        throw new Error(`NEGATIVE_STOCK: El stock de "${item.name}" no puede ser menor a cero.`);
      }

      updates.push({
        ref: productRef,
        newStock,
      });
    }

    // 3. Ejecutar actualizaciones del stock en Firestore (escrituras)
    for (const update of updates) {
      transaction.update(update.ref, {
        stock: update.newStock,
        updatedAt: new Date(),
      });
    }

    // 4. Crear el documento de la orden en Firestore (escritura)
    const orderRef = db.collection("orders").doc();
    transaction.set(orderRef, orderData);

    // Retornar el ID de la orden creada
    return orderRef.id;
  });
}
