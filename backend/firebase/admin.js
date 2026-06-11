// server/firebase/admin.js
//
// RESPONSABILIDAD ÚNICA: inicializar el Admin SDK de Firebase y exportar
// la referencia a Firestore para que cualquier parte del servidor pueda usarla.
//
// ¿Por qué "Admin" SDK y no el mismo que usa React?
//
// React usa el SDK de "cliente": solo puede leer/escribir lo que las
// Firestore Security Rules permiten. Está pensado para el navegador.
//
// El Admin SDK corre en el SERVIDOR y tiene acceso total a Firestore,
// sin importar las reglas. Por eso las credenciales que lo autentican
// (serviceAccountKey.json) deben mantenerse SIEMPRE fuera del repositorio.

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// createRequire nos permite leer el archivo JSON de credenciales.
// Los ES Modules (import/export) no pueden hacer import de JSON directamente
// en todas las versiones de Node, así que usamos esta utilidad del sistema.
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

// __dirname no existe en ES Modules. Estas dos líneas lo recrean.
// __filename = ruta absoluta de ESTE archivo
// __dirname  = carpeta donde está este archivo
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Creamos una función "require" local para poder leer el JSON
const require = createRequire(import.meta.url);

// Cargamos las credenciales de la Service Account.
// La ruta "../serviceAccountKey.json" sube un nivel desde firebase/ → server/
// y encuentra el archivo que descargaste de la consola de Firebase.
//
// ⚠️ Si este archivo no existe, el servidor lanzará un error aquí mismo.
//    Eso es intencional: sin credenciales no tiene sentido arrancar.
const serviceAccount = require(
  path.join(__dirname, "../serviceAccountKey.json")
);

// Inicialización del Admin SDK.
// getApps().length > 0 previene que se inicialice dos veces si Node recarga
// el módulo (útil en desarrollo con herramientas como nodemon).
// Usamos la API modular (firebase-admin/app) compatible con versiones 11+.
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

// db es tu referencia a Firestore. Es exactamente igual al "db" que tienes
// en src/firebase/config.js, pero con permisos totales de administrador.
// Cualquier archivo que haga: import { db } from "../firebase/admin.js"
// obtendrá esta misma conexión ya inicializada.
const db = getFirestore();

export { db };
