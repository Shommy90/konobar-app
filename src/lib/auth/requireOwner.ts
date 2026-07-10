import { getCurrentProfile, type CurrentUser } from "@/lib/auth/getCurrentProfile";

export async function requireOwner(): Promise<
  CurrentUser & { profile: { restaurant_id: string } }
> {
  const current = await getCurrentProfile();
  if (!current || current.profile.role !== "OWNER" || !current.profile.restaurant_id) {
    throw new Error("Unauthorized");
  }
  return current as CurrentUser & { profile: { restaurant_id: string } };
}
