"use server";

import { db } from "@/lib/db";
import { hashPassword, verifyPassword, loginUser, logoutUser, getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// --- Auth Actions ---

export async function registerAction(prevState, formData) {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();
  const name = formData.get("name")?.toString().trim();
  const orgName = formData.get("orgName")?.toString().trim();

  if (!email || !password || !name || !orgName) {
    return { error: "All fields are required." };
  }

  try {
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return { error: "Email is already registered." };
    }

    const { hash, salt } = hashPassword(password);

    const newUser = await db.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: orgName },
      });
      return tx.user.create({
        data: {
          email,
          passwordHash: hash,
          salt,
          name,
          organizationId: org.id,
        },
        include: { organization: true },
      });
    });

    await loginUser({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      organizationId: newUser.organizationId,
      organizationName: newUser.organization.name,
    });

    return { success: true };
  } catch (err) {
    console.error("Register error:", err);
    return { error: "Something went wrong during registration." };
  }
}

export async function loginAction(prevState, formData) {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    const user = await db.user.findUnique({
      where: { email },
      include: { organization: true },
    });

    if (!user) {
      return { error: "Invalid email or password." };
    }

    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return { error: "Invalid email or password." };
    }

    await loginUser({
      userId: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
      organizationName: user.organization.name,
    });

    return { success: true };
  } catch (err) {
    console.error("Login error:", err);
    return { error: "Something went wrong during login." };
  }
}

export async function logoutAction() {
  await logoutUser();
  return { success: true };
}

// --- Product CRUD Actions ---

export async function createProductAction(prevState, formData) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized." };

  const name = formData.get("name")?.toString().trim();
  const sku = formData.get("sku")?.toString().trim().toUpperCase();
  const description = formData.get("description")?.toString().trim() || null;
  const quantityOnHandStr = formData.get("quantityOnHand")?.toString() || "0";
  const costPriceStr = formData.get("costPrice")?.toString() || "";
  const sellingPriceStr = formData.get("sellingPrice")?.toString() || "";
  const lowStockThresholdStr = formData.get("lowStockThreshold")?.toString() || "";

  if (!name || !sku) {
    return { error: "Name and SKU are required fields." };
  }

  const quantityOnHand = parseInt(quantityOnHandStr, 10);
  if (isNaN(quantityOnHand) || quantityOnHand < 0) {
    return { error: "Quantity on hand must be a positive integer." };
  }

  const costPrice = costPriceStr ? parseFloat(costPriceStr) : null;
  if (costPrice !== null && (isNaN(costPrice) || costPrice < 0)) {
    return { error: "Cost price must be a positive number." };
  }

  const sellingPrice = sellingPriceStr ? parseFloat(sellingPriceStr) : null;
  if (sellingPrice !== null && (isNaN(sellingPrice) || sellingPrice < 0)) {
    return { error: "Selling price must be a positive number." };
  }

  const lowStockThreshold = lowStockThresholdStr ? parseInt(lowStockThresholdStr, 10) : null;
  if (lowStockThreshold !== null && (isNaN(lowStockThreshold) || lowStockThreshold < 0)) {
    return { error: "Low stock threshold must be a positive integer." };
  }

  try {
    const existing = await db.product.findUnique({
      where: {
        organizationId_sku: {
          organizationId: session.organizationId,
          sku,
        },
      },
    });

    if (existing) {
      return { error: `SKU '${sku}' already exists in your organization.` };
    }

    await db.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          organizationId: session.organizationId,
          name,
          sku,
          description,
          quantityOnHand,
          costPrice,
          sellingPrice,
          lowStockThreshold,
          lastUpdatedBy: session.name,
        },
      });

      if (quantityOnHand > 0) {
        await tx.stockAdjustmentLog.create({
          data: {
            productId: product.id,
            quantityChange: quantityOnHand,
            note: "Initial stock load",
            userId: session.userId,
          },
        });
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/products");
    return { success: true };
  } catch (err) {
    console.error("Create product error:", err);
    return { error: "Failed to create product." };
  }
}

