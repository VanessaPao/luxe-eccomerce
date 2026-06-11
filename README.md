# 🖤 LUXE — E-commerce de Moda Premium

Tienda en línea de moda premium construida con React + Vite (frontend), Express (backend) y Firebase (hosting, auth, Firestore).

## 📁 Estructura del Proyecto

```
├── frontend/          ← React + Vite (interfaz del usuario)
│   ├── src/
│   │   ├── components/    ← Componentes reutilizables (Navbar, Hero, ProductCard...)
│   │   ├── context/       ← AuthContext, CartContext (estado global)
│   │   ├── firebase/      ← Configuración de Firebase SDK cliente
│   │   ├── hooks/         ← Custom hooks (useProducts, useFavourites...)
│   │   ├── pages/         ← Páginas de la app (Mujer, Hombre, Cart, Checkout...)
│   │   └── utils/         ← Utilidades (cloudinary.js)
│   ├── public/             ← Favicon, iconos estáticos
│   └── .env                ← Variables de entorno (NUNCA subir al repo)
│
├── backend/           ← Express.js (API REST + lógica de negocio)
│   ├── models/            ← Acceso a Firestore (productModel, orderModel)
│   ├── controllers/       ← Lógica de negocio (productController, orderController)
│   ├── routes/            ← Definición de rutas HTTP
│   ├── firebase/          ← Firebase Admin SDK (admin.js)
│   ├── server.js          ← Punto de entrada del servidor
│   ├── swagger.js         ← Documentación Swagger
│   └── serviceAccountKey.json  ← Credenciales Admin (NUNCA subir)
│
├── functions/         ← Cloud Functions de Firebase (pagos con Stripe)
│   ├── createCheckoutSession    ← Crea sesión de pago Stripe
│   ├── verifyStripePayment      ← Verifica pago y crea orden
│   └── simulateMercadoPagoOrder ← Simula pago con Mercado Pago
│
└── firebase.json      ← Configuración de Firebase (hosting, functions, firestore)
```

## 🚀 Cómo arrancar el proyecto

### Prerrequisitos

- [Node.js](https://nodejs.org/) v18 o superior
- [Firebase CLI](https://firebase.google.com/docs/cli) instalado globalmente
- Cuenta de Firebase con el proyecto `luxe-c582e` configurado

### 1. Instalar dependencias

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install

# Cloud Functions
cd ../functions
npm install
```

### 2. Configurar variables de entorno

**Frontend** — Copiar `.env.example` a `.env` y completar:

```bash
cd frontend
cp .env.example .env
```

Variables necesarias:
- `VITE_CLOUDINARY_CLOUD_NAME` — Cloud name de Cloudinary
- `VITE_CLOUDINARY_UPLOAD_PRESET` — Upload preset de Cloudinary
- `VITE_FIREBASE_*` — Credenciales de Firebase SDK (desde Firebase Console → Project Settings)

**Functions** — Crear `functions/.env` con:

```
STRIPE_SECRET_KEY=sk_test_...
```

### 3. Arrancar el servidor

**Terminal 1 — Backend (Express):**

```bash
cd backend
npm start
# → Servidor LUXE corriendo en http://localhost:3001
```

**Terminal 2 — Frontend (Vite):**

```bash
cd frontend
npm run dev
# → http://localhost:5173
```

> El `vite.config.js` ya tiene configurado un proxy: cualquier petición a `/api/*` se redirige automáticamente a `http://localhost:3001`. No necesitas CORS en desarrollo.

### 4. Documentación API

Con el backend corriendo, abre:
- Swagger UI: http://localhost:3001/api-docs
- JSON spec: http://localhost:3001/api-docs.json

## 🌐 Deploy a Firebase

```bash
# Build de producción
cd frontend
npm run build

# Deploy a Firebase Hosting
firebase deploy
```

URL pública: https://luxe-c582e.web.app

## 🔧 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, Vite 8, React Router |
| Backend | Express 5, Node.js |
| Base de datos | Cloud Firestore |
| Autenticación | Firebase Auth |
| Imágenes | Cloudinary |
| Pagos | Stripe, Mercado Pago (simulado) |
| Hosting | Firebase Hosting |
| API Docs | Swagger UI |
