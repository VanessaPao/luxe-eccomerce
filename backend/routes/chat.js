import { Router } from "express";
import { db } from "../firebase/admin.js";

const router = Router();

/**
 * @openapi
 * /api/chat:
 *   post:
 *     tags: [Chatbot]
 *     summary: Chatear con la Inteligencia Artificial de LUXE
 *     description: Envía un mensaje al chatbot del catálogo de LUXE, el cual responde de forma contextual recomendando productos disponibles.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: El mensaje que envía el usuario
 *                 example: "Busco vestidos elegantes en rebaja"
 *               history:
 *                 type: array
 *                 description: Historial del chat anterior para mantener el contexto
 *                 items:
 *                   type: object
 *                   properties:
 *                     sender:
 *                       type: string
 *                       enum: [user, bot]
 *                     text:
 *                       type: string
 *     responses:
 *       200:
 *         description: Respuesta exitosa del asistente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reply:
 *                   type: string
 *                   description: Mensaje del chatbot
 *                   example: "¡Hola! He encontrado este hermoso vestido..."
 *                 products:
 *                   type: array
 *                   description: Productos recomendados adjuntos
 *                   items:
 *                     $ref: "#/components/schemas/Product"
 *       400:
 *         description: Faltan datos requeridos
 *       500:
 *         description: Error de configuración de claves de API de IA o error interno
 */