export async function updateProductAction(productId, formData) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized." };

  const name = formData.get("name")?.toString().trim();
  const sku = formData.get("sku")?.toString().trim().toUpperCase();
  const description = formData.get("description")?.toString().trim() || null;
  const quantityOnHandStr = formData.get("quantityOnHand")?.toString();
  const costPriceStr = formData.get("costPrice")?.toString() || "";
  const sellingPriceStr = formData.get("sellingPrice")?.toString() || "";
  const lowStockThresholdStr = formData.get("lowStockThreshold")?.toString() || "";

  if (!name || !sku) {
    return { error: "Name and SKU are required fields." };
  }

  const costPrice = costPriceStr ? parseFloat(costPriceStr) : null;
  if (costPrice !== null && (isNaN(costPrice) || costPrice < 0)) {
    return { error: "Cost price must be a positive number." };
  }

  const sellingPrice = sellingPriceStr ? parseFloat(sellingPriceStr) : null;
  if (sellingPrice !== null && (isNaN(sellingPrice) || sellingPrice < 0)) {
    return { error: "Selling price must be a positive number." };
  }

  const lowStockThreshold = lowStockThresholdStr ? parseInt(lowStockThresholdStr, 10) : null;
  if (lowStockThreshold !== null && (isNaN(lowStockThreshold) || lowStockThreshold < 0)) {
    return { error: "Low stock threshold must be a positive integer." };
  }

  try {
    const product = await db.product.findFirst({
      where: {
        id: productId,
        organizationId: session.organizationId,
      },
    });

    if (!product) {
      return { error: "Product not found." };
    }

    // Check SKU conflict
    if (product.sku !== sku) {
      const conflict = await db.product.findUnique({
        where: {
          organizationId_sku: {
            organizationId: session.organizationId,
            sku,
          },
        },
      });
      if (conflict) {
        return { error: `SKU '${sku}' is already in use by another product.` };
      }
    }

    await db.$transaction(async (tx) => {
      const updateData = {
        name,
        sku,
        description,
        costPrice,
        sellingPrice,
        lowStockThreshold,
        lastUpdatedBy: session.name,
      };

      // If quantity is provided and differs
      if (quantityOnHandStr !== undefined) {
        const newQty = parseInt(quantityOnHandStr, 10);
        if (!isNaN(newQty) && newQty >= 0 && newQty !== product.quantityOnHand) {
          updateData.quantityOnHand = newQty;
          const diff = newQty - product.quantityOnHand;

          await tx.stockAdjustmentLog.create({
            data: {
              productId,
              quantityChange: diff,
              note: `Direct quantity edit (from ${product.quantityOnHand} to ${newQty})`,
              userId: session.userId,
            },
          });
        }
      }

      await tx.product.update({
        where: { id: productId },
        data: updateData,
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/products");
    return { success: true };
  } catch (err) {
    console.error("Update product error:", err);
    return { error: "Failed to update product." };
  }
}

export async function deleteProductAction(productId) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized." };

  try {
    const product = await db.product.findFirst({
      where: {
        id: productId,
        organizationId: session.organizationId,
      },
    });

    if (!product) {
      return { error: "Product not found." };
    }

    await db.product.delete({
      where: { id: productId },
    });

    revalidatePath("/dashboard");
    revalidatePath("/products");
    return { success: true };
  } catch (err) {
    console.error("Delete product error:", err);
    return { error: "Failed to delete product." };
  }
}

// --- Stock Adjustment ---

export async function adjustStockAction(productId, quantityChange, note) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized." };

  const change = parseInt(quantityChange, 10);
  if (isNaN(change) || change === 0) {
    return { error: "Invalid quantity change." };
  }

  const cleanNote = note?.trim() || "Manual adjustment";

  try {
    const product = await db.product.findFirst({
      where: {
        id: productId,
        organizationId: session.organizationId,
      },
    });

    if (!product) {
      return { error: "Product not found." };
    }

    const newQty = product.quantityOnHand + change;
    if (newQty < 0) {
      return { error: `Insufficient stock. Cannot adjust by ${change} (Current stock: ${product.quantityOnHand}).` };
    }

    await db.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: {
          quantityOnHand: newQty,
          lastUpdatedBy: session.name,
        },
      });

      await tx.stockAdjustmentLog.create({
        data: {
          productId,
          quantityChange: change,
          note: cleanNote,
          userId: session.userId,
        },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/products");
    return { success: true };
  } catch (err) {
    console.error("Adjust stock error:", err);
    return { error: "Failed to adjust stock." };
  }
}

// --- Settings Action ---

export async function updateSettingsAction(defaultThreshold) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized." };

  const threshold = parseInt(defaultThreshold, 10);
  if (isNaN(threshold) || threshold < 0) {
    return { error: "Threshold must be a positive integer." };
  }

  try {
    await db.organization.update({
      where: { id: session.organizationId },
      data: {
        defaultLowStockThreshold: threshold,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/products");
    return { success: true };
  } catch (err) {
    console.error("Update settings error:", err);
    return { error: "Failed to update settings." };
  }
}
