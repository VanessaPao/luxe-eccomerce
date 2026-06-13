import Stripe from "stripe";
import { db } from "../firebase/admin.js"; // Importamos Firestore (Admin SDK)
import { FieldValue } from "firebase-admin/firestore";

// Inicializamos Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (req, res) => {
  try {
    // Recibimos también el userId y shippingAddress
    const { items, userId, shippingAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "El carrito está vacío." });
    }

    // Transformamos los items del carrito al formato que Stripe espera (line_items).
    // Stripe requiere saber el nombre del producto, la moneda, el precio unitario en centavos y la cantidad.
    const lineItems = items.map((item) => ({
      price_data: {
        currency: "mxn",
        product_data: {
          name: item.name,
        },
        // Stripe procesa los precios en centavos (ej: 100 pesos = 10000 centavos)
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    // Creamos la sesión de Checkout en Stripe. Esto genera una página de pago temporal
    // alojada por Stripe con los productos especificados.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"], // Métodos de pago aceptados
      line_items: lineItems, // Los productos a cobrar
      mode: "payment", // Indica que es un pago único, no una suscripción
      // URLs a las que Stripe redirigirá al usuario después del pago (éxito o cancelación).
      // Incluimos {CHECKOUT_SESSION_ID} en la URL de éxito. Stripe lo reemplazará 
      // automáticamente por el ID real de la sesión antes de redirigir al usuario.
      // Así nuestro frontend en PaymentSuccess.jsx podrá leer el session_id de la URL.
      success_url: "http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "http://localhost:5173/carrito", // Asumiendo que el frontend usa /carrito en español
    });

    // Guardar pedido temporal en Firestore (indexado por session.id de Stripe)
    await db.collection("pending_orders").doc(session.id).set({
      userId: userId || "guest", // Prevenimos fallos si un usuario no está logueado por error
      items,
      total: items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0),
      shippingAddress: shippingAddress || {},
      createdAt: new Date(),
    });

    // Devolvemos la URL generada por Stripe al frontend para que pueda redirigir al usuario.
    res.status(200).json({ url: session.url, id: session.id });
  } catch (error) {
    console.error("Error al crear sesión de Stripe:", error);
    res.status(500).json({ error: "No se pudo crear la sesión de pago." });
  }
};

export const verifyStripePayment = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Se requiere el ID de sesión de Stripe." });
    }

    // 1. Verificar si la orden ya fue creada (evitar duplicados si el usuario recarga la página)
    const existingQuery = await db
      .collection("orders")
      .where("stripeSessionId", "==", sessionId)
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      return res.status(200).json({
        success: true,
        orderId: existingQuery.docs[0].id,
        message: "La orden ya había sido procesada.",
      });
    }

    // 2. Consultar el estado real del pago en Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      // 3. Todo el proceso (lectura, creación de orden, stock y borrado) en UNA SOLA transacción.
      // Esto previene errores de "carrera" (race conditions) si React ejecuta fetch dos veces rápido.
      const pendingRef = db.collection("pending_orders").doc(sessionId);

      try {
        const orderId = await db.runTransaction(async (tx) => {
          // A. Leer el pedido temporal
          const pendingSnap = await tx.get(pendingRef);
          if (!pendingSnap.exists) {
            throw new Error("ALREADY_PROCESSED");
          }
          const pendingData = pendingSnap.data();

          // B. Leer todos los productos a descontar (deben leerse ANTES de cualquier escritura)
          const productRefs = pendingData.items.map(item => 
            db.collection("products").doc(String(item.productId || item.id))
          );
          const productSnaps = await tx.getAll(...productRefs);

          // C. Validar disponibilidad de stock
          productSnaps.forEach((snap, index) => {
            const item = pendingData.items[index];
            if (!snap.exists) {
              throw new Error(`Producto "${item.name}" no encontrado en el catálogo.`);
            }
            const currentStock = snap.data().stock ?? 0;
            const quantityBought = item.quantity || 1;
            if (currentStock < quantityBought) {
              throw new Error(`Stock insuficiente para "${item.name}". Disponible: ${currentStock}, solicitado: ${quantityBought}.`);
            }
          });

          // D. Ejecutar escrituras (Crear orden, actualizar stock, borrar pedido temporal)
          const newOrderRef = db.collection("orders").doc();
          tx.set(newOrderRef, {
            userId: pendingData.userId,
            items: pendingData.items,
            total: pendingData.total,
            paymentMethod: "stripe",
            paymentStatus: "paid",
            shippingAddress: pendingData.shippingAddress,
            stripeSessionId: sessionId,
            createdAt: new Date(),
          });

          productSnaps.forEach((snap, index) => {
            const quantityBought = pendingData.items[index].quantity || 1;
            tx.update(productRefs[index], { stock: FieldValue.increment(-quantityBought) });
          });

          tx.delete(pendingRef);

          return newOrderRef.id;
        });

        return res.status(200).json({ success: true, orderId });

      } catch (err) {
        if (err.message === "ALREADY_PROCESSED") {
          // Si el pedido ya no existe, otra ejecución paralela ya lo procesó exitosamente
          const existing = await db.collection("orders").where("stripeSessionId", "==", sessionId).limit(1).get();
          if (!existing.empty) {
            return res.status(200).json({
              success: true,
              orderId: existing.docs[0].id,
              message: "La orden ya había sido procesada exitosamente."
            });
          }
          return res.status(404).json({ error: "No se encontró el pedido temporal." });
        }
        throw err; // Si es un error de stock o conexión, lo lanzamos al catch general
      }
    } else {
      return res.status(400).json({ success: false, error: "El pago no ha sido completado en Stripe." });
    }

  } catch (error) {
    console.error("Error al verificar pago de Stripe:", error);
    res.status(500).json({ error: error.message || "Error interno al verificar pago." });
  }
};

