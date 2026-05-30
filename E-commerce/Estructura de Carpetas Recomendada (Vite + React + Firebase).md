Arquitectura basada en características y componentes (Feature-Based + Component-Based)
Para un e-commerce con las características que mencionas (Catálogo, Carrito de compras, Autenticación y Escaneo de QR), la mejor estructura es una que separe claramente la **lógica de Firebase**, las **pantallas completas (Pages)** y los **bloques de construcción (Components)**. 

Esta estructura te ayudará a mantener el orden a medida que avanzas paso a paso.

---

## 📂 Estructura del Proyecto (`/src`)

```text
src/
│
├── assets/                 # Recursos estáticos (Logos, imágenes de marca, etc.)
│
├── components/             # Bloques visuales reutilizables (no tienen rutas propias)
│   ├── Navbar.jsx          # Menú de navegación (el que acabamos de diseñar)
│   ├── Navbar.css
│   ├── ProductCard.jsx     # Tarjeta individual para mostrar un producto en el catálogo
│   ├── TrackingProgressBar.jsx # Barra de progreso que se mueve según el estado del pedido
│   └── ScannerModal.jsx    # Ventana emergente que abre la cámara para escanear el QR
│
├── firebase/               # Configuración y funciones de base de datos
│   ├── config.js           # Inicialización de Firebase (Auth, Firestore)
│   └── database.js         # Funciones listas para usar (ej: obtenerProductos, actualizarEstadoPedido)
│
├── context/                # Estado global (para compartir datos entre páginas sin complicarte)
│   ├── CartContext.jsx     # Guarda el carrito, suma totales y resta el stock
│   └── AuthContext.jsx     # Guarda si el usuario actual es Cliente, Operario o Admin
│
├── pages/                  # Las pantallas completas del sitio web
│   ├── Home.jsx            # Catálogo con filtros (Ropa, Belleza, Temporada)
│   ├── Cart.jsx            # Pantalla del carrito para revisar compra y pagar
│   ├── Tracking.jsx        # Pantalla del cliente para ver el progreso de su pedido
│   ├── Login.jsx           # Pantalla para iniciar sesión
│   │
│   └── admin/              # Pantallas exclusivas para el personal (Admin y Operarios)
│       ├── Dashboard.jsx   # Control de inventario y lista de todos los pedidos
│       └── Scanner.jsx     # Pantalla del operario para escanear y actualizar estados
│
├── App.jsx                 # Componente principal que define las rutas
├── App.css                 # Estilos globales
└── main.jsx                # Punto de entrada de React
```

---

## 🛠️ ¿Cómo se conecta esto con tu Guía Paso a Paso?

A continuación te explico qué carpetas y archivos intervendrán en cada uno de tus 3 pasos de aprendizaje:

### 📦 Paso 1: Catálogo de Productos y Filtros
*   **¿Dónde trabajas?**
    *   `src/pages/Home.jsx`: Aquí haces el diseño principal del catálogo.
    *   `src/components/ProductCard.jsx`: Diseñas cómo se ve una prenda (imagen, nombre, precio, botón).
    *   `src/firebase/database.js`: Creas la consulta a Firestore para traer los productos y filtrarlos por categoría o temporada.
*   **Logro:** Mostrar tu suéter de lana en pantalla y que al hacer clic en "Invierno" solo se vean cosas de frío.

### 🛒 Paso 2: Carrito de Compras y Resta de Stock
*   **¿Dónde trabajas?**
    *   `src/context/CartContext.jsx`: Aquí creas las funciones `agregarAlCarrito`, `eliminarDelCarrito` y `limpiarCarrito`.
    *   `src/pages/Cart.jsx`: La pantalla donde se lista lo que el usuario va a comprar.
    *   `src/firebase/database.js`: Creas la función `crearPedido` que guarda el pedido con estado `"BODEGA_ORIGEN"`, resta el stock de los productos comprados en Firestore, y devuelve el ID del pedido para generar el QR.
*   **Logro:** Comprar productos, ver que el stock se reduce automáticamente y que se crea un pedido en Firestore.

### 📷 Paso 3: Escaneo QR y Tracking en Tiempo Real
*   **¿Dónde trabajas?**
    *   `src/pages/admin/Scanner.jsx` y `src/components/ScannerModal.jsx`: Usas la librería `html5-qrcode` para encender la cámara, capturar el ID del pedido e invocar la actualización.
    *   `src/pages/Tracking.jsx` and `src/components/TrackingProgressBar.jsx`: La pantalla del cliente que se conecta a Firestore en **tiempo real** (usando `onSnapshot`).
*   **Logro:** Escanear el QR con tu móvil, ver que el estado en Firestore cambia a `"BODEGA_1"`, `"EN_RUTA"`, o `"ENTREGADO"`, y presenciar cómo la barra de progreso del cliente se actualiza sola al instante.
