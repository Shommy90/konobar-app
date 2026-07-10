import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { createClient } from "@/lib/supabase/server";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import type { MenuCategory, MenuProduct, Restaurant, RestaurantTable } from "@/types/database";

type GuestTablePageProps = {
  params: Promise<{
    restaurantSlug: string;
    tableToken: string;
  }>;
};

function ErrorPage({ message }: { message: string }) {
  return <PagePlaceholder title="Table not available" description={message} />;
}

function ProductRow({ product }: { product: MenuProduct }) {
  return (
    <Box sx={{ py: 1.5 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography variant="subtitle1">{product.name}</Typography>
          {product.is_popular && <Chip size="small" color="warning" label="Popular" />}
        </Stack>
        <Typography variant="subtitle1" sx={{ whiteSpace: "nowrap", ml: 2 }}>
          {product.price.toFixed(2)}
        </Typography>
      </Stack>
      {product.description && (
        <Typography variant="body2" color="text.secondary">
          {product.description}
        </Typography>
      )}
    </Box>
  );
}

export default async function GuestTablePage({ params }: GuestTablePageProps) {
  const { restaurantSlug, tableToken } = await params;
  const supabase = await createClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", restaurantSlug)
    .maybeSingle<Restaurant>();

  if (!restaurant) {
    return (
      <ErrorPage message="We couldn't find this restaurant. Please check the QR code and try again." />
    );
  }

  if (restaurant.status === "DISABLED") {
    return <ErrorPage message="This restaurant is currently unavailable." />;
  }

  const { data: table } = await supabase
    .from("restaurant_tables")
    .select("*")
    .eq("table_token", tableToken)
    .eq("restaurant_id", restaurant.id)
    .maybeSingle<RestaurantTable>();

  if (!table) {
    return (
      <ErrorPage message="This table link is invalid. Please check the QR code and try again." />
    );
  }

  if (!table.is_active) {
    return (
      <ErrorPage message="This table is currently unavailable. Please ask staff for assistance." />
    );
  }

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("menu_products")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .eq("is_available", true)
      .order("sort_order", { ascending: true }),
  ]);

  const categoryList: MenuCategory[] = categories ?? [];
  const productList: MenuProduct[] = products ?? [];
  const uncategorized = productList.filter((product) => !product.category_id);

  const hasAnyItems =
    productList.length > 0 &&
    (categoryList.some((category) =>
      productList.some((product) => product.category_id === category.id),
    ) ||
      uncategorized.length > 0);

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {restaurant.name}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        {table.name}
      </Typography>

      {!hasAnyItems ? (
        <Typography color="text.secondary">Menu coming soon.</Typography>
      ) : (
        <Stack spacing={3}>
          {categoryList.map((category) => {
            const categoryProducts = productList.filter(
              (product) => product.category_id === category.id,
            );
            if (categoryProducts.length === 0) return null;

            return (
              <Paper key={category.id} variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6">{category.name}</Typography>
                {category.description && (
                  <Typography variant="body2" color="text.secondary">
                    {category.description}
                  </Typography>
                )}
                <Divider sx={{ mt: 1.5 }} />
                <Stack divider={<Divider />}>
                  {categoryProducts.map((product) => (
                    <ProductRow key={product.id} product={product} />
                  ))}
                </Stack>
              </Paper>
            );
          })}

          {uncategorized.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6">Other Items</Typography>
              <Divider sx={{ mt: 1.5 }} />
              <Stack divider={<Divider />}>
                {uncategorized.map((product) => (
                  <ProductRow key={product.id} product={product} />
                ))}
              </Stack>
            </Paper>
          )}
        </Stack>
      )}
    </Container>
  );
}
