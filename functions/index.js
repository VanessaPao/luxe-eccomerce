const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Inicializar la app de Firebase Admin
admin.initializeApp();

// Obtener referencia a Firestore
const db = admin.firestore();

// Inicializar Stripe con la clave secreta del .env
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/**
 * 1. Crear sesión de Stripe Checkout
 */
exports.createCheckoutSession = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "El usuario debe estar autenticado.");
  }

  const { items, userId, shippingAddress } = request.data;

  if (!items || items.length === 0) {
    throw new HttpsError("invalid-argument", "El carrito está vacío.");
  }

  try {
    // Construir los line_items en el formato que espera Stripe (precio en centavos)
    const lineItems = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity || 1,
    }));

    // Crear la sesión de pago en Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: "http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "http://localhost:5173/cancel",
      metadata: { userId },
    });

    // Guardar pedido temporal en Firestore (indexado por session.id de Stripe)
    // Usamos new Date() — Firestore lo convierte automáticamente a Timestamp
    await db.collection("pending_orders").doc(session.id).set({
      userId,
      items,
      total: items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0),
      shippingAddress,
      createdAt: new Date(),
    });

    return { url: session.url, id: session.id };

  } catch (error) {
    console.error("Error createCheckoutSession:", error.message);
    throw new HttpsError("internal", error.message);
  }
});

/**
 * 2. Verificar pago de Stripe y crear la orden oficial en Firestore
 */
exports.verifyStripePayment = onCall(async (request) => {
  const { sessionId } = request.data;

  if (!sessionId) {
    throw new HttpsError("invalid-argument", "Se requiere el ID de sesión de Stripe.");
  }

  try {
    // Verificar si la orden ya fue creada (evitar duplicados)
    const existingQuery = await db
      .collection("orders")
      .where("stripeSessionId", "==", sessionId)
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      return {
        success: true,
        orderId: existingQuery.docs[0].id,
        message: "La orden ya había sido procesada.",
      };
    }

    // Consultar el estado real del pago en Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      // Recuperar datos del pedido temporal
      const pendingDoc = await db.collection("pending_orders").doc(sessionId).get();

      if (!pendingDoc.exists) {
        throw new HttpsError("not-found", "No se encontró el pedido temporal.");
      }

      const pendingData = pendingDoc.data();

      // Crear la orden oficial con status 'paid'
      const orderRef = await db.collection("orders").add({
        userId: pendingData.userId,
        items: pendingData.items,
        total: pendingData.total,
        paymentMethod: "stripe",
        paymentStatus: "paid",
        shippingAddress: pendingData.shippingAddress,
        stripeSessionId: sessionId,
        createdAt: new Date(),
      });

      // ─────────────────────────────────────────────────────────────────
      // ACTUALIZAR STOCK — una transacción por producto comprado.
      //
      // ¿Qué es una transacción de Firestore?
      // Es una operación que lee y escribe un documento de forma ATÓMICA.
      // Si dos personas compran el mismo producto al mismo tiempo, Firestore
      // garantiza que solo una podrá completarse exitosamente. La otra verá
      // el stock ya actualizado y fallará si no hay suficiente. Esto evita
      // vender más unidades de las disponibles ("condición de carrera").
      // ─────────────────────────────────────────────────────────────────
      const stockUpdates = pendingData.items.map((item) => {
        // Referencia al documento del producto en la colección 'products'
        const productRef = db.collection("products").doc(String(item.productId));

        return db.runTransaction(async (tx) => {
          // 1. Leer el documento del producto DENTRO de la transacción.
          //    Firestore bloquea este documento hasta que la transacción termine.
          const productSnap = await tx.get(productRef);

          // 2. Validar que el producto existe en la base de datos.
          if (!productSnap.exists) {
            throw new Error(`Producto "${item.name}" (ID: ${item.productId}) no encontrado en el catálogo.`);
          }

          // 3. Obtener el stock actual. Si el campo no existe, se asume 0.
          const currentStock = productSnap.data().stock ?? 0;
          const quantityBought = item.quantity || 1;

          // 4. Validar que hay suficiente stock. Nunca permitir stock negativo.
          if (currentStock < quantityBought) {
            throw new Error(
              `Stock insuficiente para "${item.name}". ` +
              `Disponible: ${currentStock}, solicitado: ${quantityBought}.`
            );
          }

          // 5. Escribir el nuevo valor de stock de forma atómica.
          //    Solo se ejecuta si todas las validaciones anteriores pasaron.
          tx.update(productRef, { stock: currentStock - quantityBought });
        });
      });

      // Ejecutar todas las actualizaciones de stock en paralelo.
      // Si CUALQUIERA falla (ej. stock insuficiente), Promise.all lanza un error.
      await Promise.all(stockUpdates);

      // Limpiar el pedido temporal (solo se llega aquí si el stock fue suficiente)
      await db.collection("pending_orders").doc(sessionId).delete();

      return { success: true, orderId: orderRef.id };

    } else {
      return { success: false, message: "El pago no ha sido completado." };
    }

  } catch (error) {
    console.error("Error verifyStripePayment:", error.message);
    throw new HttpsError("internal", error.message);
  }
});

/**
 * 3. Simulación de Mercado Pago — crea la orden directamente
 */
exports.simulateMercadoPagoOrder = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "El usuario debe estar autenticado.");
  }

  const { items, total, userId, shippingAddress } = request.data;

  try {
    const orderRef = await db.collection("orders").add({
      userId,
      items,
      total,
      paymentMethod: "mercadopago",
      paymentStatus: "paid",
      shippingAddress,
      createdAt: new Date(),
    });

    return { success: true, orderId: orderRef.id };

  } catch (error) {
    console.error("Error simulateMercadoPagoOrder:", error.message);
    throw new HttpsError("internal", error.message);
  }
});
