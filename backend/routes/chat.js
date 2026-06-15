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

// ── Sinónimos para buscar productos por categoría ────────────────────────────
const CATEGORY_SYNONYMS = {
  "faldas":      ["faldas", "falda"],
  "vestidos":    ["vestidos", "vestido"],
  "blusas":      ["blusas", "blusa", "tops", "top"],
  "pantalones":  ["pantalones", "pantalon", "pants", "jeans", "mom jeans", "joggers"],
  "shorts":      ["shorts", "short"],
  "bomber":      ["bomber", "bombers", "chaqueta"],
  "chaquetas":   ["chaquetas", "chaqueta", "jackets", "bomber"],
  "abrigos":     ["abrigos", "abrigo", "coat", "coats"],
  "busos":       ["busos", "buso", "suéter", "sweater", "sudadera"],
  "leggings":    ["leggings", "legging", "mallas"],
  "conjuntos":   ["conjuntos", "conjunto", "sets"],
  "relojes":     ["relojes", "reloj", "watch", "watches"],
  "cadenas":     ["cadenas", "cadena", "cuello", "collar", "necklace"],
  "anillos":     ["anillos", "anillo", "ring", "rings"],
  "aretes":      ["aretes", "arete", "pendientes", "earrings"],
  "cinturones":  ["cinturones", "cinturon", "belt", "belts"],
  "gafas":       ["gafas", "lentes", "glasses", "sunglasses", "anteojos"],
  "bolsas":      ["bolsas", "bolsa", "bag", "bags", "cartera", "maletas"],
  "billeteras":  ["billeteras", "billetera", "wallet"],
  "tenis":       ["tenis", "sneakers", "zapatillas", "shoes"],
  "botas":       ["botas", "bota", "boots"],
  "sandalias":   ["sandalias", "sandalia", "slippers"],
};

// ── Sinónimos de departamentos ───────────────────────────────────────────────
const DEPT_SYNONYMS = {
  "mujer":   ["mujer", "mujeres", "femenino", "femenina", "damas", "dama"],
  "hombre":  ["hombre", "hombres", "masculino", "masculina", "caballeros", "caballero"],
  "accesorios": ["accesorios", "accesorio", "complementos"],
};

// ── Palabras clave que indican solicitud genérica de sugerencias ─────────────
const SUGGESTION_KEYWORDS = [
  "sugerencia", "sugerencias", "recomendacion", "recomendaciones",
  "que tienes", "que hay", "que ofreces", "que venden",
  "muestrame", "muestrame", "ensename", "enseñame",
  "que me recomiendas", "que recomiendas", "que me sugieres",
  "ayuda", "quiero ver", "quiero comprar",
  "nuevo", "nuevos", "novedades", "lo ultimo", "lo último",
  "populares", "favoritos", "mas vendido", "trending",
];

/**
 * Analiza el mensaje del usuario y busca productos relevantes en el catálogo.
 * Retorna los IDs de productos encontrados junto con la categoría detectada.
 */
