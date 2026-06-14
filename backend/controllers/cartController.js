import {
  getCartItems,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCartItems,
} from "../models/cartModel.js";

/**
 * GET /api/cart/:userId
 * Devuelve todos los items del carrito del usuario.
 */
export async function getCart(req, res) {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "El userId es requerido." });
  }

  try {
    const items = await getCartItems(userId);
    res.status(200).json(items);
  } catch (error) {
    console.error("Error obteniendo carrito:", error);
    res.status(500).json({ error: "Error al obtener el carrito." });
  }
}

/**
 * POST /api/cart/:userId
 * Agrega un item al carrito del usuario.
 */
export async function addItem(req, res) {
  const { userId } = req.params;
  const { productId, name, price, image, quantity, sale, salePrice, size } = req.body;

  if (!userId || !productId || !name) {
    return res.status(400).json({ error: "Faltan datos requeridos (userId, productId, name)." });
  }

  try {
    await addCartItem(userId, { productId, name, price, image, sale, salePrice, size }, quantity || 1);
    res.status(200).json({ message: "Item agregado al carrito." });
  } catch (error) {
    console.error("Error agregando al carrito:", error);
    res.status(500).json({ error: "Error al agregar item al carrito." });
  }
}

/**
 * PATCH /api/cart/:userId/:productId
 * Actualiza la cantidad de un item del carrito.
 */
export async function updateQuantity(req, res) {
  const { userId, productId } = req.params;
  const { quantity } = req.body;

  if (!userId || !productId || quantity === undefined) {
    return res.status(400).json({ error: "Faltan datos requeridos (userId, productId, quantity)." });
  }

  try {
    await updateCartItemQuantity(userId, productId, quantity);
    res.status(200).json({ message: "Cantidad actualizada." });
  } catch (error) {
    console.error("Error actualizando cantidad:", error);
    res.status(500).json({ error: "Error al actualizar la cantidad." });
  }
}

/**
 * DELETE /api/cart/:userId/:productId
 * Elimina un item del carrito.
 */
export async function removeItem(req, res) {
  const { userId, productId } = req.params;

  if (!userId || !productId) {
    return res.status(400).json({ error: "Faltan datos requeridos (userId, productId)." });
  }

  try {
    await removeCartItem(userId, productId);
    res.status(200).json({ message: "Item eliminado del carrito." });
  } catch (error) {
    console.error("Error eliminando del carrito:", error);
    res.status(500).json({ error: "Error al eliminar item del carrito." });
  }
}

/**
 * DELETE /api/cart/:userId
 * Vacía todo el carrito del usuario.
 */
export async function clearCart(req, res) {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "El userId es requerido." });
  }

  try {
    await clearCartItems(userId);
    res.status(200).json({ message: "Carrito vaciado." });
  } catch (error) {
    console.error("Error vaciando carrito:", error);
    res.status(500).json({ error: "Error al vaciar el carrito." });
  }
}
