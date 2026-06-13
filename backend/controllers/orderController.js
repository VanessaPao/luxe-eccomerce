// controllers/orderController.js
//
// RESPONSABILIDAD: Manejar las peticiones HTTP de órdenes.
// Valida datos, aplica lógica de negocio y llama al modelo.

import { createOrder } from "../models/orderModel.js";

/**
 * POST /api/orders
 * Crea una nueva orden tras validar los datos del cliente.
 */
export async function create(req, res) {
  const { userId, items, total, shippingAddress } = req.body;

  // ── Validaciones (Defensa del Backend) ──────────────────────────────
  if (!userId) {
    return res.status(400).json({ error: "Falta el ID del usuario (userId)." });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "El pedido debe contener al menos un producto (items)." });
  }

  if (total === undefined || typeof total !== "number" || total <= 0) {
    return res.status(400).json({ error: "El precio total debe ser un número mayor a cero." });
  }

  if (!shippingAddress || !shippingAddress.phone || !shippingAddress.address) {
    return res.status(400).json({
      error: "La dirección de envío (shippingAddress) es obligatoria y debe incluir teléfono y dirección completa.",
    });
  }

  try {
    // ── Preparar documento ─────────────────────────────────────────────
    const newOrder = {
      userId,
      items: items.map((item) => ({
        productId: item.productId || item.id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity) || 1,
        image: item.image || "",
      })),
      total: Number(total),
      shippingAddress,
      status: "pending",
      createdAt: new Date(),
    };

    const orderId = await createOrder(newOrder);

    res.status(201).json({
      message: "Orden creada exitosamente.",
      orderId,
    });
  } catch (error) {
    console.error("❌ Error al procesar la orden en Firestore:", error);

    // Si es un error de validación de negocio conocido, devolvemos 400 Bad Request
    const errorPrefixes = ["PRODUCT_NOT_FOUND:", "INVALID_STOCK:", "INSUFFICIENT_STOCK:", "NEGATIVE_STOCK:"];
    const isValidationError = errorPrefixes.some(prefix => error.message && error.message.startsWith(prefix));

    if (isValidationError) {
      const cleanMessage = error.message.substring(error.message.indexOf(":") + 1).trim();
      return res.status(400).json({ error: cleanMessage });
    }

    res.status(500).json({ error: "Error interno del servidor al procesar la orden." });
  }
}
