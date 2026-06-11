// 🔐 Firebase Auth functions
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
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

/**
 * Cambiar contraseña del usuario autenticado.
 * Requiere reautenticación por seguridad.
 * Solo funciona para usuarios con proveedor email/contraseña.
 *
 * @throws {Error} Con mensaje amigable si el usuario es de Google u otro proveedor.
 */
export async function changePassword(currentPassword, newPassword) {
  const user = auth.currentUser;
  if (!user) throw new Error('No hay usuario autenticado.');

  // Verificar que el usuario usó email/contraseña (no Google, Apple, etc.)
  const isEmailProvider = user.providerData.some(
    (p) => p.providerId === 'password'
  );

  if (!isEmailProvider) {
    throw new Error(
      'Los usuarios registrados con Google no pueden cambiar la contraseña desde aquí. ' +
      'Si necesitas cambiar tu método de inicio de sesión, contacta a soporte.'
    );
  }

  // Reautenticar antes de cambiar contraseña
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);

  // Cambiar la contraseña
  await updatePassword(user, newPassword);
}
