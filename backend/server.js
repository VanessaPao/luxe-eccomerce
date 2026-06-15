// server.js — Punto de entrada del servidor Express de LUXE
//
// ¿Por qué "import" y no "require"?
// Porque en package.json configuraste "type": "module".
// Eso le dice a Node.js que este proyecto usa ES Modules (la sintaxis moderna),
// la misma que usas en React. Sin esa línea en package.json, tendrías que
// escribir: const express = require("express")
import 'dotenv/config'; // <-- NUEVO: Carga las variables del archivo .env automáticamente
import express from "express";
import cors from "cors"; // <-- NUEVO: Permite peticiones cruzadas (CORS)
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger.js";

// Importamos los routers de los endpoints.
import productsRouter from "./routes/products.js";
import ordersRouter from "./routes/orders.js";
import checkoutRouter from "./routes/checkout.js";
import chatRouter from "./routes/chat.js";
import supportRouter from "./routes/support.js"; // <-- NUEVO: Panel de soporte
import cartRouter from "./routes/cart.js";
import reviewsRouter from "./routes/reviews.js";
import carouselRouter from "./routes/carousel.js";
import usersRouter from "./routes/users.js";

// express() crea una "aplicación". Piénsala como el núcleo del servidor:
// es el objeto que recibe peticiones (requests) y devuelve respuestas (responses).
// Una sola aplicación puede manejar miles de rutas y middlewares.
const app = express();

// ── Configuración de CORS ─────────────────────────────────────────────
// Esencial para conectar frontend y backend en distintos puertos.
// Permite que el navegador del usuario haga peticiones a este servidor.
// Acepta múltiples orígenes separados por coma
const allowedOrigins = (
  process.env.FRONTEND_URL ||
  'http://localhost:5173,https://luxe-c582e.web.app,https://luxe-c582e.firebaseapp.com'
)
  .split(',')
  .map((url) => url.trim());
app.use(cors({ origin: allowedOrigins }));

// ── Documentación Swagger ────────────────────────────────────────────
// Sirve la interfaz de Swagger UI en la ruta /api-docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Endpoint para obtener el spec en JSON (útil para herramientas externas)
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// ── Middleware Global de Lectura de JSON ──────────────────────────────
// Por defecto, Express no sabe cómo interpretar el cuerpo de una petición POST
// que viene en formato JSON (el navegador envía un string plano).
// Este middleware intercepta la petición, verifica si el header Content-Type
// es application/json, parsea el string y lo asigna como un objeto en req.body.
// IMPORTANTE: Debe registrarse ANTES de cualquier ruta que requiera leer req.body.
app.use(express.json());

// El puerto es el "canal" por donde escucha tu servidor.
// 3001 es el número de puerta. React ya usa 5173, por eso elegimos otro.
// Usamos una variable de entorno (process.env.PORT) por si en producción
// el hosting asigna un puerto diferente. Si no existe esa variable, usamos 3001.
const PORT = process.env.PORT || 3001;

/**
 * @openapi
 * /:
 *   get:
 *     tags: [General]
 *     summary: Health check del servidor
 *     description: Devuelve un mensaje de confirmación de que el servidor Express está funcionando.
 *     responses:
 *       200:
 *         description: Servidor funcionando correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "🖤 Servidor de LUXE funcionando correctamente."
 */
app.get("/", (req, res) => {
  res.json({ message: "🖤 Servidor de LUXE funcionando correctamente." });
});

// app.use() registra el router bajo un prefijo de URL.
// Cualquier petición que empiece con "/api/products" será manejada
// por productsRouter. Express elimina el prefijo antes de pasarla,
// por eso dentro del router la ruta es "/" y no "/api/products".
app.use("/api/products", productsRouter);

// Registramos el router de órdenes bajo el prefijo "/api/orders".
// Cualquier petición POST a http://localhost:3001/api/orders será dirigida aquí.
app.use("/api/orders", ordersRouter);

// NUEVO: Registramos el router de checkout bajo el prefijo "/api/checkout".
// Aquí recibiremos la petición POST para crear la sesión de Stripe.
app.use("/api/checkout", checkoutRouter);

// NUEVO: Registramos el router de chat bajo el prefijo \"/api/chat\"
app.use("/api/chat", chatRouter);

// NUEVO: Registramos el router de soporte bajo el prefijo "/api/support"
app.use("/api/support", supportRouter);
app.use("/api/cart", cartRouter);
app.use("/api/reviews", reviewsRouter);
// Alias: algunos navegadores/clientes pueden enviar a /api/review (sin 's')
app.use("/api/review", reviewsRouter);
app.use("/api/carousel", carouselRouter);
app.use("/api/users", usersRouter);

// app.listen() es el momento en que el servidor "prende".
// Le decimos: "escucha en el puerto 3001 y cuando estés listo, ejecuta esta función".
// La función dentro solo imprime un mensaje en la consola para confirmarte que arrancó.
app.listen(PORT, () => {
  console.log(`✅ Servidor LUXE corriendo en http://localhost:${PORT}`);
});

