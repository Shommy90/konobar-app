import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export default async function OwnerPage() {
  const current = await getCurrentProfile();

  if (!current || current.profile.role !== "OWNER") {
    redirect("/login");
  }

  return (
    <PagePlaceholder
      title="Restaurant Owner Dashboard"
      description="Restaurant owners will manage their menu, tables, and staff from here. Coming in a later sprint."
    />
  );
}
