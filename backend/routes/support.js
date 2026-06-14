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
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? doc.data().createdAt ?? null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() ?? doc.data().updatedAt ?? null,
      assignedAt: doc.data().assignedAt?.toDate?.()?.toISOString() ?? doc.data().assignedAt ?? null,
      resolvedAt: doc.data().resolvedAt?.toDate?.()?.toISOString() ?? doc.data().resolvedAt ?? null,
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
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? doc.data().createdAt ?? null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() ?? doc.data().updatedAt ?? null,
      assignedAt: doc.data().assignedAt?.toDate?.()?.toISOString() ?? doc.data().assignedAt ?? null,
      resolvedAt: doc.data().resolvedAt?.toDate?.()?.toISOString() ?? doc.data().resolvedAt ?? null,
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
          senderId: userId,
          senderName: userName || "Cliente",
          text: message,
          timestamp: new Date().toISOString(),
        }
      ],
      status: "open", // open | in_progress | resolved | closed
      createdAt: new Date(),
      updatedAt: new Date(),
      activityLog: [
        {
          type: "ticket_created",
          userId,
          userName: userName || "Cliente",
          timestamp: new Date().toISOString()
        }
      ]
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
    const { senderId, senderRole, senderName, text, status } = req.body;

    if (!text) {
      return res.status(400).json({ error: "El texto de la respuesta es requerido." });
    }

    const ticketRef = db.collection("supportTickets").doc(id);
    const ticketSnap = await ticketRef.get();

    if (!ticketSnap.exists) {
      return res.status(404).json({ error: "Ticket no encontrado." });
    }

    const ticketData = ticketSnap.data();
    const currentActivityLog = ticketData.activityLog || [];
    const newActivityLog = [...currentActivityLog];

    // Asignar automáticamente cuando un agente responde por primera vez
    let assignmentUpdate = {};
    if ((senderRole === "support" || senderRole === "admin") && !ticketData.assignedTo) {
      const assignmentTime = new Date();
      assignmentUpdate = {
        assignedTo: senderId || "unknown_agent",
        assignedToName: senderName || "Agente Soporte",
        assignedAt: assignmentTime
      };
      newActivityLog.push({
        type: "assigned",
        userId: senderId || "unknown_agent",
        userName: senderName || "Agente Soporte",
        timestamp: assignmentTime.toISOString()
      });
    }

    // Registrar reply_sent en el historial de actividad
    newActivityLog.push({
      type: "reply_sent",
      userId: senderId || (senderRole === "user" ? ticketData.userId : "unknown_agent"),
      userName: senderName || "Usuario",
      timestamp: new Date().toISOString()
    });

    const newMessage = {
      sender: senderRole || "support",
      senderId: senderId || ticketData.userId || "unknown",
      senderName: senderName || "Agente LUXE",
      text,
      timestamp: new Date().toISOString(),
    };

    const updateData = {
      messages: [...(ticketData.messages || []), newMessage],
      updatedAt: new Date(),
      activityLog: newActivityLog,
      ...assignmentUpdate
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
    const { status, changedById, changedByName, changedByRole } = req.body;

    const validStatuses = ["open", "in_progress", "resolved", "closed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Estado inválido." });
    }

    const ticketRef = db.collection("supportTickets").doc(id);
    const ticketSnap = await ticketRef.get();

    if (!ticketSnap.exists) {
      return res.status(404).json({ error: "Ticket no encontrado." });
    }

    const ticketData = ticketSnap.data();
    const currentActivityLog = ticketData.activityLog || [];
    const newActivityLog = [...currentActivityLog];

    const changeTime = new Date();
    let resolutionUpdate = {};
    let eventType = "status_changed";

    if (status === "resolved" || status === "closed") {
      eventType = status; // "resolved" o "closed"
      resolutionUpdate = {
        resolvedBy: changedById || "unknown_agent",
        resolvedByName: changedByName || "Agente Soporte",
        resolvedAt: changeTime
      };
    }

    newActivityLog.push({
      type: eventType,
      userId: changedById || "system",
      userName: changedByName || "Sistema/Agente",
      timestamp: changeTime.toISOString()
    });

    const updateData = {
      status,
      updatedAt: changeTime,
      activityLog: newActivityLog,
      ...resolutionUpdate
    };

    await db.collection("supportTickets").doc(id).update(updateData);

    res.status(200).json({ message: `Estado actualizado a '${status}'.` });
  } catch (error) {
    console.error("Error actualizando estado:", error);
    res.status(500).json({ error: "Error al actualizar el estado del ticket." });
  }
});

/**
 * @openapi
 * /api/support/admin/metrics:
 *   get:
 *     tags: [Soporte]
 *     summary: Obtener métricas y auditoría de soporte para el administrador
 *     description: Calcula en el servidor el resumen general, estadísticas por agente, ranking y tiempos promedio de resolución.
 *     responses:
 *       200:
 *         description: Métricas calculadas correctamente
 *       500:
 *         description: Error del servidor
 */
