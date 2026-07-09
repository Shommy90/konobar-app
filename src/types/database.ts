export type UserRole = "SUPER_ADMIN" | "OWNER" | "STAFF";

export type RestaurantStatus = "ACTIVE" | "DISABLED" | "TRIAL";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  restaurant_id: string | null;
  created_at: string;
};

export type Restaurant = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  address: string | null;
  status: RestaurantStatus;
  created_at: string;
};

export type Subscription = {
  id: string;
  restaurant_id: string;
  plan: string;
  status: string;
  price: number | null;
  trial_end: string | null;
  created_at: string;
};
