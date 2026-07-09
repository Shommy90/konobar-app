import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export type CurrentUser = {
  id: string;
  email: string | undefined;
  profile: Profile;
};

/**
 * Server-only: resolves the signed-in user's profile row (role, restaurant_id).
 * Returns null if there's no session or no matching profile yet.
 */
export async function getCurrentProfile(): Promise<CurrentUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) {
    return null;
  }

  return { id: user.id, email: user.email, profile };
}
