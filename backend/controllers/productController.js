import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../models/productModel.js";

/**
 * GET /api/products
 * Devuelve todos los productos del catálogo.
 */
export async function getProducts(req, res) {
  try {
    const products = await getAllProducts();
    res.json(products);
  } catch (error) {
    console.error("❌ Error al obtener productos de Firestore:", error);
    res.status(500).json({ error: "Error al obtener los productos." });
  }
}

/**
 * GET /api/products/:id
 * Devuelve un producto específico por su ID.
 */
export async function getProduct(req, res) {
  const { id } = req.params;

  try {
    const product = await getProductById(id);

    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado." });
    }

    res.json(product);
  } catch (error) {
    console.error(`❌ Error al obtener el producto con ID "${id}":`, error);
    res.status(500).json({ error: "Error al obtener el producto." });
  }
}

/**
 * POST /api/products
 * Crea un nuevo producto tras validar los datos.
 */
export async function addProduct(req, res) {
  const {
    name,
    price,
    department,
    category,
    type,
    size,
    sizes,
    material,
    color,
    stock,
    image,
    description,
    sale,
    salePrice,
  } = req.body;

  const activeDepartment = department || category;

  // ── Validaciones de Entrada (Defensa del Backend) ───────────────────
  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ error: "El nombre del producto es obligatorio y debe ser un texto." });
  }
  if (price === undefined || typeof price !== "number" || price < 0) {
    return res.status(400).json({ error: "El precio es obligatorio y debe ser un número mayor o igual a cero." });
  }
  if (
    !activeDepartment ||
    typeof activeDepartment !== "string" ||
    !["mujer", "hombre", "accesorios"].includes(activeDepartment.toLowerCase())
  ) {
    return res.status(400).json({
      error: "El departamento/categoría es obligatorio y debe ser 'mujer', 'hombre' o 'accesorios'.",
    });
  }
  if (!type || typeof type !== "string" || type.trim() === "") {
    return res.status(400).json({ error: "El tipo de producto es obligatorio y debe ser un texto." });
  }
  // Para mujer/hombre: sizes es un objeto { Grande: N, Mediano: N, Chico: N }
  // Para accesorios: size es un string simple
  const hasSizes = sizes && typeof sizes === "object" && !Array.isArray(sizes);
  if (!hasSizes && (!size || typeof size !== "string" || size.trim() === "")) {
    return res.status(400).json({ error: "La talla es obligatoria y debe ser un texto." });
  }
  if (!material || typeof material !== "string" || material.trim() === "") {
    return res.status(400).json({ error: "El material es obligatorio y debe ser un texto." });
  }
  if (!color || typeof color !== "string" || color.trim() === "") {
    return res.status(400).json({ error: "El color es obligatorio y debe ser un texto." });
  }  // Si hay sizes, calcular stock total; si no, validar stock directo
  let totalStock = 0;
  if (hasSizes) {
    const validSizes = ['Chico', 'Mediano', 'Grande'];
    for (const [sz, qty] of Object.entries(sizes)) {
      if (!validSizes.includes(sz)) {
        return res.status(400).json({ error: `Talla inválida: "${sz}". Las válidas son: ${validSizes.join(', ')}.` });
      }
      if (typeof qty !== 'number' || qty < 0 || !Number.isInteger(qty)) {
        return res.status(400).json({ error: `El stock de la talla "${sz}" debe ser un entero >= 0.` });
      }
      totalStock += qty;
    }
  } else {
    if (
      stock === undefined || typeof stock !== "number" ||
      stock < 0 || !Number.isInteger(stock)
    ) {
      return res.status(400).json({ error: "El stock es obligatorio y debe ser un número entero mayor o igual a cero." });
    }
    totalStock = Number(stock);
  }
  if (!image || typeof image !== "string" || image.trim() === "") {
    return res.status(400).json({ error: "La imagen es obligatoria y debe ser una URL de imagen válida." });
  }
  if (sale !== undefined && typeof sale !== "boolean") {
    return res.status(400).json({ error: "El campo de rebaja (sale) debe ser un booleano." });
  }
  if (sale && (salePrice === undefined || typeof salePrice !== "number" || salePrice < 0)) {
    return res.status(400).json({
      error: "El precio de rebaja (salePrice) es obligatorio y debe ser mayor o igual a cero si el producto está en rebaja.",
    });
  }

  try {
    const newProduct = {
      name: name.trim(),
      price: Number(price),
      department: activeDepartment.toLowerCase(),
      category: activeDepartment.toLowerCase(),
      type: type.trim(),
      material: material.trim(),
      color: color.trim(),
      stock: totalStock,
      image: image.trim(),
      description: description ? description.trim() : "",
      sale: !!sale,
      salePrice: sale ? Number(salePrice) : null,
    };
    // Para mujer/hombre: guardar sizes; para accesorios: guardar size simple
    if (hasSizes) {
      newProduct.sizes = {};
      for (const [sz, qty] of Object.entries(sizes)) {
        newProduct.sizes[sz] = qty;
      }
    } else {
      newProduct.size = size.trim();
    }

    const productId = await createProduct(newProduct);

    res.status(201).json({
      message: "Producto creado exitosamente.",
      productId,
      product: { id: productId, ...newProduct },
    });
  } catch (error) {
    console.error("❌ Error al crear el producto en Firestore:", error);
    res.status(500).json({ error: "Error interno del servidor al crear el producto." });
  }
}

/**
 * PATCH /api/products/:id
 * Actualiza parcialmente un producto existente.
 */
