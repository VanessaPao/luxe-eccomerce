import { Router } from "express";
import { db } from "../firebase/admin.js";

const router = Router();

/**
 * @openapi
 * /api/support/tickets:
 *   get:
 *     tags: [Soporte]
 *     summary: Obtener todos los tickets de soporte
 *     description: Recupera la lista completa de tickets registrados en el sistema de soporte (vista del agente/administrador).
 *     responses:
 *       200:
 *         description: Lista de tickets obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Ticket"
 *       500:
 *         description: Error del servidor
 */
router.get("/tickets", async (req, res) => {
  try {
    const snapshot = await db.collection("supportTickets")
      .orderBy("createdAt", "desc")
      .get();

    const tickets = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() ?? null,
    }));

    res.status(200).json(tickets);
  } catch (error) {
    console.error("Error obteniendo tickets:", error);
    res.status(500).json({ error: "Error al obtener los tickets de soporte." });
  }
});

/**
 * @openapi
 * /api/support/tickets/user/{userId}:
 *   get:
 *     tags: [Soporte]
 *     summary: Obtener tickets de un usuario
 *     description: Recupera los tickets creados por un usuario específico (vista del cliente).
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de usuario en Firebase Auth
 *     responses:
 *       200:
 *         description: Lista de tickets del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Ticket"
 *       500:
 *         description: Error del servidor
 */
router.get("/tickets/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const snapshot = await db.collection("supportTickets")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    const tickets = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() ?? null,
    }));

    res.status(200).json(tickets);
  } catch (error) {
    console.error("Error obteniendo tickets del usuario:", error);
    res.status(500).json({ error: "Error al obtener los tickets del usuario." });
  }
});

/**
 * @openapi
 * /api/support/tickets:
 *   post:
 *     tags: [Soporte]
 *     summary: Crear un nuevo ticket de soporte
 *     description: Registra un nuevo ticket de soporte del cliente en Firestore.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, subject, message]
 *             properties:
 *               userId: { type: string }
 *               userName: { type: string }
 *               userEmail: { type: string }
 *               subject: { type: string }
 *               message: { type: string }
 *     responses:
 *       201:
 *         description: Ticket creado con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: string }
 *                 message: { type: string }
 *       400:
 *         description: Datos faltantes
 *       500:
 *         description: Error del servidor
 */
router.post("/tickets", async (req, res) => {
  try {
    const { userId, userName, userEmail, subject, message } = req.body;

    if (!userId || !subject || !message) {
      return res.status(400).json({ error: "Faltan datos requeridos (userId, subject, message)." });
    }

    const newTicket = {
      userId,
      userName: userName || "Cliente",
      userEmail: userEmail || "",
      subject,
      messages: [
        {
          sender: "user",
          senderName: userName || "Cliente",
          text: message,
          timestamp: new Date().toISOString(),
        }
      ],
      status: "open", // open | in_progress | resolved | closed
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const ref = await db.collection("supportTickets").add(newTicket);
    res.status(201).json({ id: ref.id, message: "Ticket creado exitosamente." });
  } catch (error) {
    console.error("Error creando ticket:", error);
    res.status(500).json({ error: "Error al crear el ticket." });
  }
});

/**
 * @openapi
 * /api/support/tickets/{id}/reply:
 *   post:
 *     tags: [Soporte]
 *     summary: Responder a un ticket de soporte
 *     description: Agrega un nuevo mensaje de respuesta al ticket de soporte.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del ticket
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               senderRole: { type: string, enum: [user, support] }
 *               senderName: { type: string }
 *               text: { type: string }
 *               status: { type: string, enum: [open, in_progress, resolved, closed] }
 *     responses:
 *       200:
 *         description: Respuesta agregada correctamente
 *       400:
 *         description: Faltan datos
 *       404:
 *         description: Ticket no encontrado
 *       500:
 *         description: Error del servidor
 */
router.post("/tickets/:id/reply", async (req, res) => {
  try {
    const { id } = req.params;
    const { senderRole, senderName, text, status } = req.body;

    if (!text) {
      return res.status(400).json({ error: "El texto de la respuesta es requerido." });
    }

    const ticketRef = db.collection("supportTickets").doc(id);
    const ticketSnap = await ticketRef.get();

    if (!ticketSnap.exists) {
      return res.status(404).json({ error: "Ticket no encontrado." });
    }

    const newMessage = {
      sender: senderRole || "support",
      senderName: senderName || "Agente LUXE",
      text,
      timestamp: new Date().toISOString(),
    };

    const updateData = {
      messages: [...(ticketSnap.data().messages || []), newMessage],
      updatedAt: new Date(),
    };

    if (status) updateData.status = status;

    await ticketRef.update(updateData);
    res.status(200).json({ message: "Respuesta enviada correctamente." });
  } catch (error) {
    console.error("Error respondiendo ticket:", error);
    res.status(500).json({ error: "Error al responder el ticket." });
  }
});

/**
 * @openapi
 * /api/support/tickets/{id}/status:
 *   patch:
 *     tags: [Soporte]
 *     summary: Actualizar estado de un ticket
 *     description: Cambia el estado del ticket de soporte (ej. de 'open' a 'in_progress' o 'resolved').
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del ticket
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [open, in_progress, resolved, closed] }
 *     responses:
 *       200:
 *         description: Estado actualizado
 *       400:
 *         description: Estado inválido
 *       500:
 *         description: Error del servidor
 */
router.patch("/tickets/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["open", "in_progress", "resolved", "closed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Estado inválido." });
    }

    await db.collection("supportTickets").doc(id).update({
      status,
      updatedAt: new Date(),
    });

    res.status(200).json({ message: `Estado actualizado a '${status}'.` });
  } catch (error) {
    console.error("Error actualizando estado:", error);
    res.status(500).json({ error: "Error al actualizar el estado del ticket." });
  }
});

export default router;
