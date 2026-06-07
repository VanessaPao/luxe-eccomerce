// 🔐 Firebase Auth functions
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

const googleProvider = new GoogleAuthProvider();

/**
 * Registro con Email y Contraseña
 * Guarda datos extra del usuario en Firestore
 */
export async function registerWithEmail({ email, password, firstName, lastName, birthDate }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;

  await setDoc(doc(db, 'users', uid), {
    firstName,
    lastName,
    birthDate,
    email,
    createdAt: serverTimestamp(),
  });

  return credential.user;
}

/**
 * Inicio de sesión con Email y Contraseña
 */
export async function loginWithEmail({ email, password }) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

/**
 * Inicio de sesión con Google
 * Si es primera vez, crea perfil en Firestore
 */
export async function loginWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider);
  const user = credential.user;

  // Verificar si ya tiene perfil en Firestore
  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const nameParts = (user.displayName || '').split(' ');
    await setDoc(userRef, {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      birthDate: null,
      email: user.email,
      photoURL: user.photoURL || null,
      createdAt: serverTimestamp(),
    });
  }

  return user;
}

/**
 * Cerrar sesión
 */
export async function logout() {
  await signOut(auth);
}

/**
 * Suscripción al estado de autenticación
 */
export function subscribeToAuth(callback) {
  return onAuthStateChanged(auth, callback);
}
