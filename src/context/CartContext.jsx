import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  addToCart,
  removeFromCart,
  updateCartQuantity,
  subscribeCart,
  clearUserCart,
} from '../firebase/firestore';

const CartContext = createContext(null);

// ── helpers para carrito guest (localStorage) ──────────────────────────────
const GUEST_KEY = 'luxe_guest_cart';

function loadGuestCart() {
  try { return JSON.parse(localStorage.getItem(GUEST_KEY) || '[]'); }
  catch { return []; }
}
function saveGuestCart(items) {
  localStorage.setItem(GUEST_KEY, JSON.stringify(items));
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  /* ── sincronizar carrito según estado de sesión ── */
  useEffect(() => {
    if (user) {
      // Migrar carrito guest → Firestore al iniciar sesión
      const guestItems = loadGuestCart();
      if (guestItems.length > 0) {
        Promise.all(
          guestItems.map((item) =>
            addToCart(user.uid, item, item.quantity)
          )
        ).then(() => {
          localStorage.removeItem(GUEST_KEY);
        });
      }

      // Suscripción en tiempo real al carrito en Firestore
      const unsub = subscribeCart(user.uid, setItems);
      return unsub;
    } else {
      // Sin sesión: usar localStorage
      setItems(loadGuestCart());
    }
  }, [user]);

  /* ── Agregar al carrito ── */
  const addItem = useCallback(async (product, quantity = 1) => {
    if (user) {
      await addToCart(user.uid, product, quantity);
    } else {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === String(product.id));
        let next;
        if (existing) {
          next = prev.map((i) =>
            i.productId === String(product.id)
              ? { ...i, quantity: i.quantity + quantity }
              : i
          );
        } else {
          next = [
            ...prev,
            {
              productId: String(product.id),
              name: product.name,
              price: product.price,
              image: product.image,
              quantity,
            },
          ];
        }
        saveGuestCart(next);
        return next;
      });
    }
  }, [user]);

  /* ── Eliminar del carrito ── */
  const removeItem = useCallback(async (productId) => {
    if (user) {
      await removeFromCart(user.uid, productId);
    } else {
      setItems((prev) => {
        const next = prev.filter((i) => i.productId !== String(productId));
        saveGuestCart(next);
        return next;
      });
    }
  }, [user]);

  /* ── Actualizar cantidad ── */
  const updateQty = useCallback(async (productId, quantity) => {
    if (user) {
      await updateCartQuantity(user.uid, productId, quantity);
    } else {
      setItems((prev) => {
        const next = quantity <= 0
          ? prev.filter((i) => i.productId !== String(productId))
          : prev.map((i) =>
              i.productId === String(productId) ? { ...i, quantity } : i
            );
        saveGuestCart(next);
        return next;
      });
    }
  }, [user]);

  /* ── Vaciar carrito ── */
  const clearCart = useCallback(async () => {
    if (user) {
      await clearUserCart(user.uid);
    } else {
      localStorage.removeItem(GUEST_KEY);
      setItems([]);
    }
  }, [user]);

  const totalItems = items.reduce((sum, i) => sum + (i.quantity || 1), 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * (i.quantity || 1), 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
