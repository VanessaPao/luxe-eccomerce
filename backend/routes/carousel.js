import { Router } from "express";
import { db } from "../firebase/admin.js";

const router = Router();

const COLLECTION = "carouselSlides";

/**
 * @openapi
 * /api/carousel:
 *   get:
 *     tags: [Carrusel]
 *     summary: Obtener todos los slides del carrusel
 *     description: Devuelve la lista de slides activos del hero carrusel, ordenados por su campo order.
 *     responses:
 *       200:
 *         description: Lista de slides del carrusel
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/CarouselSlide"
 *       500:
 *         description: Error del servidor
 */
router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection(COLLECTION).orderBy("order", "asc").get();
    const slides = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(slides);
  } catch (error) {
    console.error("Error obteniendo slides del carrusel:", error);
    res.status(500).json({ error: "Error al obtener los slides." });
  }
});

/**
 * @openapi
 * /api/carousel:
 *   post:
 *     tags: [Carrusel]
 *     summary: Crear un nuevo slide (Solo Admin)
 *     description: Registra un nuevo slide en el carrusel principal.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [image, title]
 *             properties:
 *               image:
 *                 type: string
 *                 description: URL de la imagen del slide
 *               tag:
 *                 type: string
 *                 description: Etiqueta destacada
 *               title:
 *                 type: string
 *                 description: Título principal del slide
 *               subtitle:
 *                 type: string
 *                 description: Subtítulo o descripción
 *               ctaText:
 *                 type: string
 *                 description: Texto del botón de acción
 *                 example: "Explorar"
 *               ctaLink:
 *                 type: string
 *                 description: URL del botón de acción
 *                 example: "/mujer"
 *               order:
 *                 type: integer
 *                 description: Orden de aparición
 *                 default: 0
 *               active:
 *                 type: boolean
 *                 description: Si el slide está activo
 *                 default: true
 *     responses:
 *       201:
 *         description: Slide creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/CarouselSlide"
 *       400:
 *         description: Faltan campos requeridos (image, title)
 *       500:
 *         description: Error del servidor
 */
