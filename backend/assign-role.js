import 'dotenv/config';
import { db } from './firebase/admin.js';
import { getAuth } from 'firebase-admin/auth';

// Obtener argumentos de la línea de comandos
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('\x1b[33m%s\x1b[0m', 'Uso: node assign-role.js <email> <rol>');
  console.log('Ejemplos:');
  console.log('  node assign-role.js usuario@ejemplo.com support');
  console.log('  node assign-role.js admin@ejemplo.com admin');
  process.exit(1);
}

const email = args[0].trim().toLowerCase();
const role = args[1].trim().toLowerCase();

const validRoles = ['admin', 'support', 'client', 'user'];
if (!validRoles.includes(role)) {
  console.log('\x1b[31m%s\x1b[0m', `Error: El rol '${role}' no es válido.`);
  console.log(`Los roles válidos son: ${validRoles.join(', ')}`);
  process.exit(1);
}

async function run() {
  try {
    console.log(`🔍 Buscando usuario en la base de datos por email: ${email}...`);
    
    // 1. Buscar primero en la colección de Firestore "users"
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();
    
    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      const uid = userDoc.id;
      console.log(`✨ Usuario encontrado en Firestore (UID: ${uid}).`);
      
      await usersRef.doc(uid).update({ role });
      console.log('\x1b[32m%s\x1b[0m', `✅ ¡Éxito! Rol del usuario ${email} actualizado a: '${role}'`);
      process.exit(0);
    }
    
    // 2. Si no está en Firestore, buscar en Firebase Authentication
    console.log('⚠️  El usuario no tiene un documento de perfil en Firestore.');
    console.log('🔍 Buscando en Firebase Authentication...');
    
    let authUser;
    try {
      authUser = await getAuth().getUserByEmail(email);
    } catch (authErr) {
      if (authErr.code === 'auth/user-not-found') {
        console.log('\x1b[31m%s\x1b[0m', `❌ Error: No existe ningún usuario con el correo '${email}' en Firebase.`);
      } else {
        console.error('❌ Error al consultar Firebase Auth:', authErr.message);
      }
      process.exit(1);
    }
    
    if (authUser) {
      const uid = authUser.uid;
      console.log(`✨ Usuario encontrado en Firebase Auth (UID: ${uid}).`);
      console.log(`📝 Creando perfil en la colección "users" con rol: '${role}'...`);
      
      const nameParts = (authUser.displayName || '').split(' ');
      await usersRef.doc(uid).set({
        email: authUser.email,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        role: role,
        createdAt: new Date()
      }, { merge: true });
      
      console.log('\x1b[32m%s\x1b[0m', `✅ ¡Éxito! Perfil creado en Firestore y rol asignado a: '${role}'`);
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Error inesperado durante la ejecución:', error);
    process.exit(1);
  }
}

run();