function matchProducts(message, products) {
  const lower = message.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quitar acentos
    .replace(/[?!.,;:¡¿'"()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  let detectedCategory = null;
  let detectedDept = null;
  let isSaleRequest = false;

  // Detectar si busca ofertas / rebajas
  if (/\b(oferta|rebaja|rebajas|descuento|descuentos|promocion|promociones|barato|baratos|economico|economicos|sale)\b/.test(lower)) {
    isSaleRequest = true;
  }

  // Detectar categoría
  for (const [key, synonyms] of Object.entries(CATEGORY_SYNONYMS)) {
    for (const syn of synonyms) {
      if (lower.includes(syn)) {
        detectedCategory = key;
        break;
      }
    }
    if (detectedCategory) break;
  }

  // Detectar departamento
  for (const [key, synonyms] of Object.entries(DEPT_SYNONYMS)) {
    for (const syn of synonyms) {
      if (lower.includes(syn)) {
        detectedDept = key;
        break;
      }
    }
    if (detectedDept) break;
  }

  // Detectar si es una solicitud genérica de sugerencias
  const isSuggestionRequest = SUGGESTION_KEYWORDS.some(kw => lower.includes(kw));

  // Si no se detectó nada específico, no intentar filtrar
  if (!detectedCategory && !detectedDept && !isSaleRequest && !isSuggestionRequest) {
    return { matchedIds: [], detectedCategory, detectedDept, isSaleRequest, isSuggestionRequest };
  }

  let candidates = [...products];

  // Filtrar por departamento
  if (detectedDept) {
    const deptLower = detectedDept.toLowerCase();
    candidates = candidates.filter(p =>
      p.department && p.department.toLowerCase().includes(deptLower)
    );
  }

  // Filtrar por categoría/tipo
  if (detectedCategory) {
    const catLower = detectedCategory.toLowerCase();
    candidates = candidates.filter(p => {
      const typeName = (p.type || "").toLowerCase();
      const nameLower = (p.name || "").toLowerCase();
      return typeName.includes(catLower) || nameLower.includes(catLower);
    });
  }

  // Filtrar por ofertas
  if (isSaleRequest) {
    candidates = candidates.filter(p => p.sale === true || p.sale === "true");
  }

  // Si el filtro por categoría no dio resultados, buscar por nombre en todo el catálogo
  if (detectedCategory && candidates.length === 0) {
    const keywords = CATEGORY_SYNONYMS[detectedCategory] || [detectedCategory];
    candidates = products.filter(p => {
      const nameLower = (p.name || "").toLowerCase();
      const typeName = (p.type || "").toLowerCase();
      return keywords.some(k => nameLower.includes(k) || typeName.includes(k));
    });
    // Re-filtrar por dept si aplica
    if (detectedDept) {
      const deptLower = detectedDept.toLowerCase();
      candidates = candidates.filter(p =>
        p.department && p.department.toLowerCase().includes(deptLower)
      );
    }
  }

  // Si es solicitud genérica de sugerencias y no hubo filtro específico, mostrar destacados
  if (isSuggestionRequest && candidates.length === products.length) {
    // No se aplicó ningún filtro, seleccionar productos destacados
    const onSale = candidates.filter(p => p.sale === true || p.sale === "true");
    const rest = candidates.filter(p => !(p.sale === true || p.sale === "true"));
    // Mezclar: primero ofertas, luego otros al azar
    const shuffled = rest.sort(() => Math.random() - 0.5);
    candidates = [...onSale, ...shuffled];
  }

  // Tomar máximo 3 productos, priorizar los que están en rebaja
  const sorted = candidates.sort((a, b) => {
    const aSale = a.sale === true || a.sale === "true" ? 1 : 0;
    const bSale = b.sale === true || b.sale === "true" ? 1 : 0;
    return bSale - aSale;
  });

  const matchedIds = sorted.slice(0, 3).map(p => p.id);
  return { matchedIds, detectedCategory, detectedDept, isSaleRequest, isSuggestionRequest };
}

/**
 * Convierte un producto del catálogo al formato que espera el frontend.
 */
function formatProduct(product, reason = "") {
  const isOnSale = product.sale === true || product.sale === "true";
  return {
    id: product.id,
    name: product.name,
    price: isOnSale && product.salePrice != null ? product.salePrice : product.price,
    originalPrice: isOnSale ? product.price : null,
    sale: product.sale,
    image: product.image,
    department: product.department,
    reason,
  };
}

/**
 * Genera una razón breve para la sugerencia basada en la categoría detectada.
 */
function generateReason(product, detectedCategory, detectedDept, isSaleRequest) {
  const reasons = [];
  if (isSaleRequest) reasons.push("Está en oferta");
  if (detectedCategory) reasons.push(`Categoría: ${detectedCategory}`);
  if (detectedDept) reasons.push(`Departamento: ${detectedDept}`);
  return reasons.join(" · ") || (product.sale ? "Excelente precio" : "Muy popular");
}

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
      }).filter(p => p.stock > 0);
    } catch (err) {
      console.warn("No se pudo cargar el catálogo para el chat:", err.message);
    }

    // ── Matching server-side de productos (determinístico) ────────────────
    const { matchedIds, detectedCategory, detectedDept, isSaleRequest, isSuggestionRequest } = matchProducts(message, products);

    const matchedProducts = matchedIds
      .map(id => {
        const product = products.find(p => p.id === id);
        if (!product) return null;
        const reason = generateReason(product, detectedCategory, detectedDept, isSaleRequest);
        return formatProduct(product, reason);
      })
      .filter(Boolean);

    // ── Construir contexto de productos para la IA (solo como referencia) ─
    const productList = products.map(p => {
      const isOnSale = p.sale === true || p.sale === "true";
      const priceInfo = isOnSale
        ? `$${p.price} MXN (rebajado a $${p.salePrice} MXN)`
        : `$${p.price} MXN`;
      return `- ${p.name} | ${p.department || ""} | ${p.type || ""} | ${priceInfo} | Talla: ${p.size || "N/A"}`;
    }).join("\n");

    // ── System prompt: solo texto conversacional, sin JSON ────────────────
    const saleHint = isSaleRequest
      ? "\nEl usuario busca ofertas/rebajas. Menciona los precios rebajados en tu respuesta."
      : "";

    const isGenericSuggestion = !detectedCategory && !detectedDept && !isSaleRequest;

    const matchHint = matchedProducts.length > 0
      ? `\nEncontré estos productos que le podrían interesar al usuario: ${matchedProducts.map(p => p.name).join(", ")}. Menciónalos brevemente en tu respuesta. Las tarjetas de producto se muestran automáticamente.`
      : isGenericSuggestion
        ? "\nEl usuario pidió sugerencias. Menciona que puedes ayudarle a encontrar lo que busca. Pregunta si busca algo específico (ropa de mujer, hombre, accesorios, ofertas, etc.)"
        : "\nNo encontré productos específicos para esta búsqueda. Pregunta al usuario si busca algo específico y sugiérele categorías disponibles: faldas, vestidos, blusas, chaquetas, accesorios, etc.";

    const systemPrompt = `Eres LUXE AI, el asistente virtual oficial de la boutique de moda de lujo LUXE. Responde en español, de forma refinada y amable.${saleHint}${matchHint}

REGLAS:
- Responde de forma breve y cálida (máximo 2-3 oraciones).
- NO incluyas IDs de productos, precios ni tallas en tu respuesta. Esa información se muestra automáticamente en las tarjetas.
- NO uses markdown como **negrita** ni formato especial. Solo texto plano.
- Si el usuario pregunta por algo que no existe en el catálogo, sugiérele explorar las categorías disponibles.
- Sé amable y profesional.`;

    let replyText = "";

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
          max_tokens: 300
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error("OpenRouter API Error:", errData);
        // Si la IA falla, usar respuesta de fallback con productos server-side
        replyText = fallbackReply(detectedCategory, detectedDept, isSaleRequest, matchedProducts.length);
      } else {
        const data = await response.json();
        replyText = (data.choices?.[0]?.message?.content || "").trim();
      }
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
          generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error?.message || "";
        let friendlyMessage = "Error en el servicio de IA.";
        if (response.status === 400 || response.status === 403) friendlyMessage = `Clave inválida o acceso denegado (Error ${response.status}).`;
        else if (response.status === 429) friendlyMessage = `Cuota excedida (Error 429). Verifica tu plan.`;
        else if (errMsg) friendlyMessage = `Error de Gemini: ${errMsg}`;
        // Si la IA falla, usar respuesta de fallback
        replyText = fallbackReply(detectedCategory, detectedDept, isSaleRequest, matchedProducts.length);
      } else {
        const data = await response.json();
        replyText = (data.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
      }
    }

    // ── Limpiar la respuesta de la IA (por si acaso) ──────────────────────
    replyText = replyText
      .replace(/\*\*/g, "")
      .replace(/ID[:\s]+[A-Za-z0-9_-]+/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // Si la IA devolvió algo muy corto o vacío, usar fallback
    if (!replyText || replyText.length < 5) {
      replyText = fallbackReply(detectedCategory, detectedDept, isSaleRequest, matchedProducts.length);
    }

    res.status(200).json({
      reply: replyText,
      products: matchedProducts,
    });

  } catch (error) {
    console.error("Error en el chat:", error);
    res.status(500).json({ error: "Error interno en el servidor de chat." });
  }
});

/**
 * Respuesta de fallback cuando la IA no está disponible o no responde bien.
 */
function fallbackReply(category, dept, isSale, productCount) {
  if (productCount > 0) {
    const noun = category || "productos";
    const saleText = isSale ? " en oferta" : "";
    return `¡Encontré ${productCount} ${noun}${saleText} que podrían interesarte! Mira las tarjetas de abajo.`;
  }
  if (isSale) {
    return "Lamentablemente no encontré ofertas disponibles en este momento. Puedes revisar nuestro catálogo completo para ver las promociones actuales.";
  }
  return "¿Qué tipo de prenda o accesorio buscas? Puedo ayudarte a encontrar faldas, vestidos, blusas, chaquetas, accesorios y más. ¡También tenemos ofertas especiales!";
}

export default router;
