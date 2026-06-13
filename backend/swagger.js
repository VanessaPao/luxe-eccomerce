import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "LUXE API — E-commerce de Moda Premium",
      version: "1.0.0",
      description: `API del servidor Express de LUXE. Proporciona endpoints para consultar productos y gestionar órdenes.

## Cloud Functions (Firebase)

Además de esta API Express, el proyecto usa **Cloud Functions para pagos**:

| Función | Descripción |
|---|---|
| \`createCheckoutSession\` | Crea una sesión de pago en Stripe y guarda pedido temporal |
| \`verifyStripePayment\` | Verifica el pago con Stripe y crea la orden oficial |
| \`simulateMercadoPagoOrder\` | Crea una orden simulada como pago con Mercado Pago |

> Estas funciones se invocan desde el frontend con \`httpsCallable\` y **no** son rutas HTTP públicas.`,
      contact: {
        name: "LUXE",
      },
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Servidor de desarrollo",
      },
    ],
    tags: [
      { name: "General", description: "Endpoints generales del servidor" },
      { name: "Productos", description: "Gestión de productos del catálogo" },
      { name: "Órdenes", description: "Creación de órdenes de compra" },
      { name: "Checkout", description: "Integración con pasarelas de pago" },
      { name: "Chatbot", description: "Asistente de Inteligencia Artificial" },
      { name: "Soporte", description: "Panel de Tickets y Soporte Técnico" },
    ],
    components: {
      schemas: {
        Ticket: {
          type: "object",
          properties: {
            id: { type: "string", description: "ID del ticket en Firestore" },
            userId: { type: "string", description: "UID del cliente" },
            userName: { type: "string", description: "Nombre del cliente" },
            userEmail: { type: "string", description: "Email del cliente" },
            subject: { type: "string", description: "Asunto del ticket" },
            status: { type: "string", enum: ["open", "in_progress", "resolved", "closed"] },
            messages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sender: { type: "string", enum: ["user", "support"] },
                  senderName: { type: "string" },
                  text: { type: "string" },
                  timestamp: { type: "string", format: "date-time" },
                }
              }
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          }
        },
        Product: {
          type: "object",
          properties: {
            id: { type: "string", description: "ID del documento en Firestore" },
            name: { type: "string", description: "Nombre del producto" },
            price: { type: "number", description: "Precio del producto" },
            department: { type: "string", enum: ["mujer", "hombre", "accesorios"] },
            category: { type: "string", description: "Categoría del producto" },
            type: { type: "string", description: "Tipo (ej. Vestidos, Camisas)" },
            size: { type: "string", description: "Talla" },
            material: { type: "string", description: "Material del producto" },
            color: { type: "string", description: "Color del producto" },
            stock: { type: "integer", description: "Cantidad disponible" },
            image: { type: "string", format: "uri", description: "URL de Cloudinary" },
            description: { type: "string", description: "Descripción del producto" },
            sale: { type: "boolean", description: "Indica si está en oferta" },
            salePrice: { type: "number", description: "Precio rebajado (si sale=true)" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Order: {
          type: "object",
          properties: {
            id: { type: "string", description: "ID de la orden en Firestore" },
            userId: { type: "string", description: "ID del usuario que realizó la compra" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  productId: { type: "string" },
                  name: { type: "string" },
                  price: { type: "number" },
                  quantity: { type: "integer" },
                  image: { type: "string" },
                },
              },
            },
            total: { type: "number", description: "Monto total de la orden" },
            shippingAddress: {
              type: "object",
              properties: {
                phone: { type: "string" },
                address: {
                  type: "object",
                  properties: {
                    street: { type: "string" },
                    number: { type: "string" },
                    neighborhood: { type: "string" },
                    city: { type: "string" },
                    state: { type: "string" },
                    zipCode: { type: "string" },
                  },
                },
              },
            },
            status: { type: "string", description: "Estado de la orden (ej. pending)" },
            paymentMethod: { type: "string", description: "Método de pago (stripe, mercadopago)" },
            paymentStatus: { type: "string", description: "Estado del pago" },
            stripeSessionId: { type: "string", description: "ID de sesión de Stripe (si aplica)" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
      },
    },
  },
  apis: ["./routes/*.js", "./server.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
