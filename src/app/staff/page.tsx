import { redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createClient } from "@/lib/supabase/server";
import { getStaffDashboardData } from "@/app/staff/data";
import { StaffDashboard } from "@/app/staff/StaffDashboard";
import type { Restaurant } from "@/types/database";

export default async function StaffPage() {
  const current = await getCurrentProfile();
  const role = current?.profile.role;

  if (!current || (role !== "STAFF" && role !== "OWNER") || !current.profile.restaurant_id) {
    redirect("/login");
  }

  const restaurantId = current.profile.restaurant_id;
  const supabase = await createClient();

  const [{ data: restaurant }, dashboardData] = await Promise.all([
    supabase.from("restaurants").select("*").eq("id", restaurantId).maybeSingle<Restaurant>(),
    getStaffDashboardData(restaurantId),
  ]);

  if (!restaurant) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography color="text.secondary">
          No restaurant is linked to your account yet. Contact your platform administrator.
        </Typography>
      </Container>
    );
  }

  return (
    <StaffDashboard
      restaurantId={restaurant.id}
      restaurantName={restaurant.name}
      initialData={dashboardData}
    />
  );
}
