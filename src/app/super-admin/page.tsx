import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export default async function SuperAdminPage() {
  const current = await getCurrentProfile();

  if (!current || current.profile.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  return (
    <PagePlaceholder
      title="Super Admin Dashboard"
      description="Platform-level dashboard for managing all restaurants/tenants on Konobar. Coming in a later sprint."
    />
  );
}
