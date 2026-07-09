import { createClient } from "@/lib/supabase/server";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import type { Restaurant, RestaurantTable } from "@/types/database";

type GuestTablePageProps = {
  params: Promise<{
    restaurantSlug: string;
    tableToken: string;
  }>;
};

function ErrorPage({ message }: { message: string }) {
  return <PagePlaceholder title="Table not available" description={message} />;
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

  return (
    <PagePlaceholder title={restaurant.name} description={`${table.name} · Menu coming soon.`} />
  );
}
