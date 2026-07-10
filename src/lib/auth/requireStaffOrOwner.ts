import { getCurrentProfile, type CurrentUser } from "@/lib/auth/getCurrentProfile";

export async function requireStaffOrOwner(): Promise<
  CurrentUser & { profile: { restaurant_id: string } }
> {
  const current = await getCurrentProfile();
  const role = current?.profile.role;
  if (!current || (role !== "STAFF" && role !== "OWNER") || !current.profile.restaurant_id) {
    throw new Error("Unauthorized");
  }
  return current as CurrentUser & { profile: { restaurant_id: string } };
}
