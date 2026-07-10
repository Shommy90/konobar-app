"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth/requireOwner";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { success: true } | { success: false; error: string };

export type CreateCategoryInput = {
  name: string;
  description: string;
  sortOrder: string;
};

export async function createCategory(input: CreateCategoryInput): Promise<ActionResult> {
  const current = await requireOwner();

  const name = input.name.trim();
  if (!name) {
    return { success: false, error: "Category name is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("menu_categories").insert({
    restaurant_id: current.profile.restaurant_id,
    name,
    description: input.description.trim() || null,
    sort_order: input.sortOrder ? Number(input.sortOrder) : 0,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/owner/menu");
  return { success: true };
}

export type UpdateCategoryInput = {
  categoryId: string;
  name: string;
  description: string;
  sortOrder: string;
};

export async function updateCategory(input: UpdateCategoryInput): Promise<ActionResult> {
  const current = await requireOwner();

  const name = input.name.trim();
  if (!name) {
    return { success: false, error: "Category name is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_categories")
    .update({
      name,
      description: input.description.trim() || null,
      sort_order: input.sortOrder ? Number(input.sortOrder) : 0,
    })
    .eq("id", input.categoryId)
    .eq("restaurant_id", current.profile.restaurant_id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/owner/menu");
  return { success: true };
}

export async function setCategoryActive(
  categoryId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const current = await requireOwner();

  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_categories")
    .update({ is_active: isActive })
    .eq("id", categoryId)
    .eq("restaurant_id", current.profile.restaurant_id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/owner/menu");
  return { success: true };
}

export type CreateProductInput = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: string;
  imagePath: string | null;
  isPopular: boolean;
  sortOrder: string;
};

export async function createProduct(input: CreateProductInput): Promise<ActionResult> {
  const current = await requireOwner();

  const name = input.name.trim();
  const price = Number(input.price);

  if (!name) {
    return { success: false, error: "Product name is required." };
  }
  if (!input.price || Number.isNaN(price)) {
    return { success: false, error: "A valid price is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("menu_products").insert({
    id: input.id,
    restaurant_id: current.profile.restaurant_id,
    category_id: input.categoryId || null,
    name,
    description: input.description.trim() || null,
    price,
    image_path: input.imagePath,
    is_popular: input.isPopular,
    sort_order: input.sortOrder ? Number(input.sortOrder) : 0,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/owner/menu");
  return { success: true };
}

export type UpdateProductInput = {
  productId: string;
  categoryId: string;
  name: string;
  description: string;
  price: string;
  imagePath: string | null;
  isPopular: boolean;
  sortOrder: string;
};

export async function updateProduct(input: UpdateProductInput): Promise<ActionResult> {
  const current = await requireOwner();

  const name = input.name.trim();
  const price = Number(input.price);

  if (!name) {
    return { success: false, error: "Product name is required." };
  }
  if (!input.price || Number.isNaN(price)) {
    return { success: false, error: "A valid price is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_products")
    .update({
      category_id: input.categoryId || null,
      name,
      description: input.description.trim() || null,
      price,
      image_path: input.imagePath,
      is_popular: input.isPopular,
      sort_order: input.sortOrder ? Number(input.sortOrder) : 0,
    })
    .eq("id", input.productId)
    .eq("restaurant_id", current.profile.restaurant_id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/owner/menu");
  return { success: true };
}

export async function setProductAvailable(
  productId: string,
  isAvailable: boolean,
): Promise<ActionResult> {
  const current = await requireOwner();

  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_products")
    .update({ is_available: isAvailable })
    .eq("id", productId)
    .eq("restaurant_id", current.profile.restaurant_id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/owner/menu");
  return { success: true };
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  const current = await requireOwner();

  const supabase = await createClient();

  const { data: product } = await supabase
    .from("menu_products")
    .select("image_path")
    .eq("id", productId)
    .eq("restaurant_id", current.profile.restaurant_id)
    .maybeSingle<{ image_path: string | null }>();

  const { error } = await supabase
    .from("menu_products")
    .delete()
    .eq("id", productId)
    .eq("restaurant_id", current.profile.restaurant_id);

  if (error) {
    return { success: false, error: error.message };
  }

  if (product?.image_path) {
    // Best-effort: the product row is already gone, so a storage hiccup
    // here shouldn't surface as a failed delete to the owner.
    await supabase.storage.from("product-images").remove([product.image_path]);
  }

  revalidatePath("/owner/menu");
  return { success: true };
}
