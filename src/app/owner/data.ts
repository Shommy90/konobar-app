import { createClient } from "@/lib/supabase/server";
import type { MenuCategory, MenuProduct, Restaurant, RestaurantTable } from "@/types/database";

export async function getOwnerRestaurant(restaurantId: string): Promise<Restaurant | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", restaurantId)
    .maybeSingle<Restaurant>();

  return data;
}

export async function getOwnerTables(restaurantId: string): Promise<RestaurantTable[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurant_tables")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: true });

  return data ?? [];
}

export async function getOwnerCategories(restaurantId: string): Promise<MenuCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("menu_categories")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("sort_order", { ascending: true });

  return data ?? [];
}

export async function getOwnerProducts(restaurantId: string): Promise<MenuProduct[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("menu_products")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("sort_order", { ascending: true });

  return data ?? [];
}

