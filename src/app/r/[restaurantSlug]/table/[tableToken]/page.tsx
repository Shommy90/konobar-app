import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

type GuestTablePageProps = {
  params: Promise<{
    restaurantSlug: string;
    tableToken: string;
  }>;
};

export default async function GuestTablePage({ params }: GuestTablePageProps) {
  const { restaurantSlug, tableToken } = await params;

  return (
    <PagePlaceholder
      title="Guest Menu"
      description="This is the page guests land on after scanning a table's QR code. The menu and ordering flow will be built here."
    >
      <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
        <Chip label={`restaurant: ${restaurantSlug}`} />
        <Chip label={`table: ${tableToken}`} />
      </Stack>
    </PagePlaceholder>
  );
}
