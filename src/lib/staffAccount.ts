import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isValidNickname, nicknameToStaffEmail } from "@/lib/staffLogin";

type CreateOwnerAccountInput = {
  role: "OWNER";
  email: string;
  password: string;
  fullName: string;
  restaurantId: string;
};

type CreateStaffMemberInput = {
  role: "STAFF";
  nickname: string;
  password: string;
  fullName: string;
  restaurantId: string;
};

export type CreateStaffAccountInput = CreateOwnerAccountInput | CreateStaffMemberInput;

export type CreateStaffAccountResult = { success: true } | { success: false; error: string };

/**
 * Creates a Supabase Auth user (service-role) then inserts the matching
 * profiles row via the caller's own RLS-scoped client - so the insert is
 * still subject to whichever profiles_insert policy applies to the actual
 * caller (SUPER_ADMIN creating anyone, or OWNER creating STAFF for their
 * own restaurant), rather than silently bypassing RLS. Rolls back the auth
 * user if the profile insert fails, so a partial failure never leaves an
 * orphaned login with no profile.
 *
 * STAFF log in with a nickname, not an email - Supabase Auth is still
 * email-based under the hood, so a deterministic synthetic email is used
 * for STAFF (see nicknameToStaffEmail). OWNER keeps using a real email.
 */
export async function createStaffAccount(
  input: CreateStaffAccountInput,
): Promise<CreateStaffAccountResult> {
  if (!input.password || !input.restaurantId) {
    return { success: false, error: "Password and restaurant are required." };
  }

  let authEmail: string;
  let nickname: string | null = null;

  if (input.role === "OWNER") {
    authEmail = input.email.trim();
    if (!authEmail) {
      return { success: false, error: "Email is required." };
    }
  } else {
    nickname = input.nickname.trim().toLowerCase();
    if (!isValidNickname(nickname)) {
      return {
        success: false,
        error: "Nickname must be 3-32 characters: lowercase letters, numbers, - or _.",
      };
    }
    authEmail = nicknameToStaffEmail(nickname);
  }

  const adminClient = createAdminClient();

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: authEmail,
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
    email: authEmail,
    nickname,
    full_name: input.fullName.trim() || null,
    role: input.role,
    restaurant_id: input.restaurantId,
  });

  if (profileError) {
    await adminClient.auth.admin.deleteUser(created.user.id);
    return { success: false, error: profileError.message };
  }

  return { success: true };
}
