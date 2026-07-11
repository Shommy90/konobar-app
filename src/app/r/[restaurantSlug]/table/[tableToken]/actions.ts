"use server";

import { createClient } from "@/lib/supabase/server";
import { SESSION_EXPIRED_MESSAGE } from "@/lib/tableSession";
import type { Order, TableSessionCloseReason } from "@/types/database";

// No auth guard here on purpose - guests never log in. Every write below
// goes through a SECURITY DEFINER RPC (0015_guest_ordering_sessions.sql)
// that re-validates restaurant/table/session/device state server-side;
// nothing sensitive is taken as-is from the client. See that migration's
// header comment for the RLS side of this.

export type GuestSessionState =
  | { state: "unclaimed" }
  | { state: "active"; sessionId: string; sessionToken: string; expiresAt: string | null }
  | { state: "requested_bill"; sessionId: string; sessionToken: string; expiresAt: string | null }
  | { state: "ended"; closeReason: TableSessionCloseReason | null };

export type GuestSessionResult =
  | { success: true; session: GuestSessionState }
  | { success: false; error: string };

function mapRpcError(message: string | undefined): string {
  if (message?.includes("SCAN_REQUIRED")) {
    return "Please scan the table's QR code again to start ordering.";
  }
  if (message?.includes("SESSION_INACTIVE")) {
    return SESSION_EXPIRED_MESSAGE;
  }
  if (message?.includes("RESTAURANT_OR_TABLE_UNAVAILABLE")) {
    return "This table is currently unavailable. Please ask staff for assistance.";
  }
  if (message?.includes("NO_ITEMS_AVAILABLE")) {
    return "None of the items in your cart are available anymore.";
  }
  // Anything else is an unexpected server/DB error - never surface the raw
  // driver message to an anonymous guest.
  return "Something went wrong. Please try again.";
}

function parseSessionState(data: Record<string, unknown>): GuestSessionState {
  const state = data.state as string;

  if (state === "active" || state === "requested_bill") {
    return {
      state,
      sessionId: data.session_id as string,
      sessionToken: data.session_token as string,
      expiresAt: (data.expires_at as string | null) ?? null,
    };
  }

  if (state === "ended") {
    return {
      state: "ended",
      closeReason: (data.close_reason as TableSessionCloseReason | null) ?? null,
    };
  }

  return { state: "unclaimed" };
}

export async function establishGuestSession(input: {
  nonce: string;
  restaurantId: string;
  tableId: string;
  guestDeviceToken: string;
}): Promise<GuestSessionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("resolve_guest_session", {
    p_nonce: input.nonce,
    p_restaurant_id: input.restaurantId,
    p_table_id: input.tableId,
    p_guest_device_token: input.guestDeviceToken,
  });

  if (error || !data) {
    return { success: false, error: mapRpcError(error?.message) };
  }

  return { success: true, session: parseSessionState(data as Record<string, unknown>) };
}

export async function pollGuestSession(input: {
  tableId: string;
  guestDeviceToken: string;
}): Promise<GuestSessionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_session", {
    p_table_id: input.tableId,
    p_guest_device_token: input.guestDeviceToken,
  });

  if (error || !data) {
    return { success: false, error: mapRpcError(error?.message) };
  }

  return { success: true, session: parseSessionState(data as Record<string, unknown>) };
}

export type PlaceOrderItemInput = {
  productId: string;
  quantity: number;
  note: string;
};

export type PlaceOrderInput = {
  restaurantId: string;
  tableId: string;
  guestDeviceToken: string;
  items: PlaceOrderItemInput[];
};

export type PlaceOrderResult =
  | { success: true; orderId: string; session: GuestSessionState }
  | { success: false; error: string };

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  if (input.items.length === 0) {
    return { success: false, error: "Your cart is empty." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_guest_order", {
    p_restaurant_id: input.restaurantId,
    p_table_id: input.tableId,
    p_guest_device_token: input.guestDeviceToken,
    p_items: input.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      note: item.note,
    })),
  });

  if (error || !data) {
    return { success: false, error: mapRpcError(error?.message) };
  }

  const result = data as Record<string, unknown>;
  return {
    success: true,
    orderId: result.order_id as string,
    session: parseSessionState(result),
  };
}

export async function getSessionOrders(tableSessionId: string): Promise<Order[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("table_session_id", tableSessionId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export type BillLine = { name: string; price: number; quantity: number };

export async function getSessionBill(
  tableSessionId: string,
): Promise<{ lines: BillLine[]; total: number }> {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("id")
    .eq("table_session_id", tableSessionId)
    .neq("status", "CANCELLED");

  const orderIds = (orders ?? []).map((order) => order.id);
  if (orderIds.length === 0) {
    return { lines: [], total: 0 };
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("product_name, product_price, quantity")
    .in("order_id", orderIds);

  const grouped = new Map<string, BillLine>();
  for (const item of items ?? []) {
    const key = `${item.product_name}::${item.product_price}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      grouped.set(key, {
        name: item.product_name,
        price: item.product_price,
        quantity: item.quantity,
      });
    }
  }

  const lines = Array.from(grouped.values());
  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  return { lines, total };
}

type ServiceActionInput = {
  sessionId: string;
  guestDeviceToken: string;
};

type ServiceActionResult = { success: true } | { success: false; error: string };

export async function callWaiter(input: ServiceActionInput): Promise<ServiceActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("guest_call_waiter", {
    p_session_id: input.sessionId,
    p_guest_device_token: input.guestDeviceToken,
  });

  if (error) return { success: false, error: mapRpcError(error.message) };
  return { success: true };
}

export async function requestBill(input: ServiceActionInput): Promise<GuestSessionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("request_guest_bill", {
    p_session_id: input.sessionId,
    p_guest_device_token: input.guestDeviceToken,
  });

  if (error || !data) {
    return { success: false, error: mapRpcError(error?.message) };
  }

  return { success: true, session: parseSessionState(data as Record<string, unknown>) };
}
