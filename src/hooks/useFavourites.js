import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  addFavourite,
  removeFavourite,
  subscribeFavourites,
} from '../firebase/firestore';

/**
 * useFavourites — Firestore para usuarios autenticados.
 * Requiere useAuth() para saber si hay sesión.
 */
export default function useFavourites() {
  const { user } = useAuth();
  const [favourites, setFavourites] = useState([]);

  useEffect(() => {
    if (!user) {
      setFavourites([]);
      return;
    }
    // Suscripción en tiempo real a Firestore
    const unsub = subscribeFavourites(user.uid, setFavourites);
    return unsub;
  }, [user]);

  const toggle = useCallback(async (productId) => {
    if (!user) return; // El componente debe manejar el caso sin sesión
    const strId = String(productId);
    if (favourites.includes(strId)) {
      await removeFavourite(user.uid, strId);
    } else {
      await addFavourite(user.uid, strId);
    }
  }, [user, favourites]);

  const isFav = useCallback(
    (productId) => favourites.includes(String(productId)),
    [favourites]
  );

  return { favourites, toggle, isFav };
}
