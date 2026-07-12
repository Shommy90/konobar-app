import { notFound, redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { getRestaurantDetail } from "@/app/super-admin/data";
import { EditOwnerDialog } from "@/app/super-admin/EditOwnerDialog";
import { EditRestaurantDialog } from "@/app/super-admin/EditRestaurantDialog";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { RestaurantStatusChip } from "@/components/RestaurantStatusChip";
import { StatusToggleButton } from "@/app/super-admin/StatusToggleButton";
import { formatDate } from "@/lib/formatDate";

function toDateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}

type RestaurantDetailPageProps = {
  params: Promise<{ restaurantId: string }>;
};

export default async function RestaurantDetailPage({ params }: RestaurantDetailPageProps) {
  const current = await getCurrentProfile();

  if (!current || current.profile.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const { restaurantId } = await params;
  const detail = await getRestaurantDetail(restaurantId);

  if (!detail) {
    notFound();
  }

  const { restaurant, subscription, owner } = detail;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <PageHeader
        backHref="/super-admin"
        breadcrumbs={[{ label: "Super Admin", href: "/super-admin" }, { label: restaurant.name }]}
        title={restaurant.name}
        description={
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 0.5 }}>
            <RestaurantStatusChip status={restaurant.status} />
          </Stack>
        }
        action={
          <EditRestaurantDialog
            initial={{
              restaurantId: restaurant.id,
              name: restaurant.name,
              slug: restaurant.slug,
              address: restaurant.address ?? "",
              status: restaurant.status,
              plan: subscription?.plan ?? "BASIC",
              price: subscription?.price != null ? String(subscription.price) : "",
              trialEnd: toDateInputValue(subscription?.trial_end ?? null),
            }}
          />
        }
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper variant="outlined" sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Restaurant info
            </Typography>
            <Stack spacing={1}>
              <Typography>
                <strong>Slug:</strong> {restaurant.slug}
              </Typography>
              <Typography>
                <strong>Address:</strong> {restaurant.address ?? "—"}
              </Typography>
              <Typography>
                <strong>Created:</strong> {formatDate(restaurant.created_at)}
              </Typography>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper variant="outlined" sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Subscription
            </Typography>
            {subscription ? (
              <Stack spacing={1}>
                <Typography>
                  <strong>Plan:</strong> {subscription.plan}
                </Typography>
                <Typography>
                  <strong>Status:</strong> {subscription.status}
                </Typography>
                <Typography>
                  <strong>Price:</strong> {subscription.price ?? "—"}
                </Typography>
                <Typography>
                  <strong>Trial end:</strong>{" "}
                  {subscription.trial_end ? formatDate(subscription.trial_end) : "—"}
                </Typography>
              </Stack>
            ) : (
              <EmptyState
                icon={<ReceiptLongOutlinedIcon />}
                title="No subscription on record"
              />
            )}
          </Paper>
        </Grid>

        <Grid size={12}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h6" gutterBottom>
                Owner
              </Typography>
              {owner && (
                <EditOwnerDialog
                  initial={{
                    profileId: owner.id,
                    restaurantId: restaurant.id,
                    fullName: owner.full_name ?? "",
                    email: owner.email,
                  }}
                />
              )}
            </Stack>
            {owner ? (
              <Stack spacing={1}>
                <Typography>
                  <strong>Name:</strong> {owner.full_name ?? "—"}
                </Typography>
                <Typography>
                  <strong>Email:</strong> {owner.email}
                </Typography>
              </Stack>
            ) : (
              <EmptyState
                icon={<PersonOutlineIcon />}
                title="No owner assigned yet"
                description="Create one from the dashboard."
              />
            )}
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Stack direction="row" spacing={2}>
        <StatusToggleButton restaurantId={restaurant.id} status={restaurant.status} />
      </Stack>
    </Container>
  );
}
