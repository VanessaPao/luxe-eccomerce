/**
 * middleware/auth.js
 *
 * Middleware de autenticación basado en Firebase ID Tokens.
 *
 * CÓMO FUNCIONA:
 * 1. El frontend obtiene el ID Token del usuario autenticado con:
 *    const token = await firebaseUser.getIdToken();
 *
 * 2. El frontend envía el token en cada petición protegida:
 *    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
 *
 * 3. Este middleware verifica el token con Firebase Admin SDK.
 *    Si es válido, adjunta los datos del usuario a req.user.
 *
 * USO EN RUTAS:
 *   import { authenticateToken, requireRole } from "../middleware/auth.js";
 *
 *   // Solo requiere estar autenticado
 *   router.get("/perfil", authenticateToken, miHandler);
 *
 *   // Requiere rol de admin
 *   router.post("/productos", authenticateToken, requireRole("admin"), miHandler);
 */

import { auth, db } from "../firebase/admin.js";

/**
 * Middleware: Verifica que el request incluya un Firebase ID Token válido.
 * Si es válido, adjunta el usuario decodificado a req.user.
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Acceso denegado. Se requiere un token de autenticación válido.",
    });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);

    // Buscar el rol del usuario en Firestore (colección "users")
    let role = "user"; // rol por defecto
    try {
      const userDoc = await db.collection("users").doc(decodedToken.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData.role) {
          role = userData.role;
        }
      }
    } catch {
      // Si no se puede leer Firestore, mantiene el rol "user"
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      role,
    };

    next();
  } catch (error) {
    console.error("Error verificando token:", error.message);

    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({ error: "Token expirado. Inicia sesión nuevamente." });
    }
    return res.status(403).json({ error: "Token inválido." });
  }
}

/**
 * Middleware: Verifica que el usuario tenga el rol especificado.
 * DEBE usarse DESPUÉS de authenticateToken.
 *
 * @param {...string} allowedRoles - Roles permitidos (ej. "admin", "support")
 *
 * Uso:
 *   router.delete("/productos/:id", authenticateToken, requireRole("admin"), handler);
 *   router.get("/soporte/tickets", authenticateToken, requireRole("admin", "support"), handler);
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "No autenticado." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Acceso denegado. Se requiere uno de estos roles: ${allowedRoles.join(", ")}.`,
        yourRole: req.user.role,
      });
    }

    next();
  };
}