router.post("/", async (req, res) => {
  try {
    const { image, tag, title, subtitle, ctaText, ctaLink, order, active } = req.body;

    if (!image || !title) {
      return res.status(400).json({ error: "Se requiere imagen y título." });
    }

    const newSlide = {
      image,
      tag: tag || "",
      title,
      subtitle: subtitle || "",
      ctaText: ctaText || "Explorar",
      ctaLink: ctaLink || "/mujer",
      order: order ?? 0,
      active: active !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const ref = await db.collection(COLLECTION).add(newSlide);
    res.status(201).json({ id: ref.id, ...newSlide });
  } catch (error) {
    console.error("Error creando slide:", error);
    res.status(500).json({ error: "Error al crear el slide." });
  }
});

/**
 * @openapi
 * /api/carousel/reorder/batch:
 *   put:
 *     tags: [Carrusel]
 *     summary: Reordenar slides en lote (Solo Admin)
 *     description: Actualiza el orden de múltiples slides de forma atómica. DEBE ir antes de /:id.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slides]
 *             properties:
 *               slides:
 *                 type: array
 *                 description: Array de slides con su nuevo orden
 *                 items:
 *                   type: object
 *                   required: [id, order]
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: ID del slide en Firestore
 *                     order:
 *                       type: integer
 *                       description: Nuevo orden del slide
 *     responses:
 *       200:
 *         description: Slides reordenados correctamente
 *       400:
 *         description: Se requiere un array de slides
 *       500:
 *         description: Error del servidor
 */
router.put("/reorder/batch", async (req, res) => {
  try {
    const { slides } = req.body;

    if (!Array.isArray(slides)) {
      return res.status(400).json({ error: "Se requiere un array de slides." });
    }

    const batch = db.batch();
    slides.forEach(({ id, order }) => {
      const ref = db.collection(COLLECTION).doc(id);
      batch.update(ref, { order, updatedAt: new Date() });
    });

    await batch.commit();
    res.status(200).json({ message: "Slides reordenados correctamente." });
  } catch (error) {
    console.error("Error reordenando slides:", error);
    res.status(500).json({ error: "Error al reordenar los slides." });
  }
});

/**
 * @openapi
 * /api/carousel/{id}:
 *   put:
 *     tags: [Carrusel]
 *     summary: Actualizar un slide (Solo Admin)
 *     description: Actualiza parcialmente los campos de un slide existente.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del slide en Firestore
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *               tag:
 *                 type: string
 *               title:
 *                 type: string
 *               subtitle:
 *                 type: string
 *               ctaText:
 *                 type: string
 *               ctaLink:
 *                 type: string
 *               order:
 *                 type: integer
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Slide actualizado correctamente
 *       404:
 *         description: Slide no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { image, tag, title, subtitle, ctaText, ctaLink, order, active } = req.body;

    const docRef = db.collection(COLLECTION).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: "Slide no encontrado." });
    }

    const updateData = { updatedAt: new Date() };
    if (image !== undefined) updateData.image = image;
    if (tag !== undefined) updateData.tag = tag;
    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (ctaText !== undefined) updateData.ctaText = ctaText;
    if (ctaLink !== undefined) updateData.ctaLink = ctaLink;
    if (order !== undefined) updateData.order = order;
    if (active !== undefined) updateData.active = active;

    await docRef.update(updateData);
    res.status(200).json({ id, ...updateData });
  } catch (error) {
    console.error("Error actualizando slide:", error);
    res.status(500).json({ error: "Error al actualizar el slide." });
  }
});

/**
 * @openapi
 * /api/carousel/{id}:
 *   delete:
 *     tags: [Carrusel]
 *     summary: Eliminar un slide (Solo Admin)
 *     description: Elimina permanentemente un slide del carrusel.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del slide en Firestore
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Slide eliminado correctamente
 *       404:
 *         description: Slide no encontrado
 *       500:
 *         description: Error del servidor
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection(COLLECTION).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: "Slide no encontrado." });
    }

    await docRef.delete();
    res.status(200).json({ message: "Slide eliminado correctamente." });
  } catch (error) {
    console.error("Error eliminando slide:", error);
    res.status(500).json({ error: "Error al eliminar el slide." });
  }
});

/**
 * @openapi
 * /api/carousel/seed:
 *   post:
 *     tags: [Carrusel]
 *     summary: Sembrar slides por defecto (Solo Admin)
 *     description: Inserta 5 slides predefinidos en Firestore solo si la colección está vacía. No duplica datos.
 *     responses:
 *       201:
 *         description: Slides sembrados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 *       200:
 *         description: Ya existen slides, no se sembraron duplicados
 *       500:
 *         description: Error del servidor
 */
router.post("/seed", async (req, res) => {
  try {
    const snapshot = await db.collection(COLLECTION).get();
    if (!snapshot.empty) {
      return res.status(200).json({ message: "Ya existen slides, no se sembraron duplicados.", count: snapshot.size });
    }

    const defaultSlides = [
      {
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?q=80&w=1600&auto=format&fit=crop",
        tag: "LUXE BOUTIQUE",
        title: "Tu nueva era",
        subtitle: "Moda premium que define tendencia. Descubre el estilo que buscabas.",
        ctaText: "Explorar",
        ctaLink: "/mujer",
        order: 0,
        active: true,
      },
      {
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600&auto=format&fit=crop",
        tag: "Y2K COLLECTION",
        title: "Retro es futuro",
        subtitle: "Piezas que mezclan nostalgia y vanguardia. Estilo que no pasa de moda.",
        ctaText: "Ver Colección",
        ctaLink: "/mujer",
        order: 1,
        active: true,
      },
      {
        image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1600&auto=format&fit=crop",
        tag: "JUST DROPPED",
        title: "Diseñada para brillar",
        subtitle: "Nuevas piezas que definen tendencia. Sé la primera en tenerlas.",
        ctaText: "Ver Ahora",
        ctaLink: "/mujer",
        order: 2,
        active: true,
      },
      {
        image: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1600&auto=format&fit=crop",
        tag: "UP TO 40% OFF",
        title: "Estilo en oferta",
        subtitle: "Lo que buscas, a precios que no vas a querer perderte.",
        ctaText: "Comprar Ahora",
        ctaLink: "/rebajas",
        order: 3,
        active: true,
      },
      {
        image: "https://images.unsplash.com/photo-1611085583191-a3b181a88401?q=80&w=1600&auto=format&fit=crop",
        tag: "EXCLUSIVE",
        title: "El toque final",
        subtitle: "Bolsas, joyería y complementos que elevan cualquier outfit.",
        ctaText: "Explorar",
        ctaLink: "/accesorios",
        order: 4,
        active: true,
      },
    ];

    const now = new Date();
    const batch = db.batch();
    defaultSlides.forEach((slide) => {
      const ref = db.collection(COLLECTION).doc();
      batch.set(ref, { ...slide, createdAt: now, updatedAt: now });
    });
    await batch.commit();

    res.status(201).json({ message: `${defaultSlides.length} slides sembrados correctamente.`, count: defaultSlides.length });
  } catch (error) {
    console.error("Error sembrando slides:", error);
    res.status(500).json({ error: "Error al sembrar slides." });
  }
});

export default router;