router.get("/admin/metrics", async (req, res) => {
  try {
    // 1. Obtener todos los tickets
    const ticketsSnapshot = await db.collection("supportTickets").get();
    const tickets = ticketsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt ?? null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? data.updatedAt ?? null,
        assignedAt: data.assignedAt?.toDate?.()?.toISOString() ?? data.assignedAt ?? null,
        resolvedAt: data.resolvedAt?.toDate?.()?.toISOString() ?? data.resolvedAt ?? null,
      };
    });

    // 2. Obtener todos los agentes/admins de la colección users
    const usersSnapshot = await db.collection("users")
      .where("role", "in", ["support", "admin"])
      .get();
    const agentsList = usersSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));

    // Combinar agentes con los que están registrados en tickets pero no en base de datos
    const allAgentsMap = {};
    agentsList.forEach(a => {
      allAgentsMap[a.uid] = {
        uid: a.uid,
        name: `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email || 'Agente de Soporte',
        role: a.role,
        email: a.email
      };
    });

    tickets.forEach(t => {
      if (t.assignedTo && !allAgentsMap[t.assignedTo]) {
        allAgentsMap[t.assignedTo] = {
          uid: t.assignedTo,
          name: t.assignedToName || 'Agente Histórico',
          role: 'support',
          email: ''
        };
      }
    });

    const allAgents = Object.values(allAgentsMap);

    // 3. Calcular métricas globales
    const totalOpen = tickets.filter(t => t.status === 'open').length;
    const totalInProgress = tickets.filter(t => t.status === 'in_progress').length;
    const totalResolved = tickets.filter(t => t.status === 'resolved').length;
    const totalClosed = tickets.filter(t => t.status === 'closed').length;

    const resolvedTickets = tickets.filter(t => (t.status === 'resolved' || t.status === 'closed') && t.assignedAt && t.resolvedAt);
    const globalResolutionTime = resolvedTickets.length > 0
      ? resolvedTickets.reduce((sum, t) => sum + (new Date(t.resolvedAt) - new Date(t.assignedAt)), 0) / resolvedTickets.length
      : 0;

    const STATUS_LABELS = {
      open: 'Abierto',
      in_progress: 'En Progreso',
      resolved: 'Resuelto',
      closed: 'Cerrado',
    };

    // 4. Calcular métricas por agente
    const agentMetrics = allAgents.map(agent => {
      const assignedTickets = tickets.filter(t => t.assignedTo === agent.uid);
      const open = assignedTickets.filter(t => t.status === 'open').length;
      const inProgress = assignedTickets.filter(t => t.status === 'in_progress').length;
      const resolved = assignedTickets.filter(t => t.status === 'resolved').length;
      const closed = assignedTickets.filter(t => t.status === 'closed').length;

      let lastActivityTime = null;
      let lastActivityDesc = 'Sin actividad';

      tickets.forEach(t => {
        if (!Array.isArray(t.activityLog)) return;
        t.activityLog.forEach(log => {
          if (!log || typeof log !== 'object') return;
          if (log.userId === agent.uid) {
            const logTime = new Date(log.timestamp);
            if (!lastActivityTime || logTime > lastActivityTime) {
              lastActivityTime = logTime;
              const subject = (t.subject || 'Sin asunto').slice(0, 20);
              lastActivityDesc = `${STATUS_LABELS[log.type] || log.type} (${subject}...)`;
            }
          }
        });
      });

      const agentResolved = assignedTickets.filter(t => (t.status === 'resolved' || t.status === 'closed') && t.assignedAt && t.resolvedAt);
      const avgResTime = agentResolved.length > 0
        ? agentResolved.reduce((sum, t) => sum + (new Date(t.resolvedAt) - new Date(t.assignedAt)), 0) / agentResolved.length
        : 0;

      return {
        ...agent,
        assignedCount: assignedTickets.length,
        openCount: open + inProgress,
        resolvedCount: resolved,
        closedCount: closed,
        totalFinished: resolved + closed,
        lastActivityTime: lastActivityTime ? lastActivityTime.toISOString() : null,
        lastActivityDesc,
        avgResTime
      };
    });

    const agentRanking = [...agentMetrics].sort((a, b) => b.totalFinished - a.totalFinished);

    res.status(200).json({
      summary: {
        open: totalOpen,
        in_progress: totalInProgress,
        resolved: totalResolved,
        closed: totalClosed,
        globalResolutionTime
      },
      agentMetrics,
      agentRanking,
      tickets
    });
  } catch (error) {
    console.error("Error obteniendo métricas de soporte:", error);
    res.status(500).json({ error: "Error al obtener las métricas de soporte." });
  }
});

export default router;
