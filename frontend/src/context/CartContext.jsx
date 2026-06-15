import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE_URL, authFetch } from '../utils/api';
import { subscribeCart } from '../firebase/firestore';

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
            authFetch(`${API_BASE_URL}/api/cart/${user.uid}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                productId: item.productId,
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: item.quantity,
                size: item.size || null,
              }),
            })
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
    const size = product.selectedSize || product.size || null;
    if (user) {
      const res = await authFetch(`${API_BASE_URL}/api/cart/${user.uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: String(product.id),
          name: product.name,
          price: product.sale && product.salePrice ? product.salePrice : product.price,
          image: product.image,
          quantity,
          sale: product.sale,
          salePrice: product.salePrice,
          size,
        }),
      });
      if (!res.ok) throw new Error('Error al agregar al carrito');
    } else {
      setItems((prev) => {
        // Key includes size so same product in different sizes are separate items
        const itemKey = size ? `${String(product.id)}_${size}` : String(product.id);
        const existing = prev.find((i) => {
          const key = i.size ? `${i.productId}_${i.size}` : i.productId;
          return key === itemKey;
        });
        let next;
        if (existing) {
          next = prev.map((i) => {
            const key = i.size ? `${i.productId}_${i.size}` : i.productId;
            return key === itemKey ? { ...i, quantity: i.quantity + quantity } : i;
          });
        } else {
          const activePrice = product.sale && product.salePrice !== undefined && product.salePrice !== null
            ? product.salePrice
            : product.price;
          next = [
            ...prev,
            {
              productId: itemKey,
              name: product.name,
              price: activePrice,
              image: product.image,
              quantity,
              size,
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
      const res = await authFetch(`${API_BASE_URL}/api/cart/${user.uid}/${productId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar del carrito');
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
      const res = await authFetch(`${API_BASE_URL}/api/cart/${user.uid}/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) throw new Error('Error al actualizar cantidad');
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
      const res = await authFetch(`${API_BASE_URL}/api/cart/${user.uid}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al vaciar carrito');
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
