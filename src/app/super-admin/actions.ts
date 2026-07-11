"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createStaffAccount } from "@/lib/staffAccount";
import type { RestaurantStatus } from "@/types/database";

type ActionResult = { success: true } | { success: false; error: string };

async function requireSuperAdmin() {
  const current = await getCurrentProfile();
  if (!current || current.profile.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }
  return current;
}

// Subscription status isn't a separate form field yet - it's derived from
// the restaurant status chosen when creating/toggling a restaurant.
function subscriptionStatusFor(restaurantStatus: RestaurantStatus): string {
  switch (restaurantStatus) {
    case "TRIAL":
      return "trialing";
    case "ACTIVE":
      return "active";
    case "DISABLED":
      return "canceled";
  }
}

export type CreateRestaurantInput = {
  name: string;
  slug: string;
  address: string;
  status: RestaurantStatus;
  plan: string;
  price: string;
  trialEnd: string;
};

export async function createRestaurant(input: CreateRestaurantInput): Promise<ActionResult> {
  await requireSuperAdmin();

  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();

  if (!name || !slug) {
    return { success: false, error: "Name and slug are required." };
  }

  const supabase = await createClient();

  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .insert({
      name,
      slug,
      address: input.address.trim() || null,
      status: input.status,
    })
    .select("id")
    .single();

  if (restaurantError || !restaurant) {
    return { success: false, error: restaurantError?.message ?? "Failed to create restaurant." };
  }

  const { error: subscriptionError } = await supabase.from("subscriptions").insert({
    restaurant_id: restaurant.id,
    plan: input.plan,
    status: subscriptionStatusFor(input.status),
    price: input.price ? Number(input.price) : null,
    trial_end: input.trialEnd || null,
  });

  if (subscriptionError) {
    return { success: false, error: subscriptionError.message };
  }

  revalidatePath("/super-admin");
  return { success: true };
}

export type UpdateRestaurantInput = {
  restaurantId: string;
  name: string;
  slug: string;
  address: string;
  status: RestaurantStatus;
  plan: string;
  price: string;
  trialEnd: string;
};

export async function updateRestaurant(input: UpdateRestaurantInput): Promise<ActionResult> {
  await requireSuperAdmin();

  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();

  if (!name || !slug) {
    return { success: false, error: "Name and slug are required." };
  }

  const supabase = await createClient();

  const { error: restaurantError } = await supabase
    .from("restaurants")
    .update({ name, slug, address: input.address.trim() || null, status: input.status })
    .eq("id", input.restaurantId);

  if (restaurantError) {
    return { success: false, error: restaurantError.message };
  }

  const subscriptionValues = {
    plan: input.plan,
    status: subscriptionStatusFor(input.status),
    price: input.price ? Number(input.price) : null,
    trial_end: input.trialEnd || null,
  };

  const { data: existingSubscription } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("restaurant_id", input.restaurantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  const { error: subscriptionError } = existingSubscription
    ? await supabase
        .from("subscriptions")
        .update(subscriptionValues)
        .eq("id", existingSubscription.id)
    : await supabase
        .from("subscriptions")
        .insert({ restaurant_id: input.restaurantId, ...subscriptionValues });

  if (subscriptionError) {
    return { success: false, error: subscriptionError.message };
  }

  revalidatePath("/super-admin");
  revalidatePath(`/super-admin/restaurants/${input.restaurantId}`);
  return { success: true };
}

export async function setRestaurantStatus(
  restaurantId: string,
  status: RestaurantStatus,
): Promise<ActionResult> {
  await requireSuperAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("restaurants").update({ status }).eq("id", restaurantId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/super-admin");
  revalidatePath(`/super-admin/restaurants/${restaurantId}`);
  return { success: true };
}

export type CreateOwnerInput = {
  email: string;
  password: string;
  fullName: string;
  restaurantId: string;
};

export async function createOwner(input: CreateOwnerInput): Promise<ActionResult> {
  await requireSuperAdmin();

  const result = await createStaffAccount({ ...input, role: "OWNER" });
  if (!result.success) {
    return result;
  }

  revalidatePath("/super-admin");
  return { success: true };
}

export type CreateStaffMemberInput = {
  nickname: string;
  password: string;
  fullName: string;
  restaurantId: string;
};

export async function createStaffMember(input: CreateStaffMemberInput): Promise<ActionResult> {
  await requireSuperAdmin();

  const result = await createStaffAccount({ ...input, role: "STAFF" });
  if (!result.success) {
    return result;
  }

  revalidatePath("/super-admin");
  return { success: true };
}

export type UpdateOwnerInput = {
  profileId: string;
  restaurantId: string;
  fullName: string;
  email: string;
};

export async function updateOwner(input: UpdateOwnerInput): Promise<ActionResult> {
  await requireSuperAdmin();

  const email = input.email.trim();

  if (!email) {
    return { success: false, error: "Email is required." };
  }

  const supabase = await createClient();

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", input.profileId)
    .maybeSingle<{ email: string }>();

  if (!existingProfile) {
    return { success: false, error: "Owner not found." };
  }

  if (email !== existingProfile.email) {
    const adminClient = createAdminClient();
    const { error: authError } = await adminClient.auth.admin.updateUserById(input.profileId, {
      email,
    });
    if (authError) {
      return { success: false, error: authError.message };
    }
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ email, full_name: input.fullName.trim() || null })
    .eq("id", input.profileId);

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  revalidatePath("/super-admin");
  revalidatePath(`/super-admin/restaurants/${input.restaurantId}`);
  return { success: true };
}
