const BACKEND_URL = "http://localhost:3001";

async function getProducts() {
  const response = await fetch(`${BACKEND_URL}/api/products`);
  return await response.json();
}

async function createOrder(orderData) {
  const response = await fetch(`${BACKEND_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData)
  });
  const status = response.status;
  const data = await response.json();
  return { status, data };
}

async function runTests() {
  console.log("=== INICIANDO PRUEBAS DE TRANSACCIONES Y STOCK ===");

  // 1. Obtener estado inicial
  const productsInit = await getProducts();
  const bomber = productsInit.find(p => p.id === "BxpJRCQrXXinAKQtz1iT");
  const falda = productsInit.find(p => p.id === "hQ9Vx3ZLqeelzekr4Dki");

  console.log(`Stock inicial Bomber: ${bomber ? bomber.stock : "No encontrado"}`);
  console.log(`Stock inicial Falda: ${falda ? falda.stock : "No encontrado"}`);

  if (!bomber || !falda) {
    console.error("❌ Error: No se encontraron los productos de prueba.");
    return;
  }

  // 2. Probar creación de orden exitosa (debe restar stock)
  console.log("\n--- Prueba 1: Crear orden válida (resta stock) ---");
  const validOrder = {
    userId: "test-user-123",
    items: [
      { productId: bomber.id, name: bomber.name, price: bomber.price, quantity: 2 },
      { productId: falda.id, name: falda.name, price: falda.price, quantity: 3 }
    ],
    total: bomber.price * 2 + falda.price * 3,
    shippingAddress: {
      phone: "5551234567",
      address: {
        street: "Av. Reforma",
        number: "100",
        neighborhood: "Centro",
        city: "CDMX",
        state: "CDMX",
        zipCode: "06000"
      }
    }
  };

  const res1 = await createOrder(validOrder);
  console.log(`Status recibido: ${res1.status}`);
  console.log("Respuesta:", res1.data);

  if (res1.status !== 201) {
    console.error("❌ Falló la creación de la orden válida.");
  } else {
    console.log("✅ Orden creada con éxito.");
  }

  // Verificar que el stock disminuyó
  const productsAfter1 = await getProducts();
  const bomberAfter1 = productsAfter1.find(p => p.id === bomber.id);
  const faldaAfter1 = productsAfter1.find(p => p.id === falda.id);

  console.log(`Nuevo stock Bomber: ${bomberAfter1.stock} (Esperado: ${bomber.stock - 2})`);
  console.log(`Nuevo stock Falda: ${faldaAfter1.stock} (Esperado: ${falda.stock - 3})`);

  if (bomberAfter1.stock === bomber.stock - 2 && faldaAfter1.stock === falda.stock - 3) {
    console.log("✅ El stock se actualizó correctamente y con consistencia.");
  } else {
    console.error("❌ Error en la actualización del stock.");
  }

  // 3. Probar orden con stock insuficiente (debe fallar y hacer rollback)
  console.log("\n--- Prueba 2: Intentar comprar más del stock disponible (debe fallar y hacer rollback) ---");
  const insufficientStockOrder = {
    userId: "test-user-123",
    items: [
      { productId: bomber.id, name: bomber.name, price: bomber.price, quantity: 1 }, // Válido
      { productId: falda.id, name: falda.name, price: falda.price, quantity: 1000 } // Excede el stock
    ],
    total: bomber.price * 1 + falda.price * 1000,
    shippingAddress: validOrder.shippingAddress
  };

  const res2 = await createOrder(insufficientStockOrder);
  console.log(`Status recibido: ${res2.status} (Esperado: 400)`);
  console.log("Respuesta:", res2.data);

  if (res2.status === 400 && res2.data.error && res2.data.error.includes("Stock insuficiente")) {
    console.log("✅ Falló correctamente con error de stock insuficiente.");
  } else {
    console.error("❌ La petición no falló como se esperaba o el mensaje de error es incorrecto.");
  }

  // Verificar que NO cambió el stock (rollback)
  const productsAfter2 = await getProducts();
  const bomberAfter2 = productsAfter2.find(p => p.id === bomber.id);
  const faldaAfter2 = productsAfter2.find(p => p.id === falda.id);

  console.log(`Stock Bomber tras fallo: ${bomberAfter2.stock} (Esperado: ${bomberAfter1.stock})`);
  console.log(`Stock Falda tras fallo: ${faldaAfter2.stock} (Esperado: ${faldaAfter1.stock})`);

  if (bomberAfter2.stock === bomberAfter1.stock && faldaAfter2.stock === faldaAfter1.stock) {
    console.log("✅ Transacción revertida con éxito (Rollback). Ningún producto sufrió cambio de stock.");
  } else {
    console.error("❌ Falló el rollback. El stock de algún producto se modificó.");
  }

  // 4. Probar orden con producto inexistente (debe fallar y hacer rollback)
  console.log("\n--- Prueba 3: Intentar comprar producto inexistente (debe fallar y hacer rollback) ---");
  const nonexistentProductOrder = {
    userId: "test-user-123",
    items: [
      { productId: bomber.id, name: bomber.name, price: bomber.price, quantity: 1 },
      { productId: "id-inexistente-123", name: "Producto Fantasma", price: 100, quantity: 1 }
    ],
    total: bomber.price * 1 + 100,
    shippingAddress: validOrder.shippingAddress
  };

  const res3 = await createOrder(nonexistentProductOrder);
  console.log(`Status recibido: ${res3.status} (Esperado: 400)`);
  console.log("Respuesta:", res3.data);

  if (res3.status === 400 && res3.data.error && res3.data.error.includes("no existe")) {
    console.log("✅ Falló correctamente indicando que el producto no existe.");
  } else {
    console.error("❌ La petición no falló como se esperaba.");
  }

  // Verificar que NO cambió el stock (rollback)
  const productsAfter3 = await getProducts();
  const bomberAfter3 = productsAfter3.find(p => p.id === bomber.id);

  console.log(`Stock Bomber tras fallo 2: ${bomberAfter3.stock} (Esperado: ${bomberAfter2.stock})`);

  if (bomberAfter3.stock === bomberAfter2.stock) {
    console.log("✅ Transacción revertida con éxito (Rollback).");
  } else {
    console.error("❌ Falló el rollback. El stock del producto válido se redujo.");
  }

  console.log("\n=== PRUEBAS CONCLUIDAS CON ÉXITO ===");
}

runTests().catch(console.error);
