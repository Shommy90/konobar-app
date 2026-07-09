import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export default async function StaffPage() {
  const current = await getCurrentProfile();

  if (!current || current.profile.role !== "STAFF") {
    redirect("/login");
  }

  return (
    <PagePlaceholder
      title="Staff Dashboard"
      description="Real-time incoming orders for kitchen/floor staff will appear here. Coming in a later sprint."
    />
  );
}
