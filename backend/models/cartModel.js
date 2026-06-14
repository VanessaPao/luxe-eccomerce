import { db } from "../firebase/admin.js";

/**
 * Obtiene todos los items del carrito de un usuario.
 */
export async function getCartItems(uid) {
  const snapshot = await db
    .collection("users")
    .doc(uid)
    .collection("cart")
    .orderBy("addedAt", "asc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    addedAt: doc.data().addedAt?.toDate?.()?.toISOString() ?? null,
  }));
}

/**
 * Agrega o actualiza un item en el carrito.
 * Si ya existe, suma la cantidad.
 */
export async function addCartItem(uid, product, quantity = 1) {
  const size = product.size || null;
  // Key includes size so same product with different sizes are separate items
  const docId = size ? `${String(product.productId || product.id)}_${size}` : String(product.productId || product.id);
  const ref = db
    .collection("users")
    .doc(uid)
    .collection("cart")
    .doc(docId);

  const snap = await ref.get();

  if (snap.exists) {
    const existing = snap.data();
    await ref.update({
      quantity: (existing.quantity || 0) + quantity,
    });
  } else {
    const activePrice =
      product.sale && product.salePrice !== undefined && product.salePrice !== null
        ? product.salePrice
        : product.price;
    await ref.set({
      productId: docId,
      name: product.name,
      price: activePrice,
      image: product.image,
      quantity,
      size,
      addedAt: new Date(),
    });
  }
}

/**
 * Actualiza la cantidad de un item del carrito.
 * Si la cantidad es <= 0, elimina el item.
 */
export async function updateCartItemQuantity(uid, productId, quantity) {
  if (quantity <= 0) {
    return removeCartItem(uid, productId);
  }
  const ref = db
    .collection("users")
    .doc(uid)
    .collection("cart")
    .doc(String(productId));
  await ref.set({ quantity }, { merge: true });
}

/**
 * Elimina un item del carrito.
 */
export async function removeCartItem(uid, productId) {
  await db
    .collection("users")
    .doc(uid)
    .collection("cart")
    .doc(String(productId))
    .delete();
}

/**
 * Vacía todo el carrito del usuario.
 */
export async function clearCartItems(uid) {
  const ref = db.collection("users").doc(uid).collection("cart");
  const snap = await ref.get();
  const deletes = snap.docs.map((d) => d.ref.delete());
  await Promise.all(deletes);
}
