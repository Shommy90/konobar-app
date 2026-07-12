import { redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import QrCode2OutlinedIcon from "@mui/icons-material/QrCode2Outlined";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { getOwnerRestaurant, getOwnerTables } from "@/app/owner/data";
import { generateQrCodeDataUrl } from "@/lib/qr";
import { getBaseUrl, getGuestTableUrl } from "@/lib/url";
import { CreateTableDialog } from "@/app/owner/tables/CreateTableDialog";
import { TableCard } from "@/app/owner/tables/TableCard";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

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
      <PagePlaceholder
        title="No restaurant linked"
        description="No restaurant is linked to your account yet. Contact your platform administrator."
      />
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
      <PageHeader
        title="Tables"
        description="Generate and manage the QR codes guests scan to order."
        breadcrumbs={[{ label: "Owner", href: "/owner" }, { label: "Tables" }]}
        action={<CreateTableDialog />}
      />

      {tableCards.length === 0 ? (
        <EmptyState
          icon={<QrCode2OutlinedIcon />}
          title="No tables yet"
          description="Create your first table to generate its QR code."
        />
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
