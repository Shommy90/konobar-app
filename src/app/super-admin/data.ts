import { createClient } from "@/lib/supabase/server";
import type { Profile, Restaurant, Subscription } from "@/types/database";

type OwnerSummary = Pick<Profile, "id" | "email" | "full_name">;

export type RestaurantWithRelations = Restaurant & {
  subscription: Subscription | null;
  owner: OwnerSummary | null;
};

export type DashboardStats = {
  totalRestaurants: number;
  activeRestaurants: number;
  trialRestaurants: number;
  disabledRestaurants: number;
  totalOwners: number;
};

export async function getDashboardData(): Promise<{
  stats: DashboardStats;
  restaurants: RestaurantWithRelations[];
}> {
  const supabase = await createClient();

  const [{ data: restaurants }, { count: totalOwners }] = await Promise.all([
    supabase.from("restaurants").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "OWNER"),
  ]);

  const restaurantList = restaurants ?? [];
  const restaurantIds = restaurantList.map((restaurant) => restaurant.id);

  const [{ data: subscriptions }, { data: owners }] = await Promise.all([
    restaurantIds.length
      ? supabase.from("subscriptions").select("*").in("restaurant_id", restaurantIds)
      : Promise.resolve({ data: [] as Subscription[] }),
    restaurantIds.length
      ? supabase
          .from("profiles")
          .select("id, email, full_name, restaurant_id")
          .eq("role", "OWNER")
          .in("restaurant_id", restaurantIds)
      : Promise.resolve({ data: [] as (OwnerSummary & { restaurant_id: string | null })[] }),
  ]);

  const subscriptionByRestaurant = new Map<string, Subscription>();
  for (const subscription of subscriptions ?? []) {
    const existing = subscriptionByRestaurant.get(subscription.restaurant_id);
    if (!existing || new Date(subscription.created_at) > new Date(existing.created_at)) {
      subscriptionByRestaurant.set(subscription.restaurant_id, subscription);
    }
  }

  const ownerByRestaurant = new Map<string, OwnerSummary>();
  for (const owner of owners ?? []) {
    if (owner.restaurant_id) {
      ownerByRestaurant.set(owner.restaurant_id, owner);
    }
  }

  const restaurantsWithRelations: RestaurantWithRelations[] = restaurantList.map((restaurant) => ({
    ...restaurant,
    subscription: subscriptionByRestaurant.get(restaurant.id) ?? null,
    owner: ownerByRestaurant.get(restaurant.id) ?? null,
  }));

  const stats: DashboardStats = {
    totalRestaurants: restaurantList.length,
    activeRestaurants: restaurantList.filter((r) => r.status === "ACTIVE").length,
    trialRestaurants: restaurantList.filter((r) => r.status === "TRIAL").length,
    disabledRestaurants: restaurantList.filter((r) => r.status === "DISABLED").length,
    totalOwners: totalOwners ?? 0,
  };

  return { stats, restaurants: restaurantsWithRelations };
}

export async function getRestaurantDetail(restaurantId: string): Promise<{
  restaurant: Restaurant;
  subscription: Subscription | null;
  owner: OwnerSummary | null;
} | null> {
  const supabase = await createClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", restaurantId)
    .maybeSingle<Restaurant>();

  if (!restaurant) {
    return null;
  }

  const [{ data: subscriptions }, { data: owner }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("restaurant_id", restaurantId)
      .eq("role", "OWNER")
      .maybeSingle<OwnerSummary>(),
  ]);

  return {
    restaurant,
    subscription: subscriptions?.[0] ?? null,
    owner: owner ?? null,
  };
}
