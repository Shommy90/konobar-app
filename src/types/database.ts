export type UserRole = "SUPER_ADMIN" | "OWNER" | "STAFF";

export type RestaurantStatus = "ACTIVE" | "DISABLED" | "TRIAL";

export type SubscriptionPlan = "BASIC" | "BUSINESS" | "ENTERPRISE";

export type Profile = {
  id: string;
  email: string;
  nickname: string | null;
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

export type RestaurantTable = {
  id: string;
  restaurant_id: string;
  name: string;
  number: number | null;
  table_token: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MenuCategory = {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MenuProduct = {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_path: string | null;
  is_available: boolean;
  is_popular: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type TableSessionStatus = "ACTIVE" | "REQUESTED_BILL" | "CLOSED";

export type TableSession = {
  id: string;
  restaurant_id: string;
  table_id: string;
  status: TableSessionStatus;
  session_token: string;
  opened_at: string;
  closed_at: string | null;
  last_activity_at: string;
};

export type OrderStatus = "NEW" | "ACCEPTED" | "READY" | "DELIVERED" | "CANCELLED";

export type Order = {
  id: string;
  restaurant_id: string;
  table_id: string;
  table_session_id: string;
  status: OrderStatus;
  total_price: number;
  note: string | null;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_price: number;
  quantity: number;
  note: string | null;
};

export type ServiceRequestType = "CALL_WAITER" | "REQUEST_BILL";
export type ServiceRequestStatus = "NEW" | "DONE";

export type ServiceRequest = {
  id: string;
  restaurant_id: string;
  table_id: string;
  table_session_id: string;
  type: ServiceRequestType;
  status: ServiceRequestStatus;
  created_at: string;
};
