import { redirect } from "next/navigation";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { getOwnerRestaurant, getOwnerTables } from "@/app/owner/data";
import { LinkButton } from "@/components/LinkButton";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { PageHeader } from "@/components/PageHeader";
import { RestaurantStatusChip } from "@/components/RestaurantStatusChip";
import { SectionHeader } from "@/components/SectionHeader";
import { StatCard } from "@/components/StatCard";

export default async function OwnerPage() {
  const current = await getCurrentProfile();

  if (!current || current.profile.role !== "OWNER" || !current.profile.restaurant_id) {
    redirect("/login");
  }

  const restaurantId = current.profile.restaurant_id;
  const [restaurant, tables] = await Promise.all([
    getOwnerRestaurant(restaurantId),
    getOwnerTables(restaurantId),
  ]);

  if (!restaurant) {
    return (
      <PagePlaceholder
        title="No restaurant linked"
        description="No restaurant is linked to your account yet. Contact your platform administrator."
      />
    );
  }

  const activeTables = tables.filter((table) => table.is_active).length;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <PageHeader title="Restaurant Owner Dashboard" />

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Restaurant
              </Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 0.5 }}>
                <Typography variant="h5" component="p">
                  {restaurant.name}
                </Typography>
                <RestaurantStatusChip status={restaurant.status} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="Tables" value={tables.length} />
          {tables.length === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
              No tables yet - add one below.
            </Typography>
          )}
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="Active tables" value={activeTables} />
        </Grid>
      </Grid>

      <SectionHeader title="Quick actions" />
      <Stack direction="row" spacing={2}>
        <LinkButton variant="contained" href="/owner/tables">
          Manage Tables
        </LinkButton>
        <LinkButton variant="contained" href="/owner/menu">
          Manage Menu
        </LinkButton>
      </Stack>
    </Container>
  );
}
