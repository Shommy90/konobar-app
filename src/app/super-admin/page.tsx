import { redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { CreateRestaurantDialog } from "@/app/super-admin/CreateRestaurantDialog";
import { CreateOwnerDialog } from "@/app/super-admin/CreateOwnerDialog";
import { RestaurantsTable } from "@/app/super-admin/RestaurantsTable";
import { StatCard } from "@/app/super-admin/StatCard";
import { getDashboardData } from "@/app/super-admin/data";

export default async function SuperAdminPage() {
  const current = await getCurrentProfile();

  if (!current || current.profile.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const { stats, restaurants } = await getDashboardData();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Super Admin Dashboard
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <StatCard label="Total restaurants" value={stats.totalRestaurants} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <StatCard label="Active" value={stats.activeRestaurants} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <StatCard label="Trial" value={stats.trialRestaurants} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <StatCard label="Disabled" value={stats.disabledRestaurants} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <StatCard label="Total owners" value={stats.totalOwners} />
        </Grid>
      </Grid>

      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" component="h2">
          Restaurants
        </Typography>
        <Stack direction="row" spacing={1}>
          <CreateOwnerDialog restaurants={restaurants.map((r) => ({ id: r.id, name: r.name }))} />
          <CreateRestaurantDialog />
        </Stack>
      </Stack>

      <RestaurantsTable restaurants={restaurants} />
    </Container>
  );
}
