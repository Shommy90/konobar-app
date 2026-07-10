import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem, ServiceRequest, TableSession } from "@/types/database";

type TableInfo = { name: string; number: number | null };

export type StaffOrder = Order & { order_items: OrderItem[]; restaurant_tables: TableInfo | null };
export type StaffServiceRequest = ServiceRequest & { restaurant_tables: TableInfo | null };
export type StaffActiveSession = TableSession & {
  restaurant_tables: TableInfo | null;
  total: number;
};

export type StaffDashboardData = {
  orders: StaffOrder[];
  serviceRequests: StaffServiceRequest[];
  activeSessions: StaffActiveSession[];
};

const LIVE_ORDER_STATUSES = ["NEW", "ACCEPTED", "READY"];

export async function getStaffDashboardData(restaurantId: string): Promise<StaffDashboardData> {
  const supabase = await createClient();

  const [{ data: orders }, { data: serviceRequests }, { data: sessions }] = await Promise.all([
    supabase
      .from("orders")
      .select("*, order_items(*), restaurant_tables(name, number)")
      .eq("restaurant_id", restaurantId)
      .in("status", LIVE_ORDER_STATUSES)
      .order("created_at", { ascending: true }),
    supabase
      .from("service_requests")
      .select("*, restaurant_tables(name, number)")
      .eq("restaurant_id", restaurantId)
      .eq("status", "NEW")
      .order("created_at", { ascending: true }),
    supabase
      .from("table_sessions")
      .select("*, restaurant_tables(name, number)")
      .eq("restaurant_id", restaurantId)
      .in("status", ["ACTIVE", "REQUESTED_BILL"])
      .order("opened_at", { ascending: true }),
  ]);

  const sessionList = sessions ?? [];
  const sessionIds = sessionList.map((session) => session.id);

  const { data: totals } = sessionIds.length
    ? await supabase
        .from("orders")
        .select("table_session_id, total_price")
        .eq("restaurant_id", restaurantId)
        .neq("status", "CANCELLED")
        .in("table_session_id", sessionIds)
    : { data: [] as { table_session_id: string; total_price: number }[] };

  const totalBySession = new Map<string, number>();
  for (const row of totals ?? []) {
    totalBySession.set(
      row.table_session_id,
      (totalBySession.get(row.table_session_id) ?? 0) + row.total_price,
    );
  }

  return {
    orders: (orders ?? []) as StaffOrder[],
    serviceRequests: (serviceRequests ?? []) as StaffServiceRequest[],
    activeSessions: sessionList.map((session) => ({
      ...session,
      total: totalBySession.get(session.id) ?? 0,
    })) as StaffActiveSession[],
  };
}

export async function getSessionOrderHistory(sessionId: string): Promise<StaffOrder[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*), restaurant_tables(name, number)")
    .eq("table_session_id", sessionId)
    .order("created_at", { ascending: false });

  return (data ?? []) as StaffOrder[];
}
