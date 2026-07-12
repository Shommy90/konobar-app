import { redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { CreateRestaurantDialog } from "@/app/super-admin/CreateRestaurantDialog";
import { CreateOwnerDialog } from "@/app/super-admin/CreateOwnerDialog";
import { RestaurantsTable } from "@/app/super-admin/RestaurantsTable";
import { PageHeader } from "@/components/PageHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { StatCard } from "@/components/StatCard";
import { getDashboardData } from "@/app/super-admin/data";

export default async function SuperAdminPage() {
  const current = await getCurrentProfile();

  if (!current || current.profile.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const { stats, restaurants } = await getDashboardData();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader
        title="Super Admin Dashboard"
        description="Manage every restaurant on the platform."
      />

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

      <SectionHeader
        title="Restaurants"
        action={
          <Stack direction="row" spacing={1}>
            <CreateOwnerDialog restaurants={restaurants.map((r) => ({ id: r.id, name: r.name }))} />
            <CreateRestaurantDialog />
          </Stack>
        }
      />

      <RestaurantsTable restaurants={restaurants} />
    </Container>
  );
}
