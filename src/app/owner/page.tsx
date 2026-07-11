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
import { RestaurantStatusChip } from "@/components/RestaurantStatusChip";

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
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography color="text.secondary">
          No restaurant is linked to your account yet. Contact your platform administrator.
        </Typography>
      </Container>
    );
  }

  const activeTables = tables.filter((table) => table.is_active).length;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Restaurant Owner Dashboard
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card variant="outlined">
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
          <Card variant="outlined">
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Tables
              </Typography>
              <Typography variant="h4" component="p">
                {tables.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Active tables
              </Typography>
              <Typography variant="h4" component="p">
                {activeTables}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h6" component="h2" gutterBottom>
        Quick actions
      </Typography>
      <Stack direction="row" spacing={2}>
        <LinkButton variant="contained" href="/owner/tables">
          Manage Tables
        </LinkButton>
        <LinkButton variant="contained" href="/owner/menu">
          Manage Menu
        </LinkButton>
        <LinkButton variant="contained" href="/owner/staff">
          Manage Staff
        </LinkButton>
      </Stack>
    </Container>
  );
}
