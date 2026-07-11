import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type CreateOwnerAccountInput = {
  email: string;
  password: string;
  fullName: string;
  restaurantId: string;
};

export type CreateOwnerAccountResult = { success: true } | { success: false; error: string };

/**
 * Creates a Supabase Auth user (service-role) then inserts the matching
 * profiles row via the caller's own RLS-scoped client - so the insert is
 * still subject to the profiles_insert (SUPER_ADMIN-only) policy rather
 * than silently bypassing RLS. Rolls back the auth user if the profile
 * insert fails, so a partial failure never leaves an orphaned login with
 * no profile.
 */
export async function createOwnerAccount(
  input: CreateOwnerAccountInput,
): Promise<CreateOwnerAccountResult> {
  const email = input.email.trim();

  if (!email || !input.password || !input.restaurantId) {
    return { success: false, error: "Email, password, and restaurant are required." };
  }

  const adminClient = createAdminClient();

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName },
  });

  if (createError || !created.user) {
    return { success: false, error: createError?.message ?? "Failed to create user." };
  }

  const supabase = await createClient();
  const { error: profileError } = await supabase.from("profiles").insert({
    id: created.user.id,
    email,
    full_name: input.fullName.trim() || null,
    role: "OWNER",
    restaurant_id: input.restaurantId,
  });

  if (profileError) {
    await adminClient.auth.admin.deleteUser(created.user.id);
    return { success: false, error: profileError.message };
  }

  return { success: true };
}