export const simulateMercadoPagoOrder = async (req, res) => {
  try {
    const { items, total, userId, shippingAddress } = req.body;

    if (!items || !userId) {
      return res.status(400).json({ error: "Faltan datos requeridos." });
    }

    // 1. Prevención de doble-click (Condición de Carrera en Mercado Pago)
    // Revisamos si el usuario ya creó una orden exactamente con este mismo total
    // en los últimos 15 segundos. Si es así, devolvemos la misma orden.
    const fifteenSecondsAgo = new Date(Date.now() - 15000);
    const recentOrders = await db.collection("orders")
      .where("userId", "==", userId)
      .where("total", "==", total)
      .where("paymentMethod", "==", "mercadopago")
      .where("createdAt", ">=", fifteenSecondsAgo)
      .get();

    if (!recentOrders.empty) {
      // Ya se creó una orden idéntica hace instantes, prevenimos procesarla doble.
      return res.status(200).json({ success: true, orderId: recentOrders.docs[0].id });
    }

    // 2. Transacción gigante para Mercado Pago (igual que Stripe)
    // Para evitar cualquier error, creamos la orden y descontamos stock atómicamente.
    const orderId = await db.runTransaction(async (tx) => {
      // A. Leer todos los productos a descontar primero
      const productRefs = items.map(item => 
        db.collection("products").doc(String(item.productId || item.id))
      );
      const productSnaps = await tx.getAll(...productRefs);

      // B. Validar disponibilidad
      productSnaps.forEach((snap, index) => {
        const item = items[index];
        if (!snap.exists) {
          throw new Error(`Producto "${item.name}" no encontrado en el catálogo.`);
        }
        const currentStock = snap.data().stock ?? 0;
        const quantityBought = item.quantity || 1;
        if (currentStock < quantityBought) {
          throw new Error(`Stock insuficiente para "${item.name}". Disponible: ${currentStock}, solicitado: ${quantityBought}.`);
        }
      });

      // C. Crear la orden oficial
      const newOrderRef = db.collection("orders").doc();
      tx.set(newOrderRef, {
        userId,
        items,
        total,
        paymentMethod: "mercadopago",
        paymentStatus: "paid",
        shippingAddress: shippingAddress || {},
        createdAt: new Date(),
      });

      // D. Actualizar stock
      productSnaps.forEach((snap, index) => {
        const quantityBought = items[index].quantity || 1;
        tx.update(productRefs[index], { stock: FieldValue.increment(-quantityBought) });
      });

      return newOrderRef.id;
    });

    return res.status(200).json({ success: true, orderId });
  } catch (error) {
    console.error("Error al simular orden Mercado Pago:", error);
    res.status(500).json({ error: "Error al crear la orden." });
  }
};