export async function editProduct(req, res) {
  const { id } = req.params;
  const body = req.body;

  try {
    // Verificar si el producto existe antes de validar cambios dependientes del estado actual
    const existingProduct = await getProductById(id);
    if (!existingProduct) {
      return res.status(404).json({ error: "Producto no encontrado." });
    }

    const updates = {};

    // Validaciones campo por campo si están presentes en la petición
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim() === "") {
        return res.status(400).json({ error: "El nombre no puede ser un texto vacío." });
      }
      updates.name = body.name.trim();
    }

    if (body.price !== undefined) {
      if (typeof body.price !== "number" || body.price < 0) {
        return res.status(400).json({ error: "El precio debe ser un número mayor o igual a cero." });
      }
      updates.price = Number(body.price);
    }

    if (body.department !== undefined || body.category !== undefined) {
      const dept = body.department || body.category;
      if (typeof dept !== "string" || !["mujer", "hombre", "accesorios"].includes(dept.toLowerCase())) {
        return res.status(400).json({ error: "El departamento debe ser 'mujer', 'hombre' o 'accesorios'." });
      }
      updates.department = dept.toLowerCase();
      updates.category = dept.toLowerCase();
    }

    if (body.type !== undefined) {
      if (typeof body.type !== "string" || body.type.trim() === "") {
        return res.status(400).json({ error: "El tipo de producto no puede ser vacío." });
      }
      updates.type = body.type.trim();
    }

    if (body.size !== undefined) {
      if (typeof body.size !== "string" || body.size.trim() === "") {
        return res.status(400).json({ error: "La talla no puede ser vacía." });
      }
      updates.size = body.size.trim();
    }

    if (body.sizes !== undefined) {
      if (typeof body.sizes !== "object" || Array.isArray(body.sizes)) {
        return res.status(400).json({ error: "sizes debe ser un objeto con stock por talla." });
      }
      const validSizes = ['Chico', 'Mediano', 'Grande'];
      let totalStock = 0;
      for (const [sz, qty] of Object.entries(body.sizes)) {
        if (!validSizes.includes(sz)) {
          return res.status(400).json({ error: `Talla inválida: "${sz}".` });
        }
        if (typeof qty !== 'number' || qty < 0 || !Number.isInteger(qty)) {
          return res.status(400).json({ error: `Stock de "${sz}" debe ser entero >= 0.` });
        }
        totalStock += qty;
      }
      updates.sizes = body.sizes;
      updates.stock = totalStock;
    }

    if (body.material !== undefined) {
      if (typeof body.material !== "string" || body.material.trim() === "") {
        return res.status(400).json({ error: "El material no puede ser vacío." });
      }
      updates.material = body.material.trim();
    }

    if (body.color !== undefined) {
      if (typeof body.color !== "string" || body.color.trim() === "") {
        return res.status(400).json({ error: "El color no puede ser vacío." });
      }
      updates.color = body.color.trim();
    }

    if (body.stock !== undefined && body.sizes === undefined) {
      if (typeof body.stock !== "number" || body.stock < 0 || !Number.isInteger(body.stock)) {
        return res.status(400).json({ error: "El stock debe ser un número entero mayor o igual a cero." });
      }
      updates.stock = Number(body.stock);
    }

    if (body.image !== undefined) {
      if (typeof body.image !== "string" || body.image.trim() === "") {
        return res.status(400).json({ error: "La imagen no puede ser una referencia vacía." });
      }
      updates.image = body.image.trim();
    }

    if (body.description !== undefined) {
      updates.description = typeof body.description === "string" ? body.description.trim() : "";
    }

    if (body.sale !== undefined) {
      if (typeof body.sale !== "boolean") {
        return res.status(400).json({ error: "El campo sale debe ser un booleano." });
      }
      updates.sale = body.sale;
    }

    // Validación cruzada de la rebaja
    const finalSale = updates.sale !== undefined ? updates.sale : existingProduct.sale;
    if (finalSale) {
      const finalSalePrice = body.salePrice !== undefined ? body.salePrice : existingProduct.salePrice;
      if (finalSalePrice === undefined || finalSalePrice === null || typeof finalSalePrice !== "number" || finalSalePrice < 0) {
        return res.status(400).json({
          error: "El precio de rebaja (salePrice) es obligatorio y debe ser mayor o igual a cero si el producto está en rebaja.",
        });
      }
      updates.salePrice = Number(finalSalePrice);
    } else {
      updates.salePrice = null;
    }

    // Si no se pasaron campos válidos para actualizar, retornar error
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No se proporcionaron campos válidos para actualizar." });
    }

    await updateProduct(id, updates);

    res.json({
      message: "Producto actualizado exitosamente.",
      product: { id, ...existingProduct, ...updates },
    });
  } catch (error) {
    console.error(`❌ Error al actualizar el producto con ID "${id}":`, error);
    res.status(500).json({ error: "Error interno del servidor al actualizar el producto." });
  }
}

/**
 * DELETE /api/products/:id
 * Elimina un producto.
 */
export async function removeProduct(req, res) {
  const { id } = req.params;

  try {
    const success = await deleteProduct(id);

    if (!success) {
      return res.status(404).json({ error: "Producto no encontrado." });
    }

    res.json({ message: "Producto eliminado exitosamente." });
  } catch (error) {
    console.error(`❌ Error al eliminar el producto con ID "${id}":`, error);
    res.status(500).json({ error: "Error interno del servidor al eliminar el producto." });
  }
}

