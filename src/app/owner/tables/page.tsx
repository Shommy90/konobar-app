import { redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { getOwnerRestaurant, getOwnerTables } from "@/app/owner/data";
import { generateQrCodeDataUrl } from "@/lib/qr";
import { getBaseUrl, getGuestTableUrl } from "@/lib/url";
import { CreateTableDialog } from "@/app/owner/tables/CreateTableDialog";
import { TableCard } from "@/app/owner/tables/TableCard";

export default async function OwnerTablesPage() {
  const current = await getCurrentProfile();

  if (!current || current.profile.role !== "OWNER" || !current.profile.restaurant_id) {
    redirect("/login");
  }

  const restaurantId = current.profile.restaurant_id;
  const [restaurant, tables, baseUrl] = await Promise.all([
    getOwnerRestaurant(restaurantId),
    getOwnerTables(restaurantId),
    getBaseUrl(),
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

  const tableCards = await Promise.all(
    tables.map(async (table) => {
      const guestUrl = getGuestTableUrl(baseUrl, restaurant.slug, table.table_token);
      const qrDataUrl = await generateQrCodeDataUrl(guestUrl);
      return { table, guestUrl, qrDataUrl };
    }),
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          Tables
        </Typography>
        <CreateTableDialog />
      </Stack>

      {tableCards.length === 0 ? (
        <Typography color="text.secondary">
          No tables yet. Create your first table to generate its QR code.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {tableCards.map(({ table, guestUrl, qrDataUrl }) => (
            <Grid key={table.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <TableCard
                table={table}
                guestUrl={guestUrl}
                qrDataUrl={qrDataUrl}
                restaurantName={restaurant.name}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