router.post("/", async (req, res) => {
  try {
    const { message, history } = req.body;
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!openRouterKey && !geminiKey) {
      return res.status(500).json({ error: "Debe configurar OPENROUTER_API_KEY o GEMINI_API_KEY en el servidor." });
    }

    if (!message) {
      return res.status(400).json({ error: "Se requiere un mensaje." });
    }

    // ── Obtener catálogo real de Firestore ────────────────────────────────
    let products = [];
    try {
      const snapshot = await db.collection("products").get();
      products = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          name: d.name,
          department: d.department,
          type: d.type,
          price: d.price,
          salePrice: d.salePrice,
          sale: d.sale,
          size: d.size,
          color: d.color,
          stock: d.stock,
          image: d.image,
        };
      }).filter(p => p.stock > 0); // Solo productos con stock
    } catch (err) {
      console.warn("No se pudo cargar el catálogo para el chat:", err.message);
    }

    const productList = products.map(p => {
      const isOnSale = p.sale === true || p.sale === 'true';
      const priceInfo = isOnSale
        ? `Precio Original: $${p.price} MXN | PRECIO REBAJADO: $${p.salePrice} MXN | ¡EN REBAJA / OFERTA!`
        : `Precio: $${p.price} MXN`;
      return `[ID:${p.id}] ${p.name} | Depto: ${p.department} | Tipo: ${p.type} | ${priceInfo} | Talla: ${p.size} | Color: ${p.color}`;
    }).join("\n");

    // ── System prompt con instrucción de respuesta en JSON ────────────────
    const systemPrompt = `Eres LUXE AI, el asistente virtual oficial de la boutique de moda de lujo LUXE. Responde en español, de forma refinada y amable.

CATÁLOGO ACTUAL (solo productos con stock disponible):
${productList || "Sin productos disponibles en este momento."}

INSTRUCCIONES IMPORTANTES:
- Si el usuario te pregunta por ofertas, rebajas, promociones, descuentos, precios especiales o rebajados, debes recomendarle productos que tengan la etiqueta "¡EN REBAJA / OFERTA!" y explicarle que tienen un precio con descuento.
- Cuando sugieras productos del catálogo, DEBES incluir su ID en tu respuesta.
- Tu respuesta SIEMPRE debe ser un objeto JSON válido con este formato exacto:
{
  "text": "Tu respuesta amable aquí",
  "products": [
    { "id": "ID_DEL_PRODUCTO", "reason": "Por qué lo recomiendas (muy corto)" }
  ]
}
- Si no sugieres ningún producto, "products" debe ser un array vacío [].
- El campo "text" debe ser conciso para que quepa en un chat flotante.
- No incluyas productos que el usuario no pidió o que no son relevantes.
- SOLO responde con el JSON, sin texto antes ni después.`;

    let rawReply = "";

    // ─── MODO 1: OPENROUTER ───────────────────────────────────────────────
    if (openRouterKey) {
      const messages = [
        { role: "system", content: systemPrompt }
      ];

      if (history && Array.isArray(history)) {
        history.forEach((h) => {
          messages.push({
            role: h.sender === "user" ? "user" : "assistant",
            content: h.text
          });
        });
      }

      messages.push({ role: "user", content: message });

      const model = process.env.OPENROUTER_MODEL || "liquid/lfm-2.5-1.2b-instruct:free";

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openRouterKey}`,
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "LUXE E-commerce"
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 600
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error("OpenRouter API Error:", errData);
        return res.status(response.status).json({
          error: `Error de OpenRouter (Status ${response.status}): ${errData.error?.message || "No autorizado o sin saldo."}`
        });
      }

      const data = await response.json();
      rawReply = data.choices?.[0]?.message?.content || "";
    } else {
      // ─── MODO 2: GEMINI DIRECTO ─────────────────────────────────────────
      const contents = [];

      if (history && Array.isArray(history)) {
        history.forEach((h) => {
          contents.push({
            role: h.sender === "user" ? "user" : "model",
            parts: [{ text: h.text }]
          });
        });
      }

      contents.push({
        role: "user",
        parts: [{ text: contents.length === 0 ? `${systemPrompt}\n\nCliente: ${message}` : message }]
      });

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error?.message || "";
        let friendlyMessage = "Error en el servicio de IA.";
        if (response.status === 400 || response.status === 403) friendlyMessage = `Clave inválida o acceso denegado (Error ${response.status}).`;
        else if (response.status === 429) friendlyMessage = `Cuota excedida (Error 429). Verifica tu plan.`;
        else if (errMsg) friendlyMessage = `Error de Gemini: ${errMsg}`;
        return res.status(response.status).json({ error: friendlyMessage });
      }

      const data = await response.json();
      rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    // ── Parsear JSON de la respuesta ──────────────────────────────────────
    let replyText = rawReply.trim();
    let suggestedProducts = [];

    try {
      // Extraer el JSON aunque el modelo ponga markdown code fences
      const jsonMatch = rawReply.match(/```json\s*([\s\S]*?)```/) ||
                        rawReply.match(/```\s*([\s\S]*?)```/) ||
                        rawReply.match(/(\{[\s\S]*\})/);
      
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : rawReply;
      const parsed = JSON.parse(jsonStr);

      replyText = parsed.text || rawReply;

      // Enriquecer los productos sugeridos con datos reales del catálogo
      if (parsed.products && Array.isArray(parsed.products)) {
        suggestedProducts = parsed.products
          .map(sp => {
            const product = products.find(p => p.id === sp.id);
            if (!product) return null;
            return {
              id: product.id,
              name: product.name,
              price: product.sale && product.salePrice != null ? product.salePrice : product.price,
              originalPrice: product.sale ? product.price : null,
              sale: product.sale,
              image: product.image,
              department: product.department,
              reason: sp.reason || "",
            };
          })
          .filter(Boolean)
          .slice(0, 3); // Máximo 3 productos sugeridos
      }
    } catch {
      // Si la IA no respondió con JSON válido, usamos el texto puro como fallback
      console.warn("Chat: La IA no devolvió JSON válido, usando texto puro.");
      replyText = rawReply;
    }

    res.status(200).json({
      reply: replyText.trim(),
      products: suggestedProducts,
    });

  } catch (error) {
    console.error("Error en el chat:", error);
    res.status(500).json({ error: "Error interno en el servidor de chat." });
  }
});

export default router;
