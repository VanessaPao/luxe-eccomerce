import express from "express";
import { db, auth } from "../firebase/admin.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags: [Usuarios]
 *     summary: Listar todos los usuarios
 *     security:
 *       - BearerAuth: []
 *     description: Retorna una lista con todos los usuarios registrados en Firestore. Solo accesible para administradores.
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   uid:
 *                     type: string
 *                   email:
 *                     type: string
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   role:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *       401:
 *         description: Token no proporcionado o inválido.
 *       403:
 *         description: Acceso denegado. Se requiere rol admin.
 */
router.get("/", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.orderBy("createdAt", "desc").get();

    const users = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        uid: doc.id,
        email: data.email || "",
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        role: data.role || "user",
        createdAt: data.createdAt?.toDate?.()
          ? data.createdAt.toDate().toISOString()
          : data.createdAt || null,
      });
    });

    res.status(200).json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error.message);
    res.status(500).json({ error: "Error al obtener la lista de usuarios." });
  }
});

/**
 * @openapi
 * /api/users/{uid}/role:
 *   patch:
 *     tags: [Usuarios]
 *     summary: Actualizar el rol de un usuario
 *     security:
 *       - BearerAuth: []
 *     description: Permite a un administrador cambiar el rol de un usuario. Los roles válidos son: admin, support, user.
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: UID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, support, user]
 *                 description: Nuevo rol del usuario
 *     responses:
 *       200:
 *         description: Rol actualizado exitosamente.
 *       400:
 *         description: Rol inválido o datos faltantes.
 *       401:
 *         description: Token no proporcionado o inválido.
 *       403:
 *         description: Acceso denegado. Se requiere rol admin.
 *       404:
 *         description: Usuario no encontrado.
 */
router.patch("/:uid/role", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const { uid } = req.params;
    const { role } = req.body;

    const validRoles = ["admin", "support", "user"];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        error: `Rol inválido. Los roles válidos son: ${validRoles.join(", ")}`,
      });
    }

    // Verificar que el usuario existe
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    // Actualizar el rol
    await db.collection("users").doc(uid).update({ role });

    res.status(200).json({
      message: `Rol del usuario actualizado a '${role}' exitosamente.`,
      uid,
      role,
    });
  } catch (error) {
    console.error("Error al actualizar rol:", error.message);
    res.status(500).json({ error: "Error al actualizar el rol del usuario." });
  }
});

export default router;
