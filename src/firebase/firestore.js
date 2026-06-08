// 🗄️ Firestore CRUD — Favorites, Cart, Products
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './config';

// ─────────────────────────────────────────────
// FAVORITES
// ─────────────────────────────────────────────

/**
 * Agrega un producto a favoritos del usuario
 */
export async function addFavourite(uid, productId) {
  const ref = doc(db, 'users', uid, 'favourites', String(productId));
  await setDoc(ref, { addedAt: serverTimestamp() });
}

/**
 * Elimina un producto de favoritos del usuario
 */
export async function removeFavourite(uid, productId) {
  const ref = doc(db, 'users', uid, 'favourites', String(productId));
  await deleteDoc(ref);
}

/**
 * Escucha en tiempo real los favoritos de un usuario
 * Retorna función para cancelar la suscripción
 */
export function subscribeFavourites(uid, callback) {
  const ref = collection(db, 'users', uid, 'favourites');
  return onSnapshot(ref, (snapshot) => {
    const ids = snapshot.docs.map((d) => d.id);
    callback(ids);
  });
}

// ─────────────────────────────────────────────
// CART (para usuarios autenticados)
// ─────────────────────────────────────────────

export async function addToCart(uid, product, quantity = 1) {
  const ref = doc(db, 'users', uid, 'cart', String(product.id));
  const snap = await getDoc(ref);

  if (snap.exists()) {
    await setDoc(ref, { ...snap.data(), quantity: snap.data().quantity + quantity });
  } else {
    const activePrice = product.sale && product.salePrice !== undefined && product.salePrice !== null
      ? product.salePrice
      : product.price;
    await setDoc(ref, {
      productId: String(product.id),
      name: product.name,
      price: activePrice,
      image: product.image,
      quantity,
      addedAt: serverTimestamp(),
    });
  }
}

/**
 * Elimina un item del carrito
 */
export async function removeFromCart(uid, productId) {
  await deleteDoc(doc(db, 'users', uid, 'cart', String(productId)));
}

/**
 * Actualiza la cantidad de un item en el carrito
 */
export async function updateCartQuantity(uid, productId, quantity) {
  if (quantity <= 0) return removeFromCart(uid, productId);
  const ref = doc(db, 'users', uid, 'cart', String(productId));
  await setDoc(ref, { quantity }, { merge: true });
}

/**
 * Escucha el carrito en tiempo real
 */
export function subscribeCart(uid, callback) {
  const ref = collection(db, 'users', uid, 'cart');
  return onSnapshot(query(ref, orderBy('addedAt')), (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(items);
  });
}

/**
 * Limpia el carrito completo del usuario
 */
export async function clearUserCart(uid) {
  const ref = collection(db, 'users', uid, 'cart');
  const snap = await getDocs(ref);
  const deletes = snap.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletes);
}

// ─────────────────────────────────────────────
// PRODUCTS & STOCK
// ─────────────────────────────────────────────

export async function getProductsByCategory(category) {
  const snap = await getDocs(collection(db, 'products'));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((p) => !category || p.category === category);
}

/**
 * Obtiene todos los productos de Firestore
 * - Consulta la colección 'products' en la base de datos (db).
 * - Mapea cada documento (d) para retornar un objeto con su ID de documento y sus datos (...d.data()).
 */
export async function getProducts() {
  // Obtenemos una captura (snapshot) con todos los documentos de la colección 'products'
  const snap = await getDocs(collection(db, 'products'));
  // Mapeamos los documentos devueltos para incluir el 'id' del documento dentro de sus propiedades
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Obtiene únicamente los productos en rebaja (sale === true)
 */
export async function getSaleProducts() {
  const products = await getProducts();
  return products.filter((p) => p.sale === true);
}



/**
 * Escucha productos en tiempo real (con stock actualizado)
 */
export function subscribeProducts(callback) {
  return onSnapshot(collection(db, 'products'), (snapshot) => {
    const products = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(products);
  });
}

/**
 * Reduce stock al confirmar compra (transacción segura)
 */
export async function decrementStock(productId, quantity = 1) {
  const ref = doc(db, 'products', String(productId));
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Producto no encontrado');
    const current = snap.data().stock || 0;
    if (current < quantity) throw new Error('Stock insuficiente');
  });
}

/**
 * Crea un nuevo producto
 */
export async function createProduct(productData) {
  const newRef = doc(collection(db, 'products'));
  await setDoc(newRef, {
    ...productData,
    createdAt: serverTimestamp(),
  });
  return newRef.id;
}

/**
 * Actualiza un producto existente
 */
export async function updateProduct(productId, productData) {
  const ref = doc(db, 'products', String(productId));
  await setDoc(ref, {
    ...productData,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Elimina un producto
 */
export async function deleteProduct(productId) {
  const ref = doc(db, 'products', String(productId));
  await deleteDoc(ref);
}

/**
 * Guarda o actualiza la dirección y teléfono del usuario en Firestore.
 */
export async function saveUserAddress(uid, phone, address) {
  const ref = doc(db, 'users', uid);
  await setDoc(ref, {
    phone,
    address
  }, { merge: true });
}

/**
 * Crea una orden de compra en la colección 'orders'.
 */
export async function createOrder(orderData) {
  const newRef = doc(collection(db, 'orders'));
  await setDoc(newRef, {
    ...orderData,
    createdAt: serverTimestamp()
  });
  return newRef.id;
}
