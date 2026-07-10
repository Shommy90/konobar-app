"use server";

import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { SESSION_TIMEOUT_HOURS } from "@/lib/tableSession";
import type { Order, TableSession } from "@/types/database";

// No auth guard here on purpose - guests never log in. Every action below
// only trusts values it re-derives or re-verifies server-side (current
// product prices, session status); nothing sensitive is taken as-is from
// the client. See 0009_ordering_rls.sql for the RLS side of this.

function generateSessionToken(): string {
  return randomUUID().replace(/-/g, "");
}

function isStale(session: TableSession): boolean {
  const lastActivity = new Date(session.last_activity_at).getTime();
  const cutoff = Date.now() - SESSION_TIMEOUT_HOURS * 60 * 60 * 1000;
  return lastActivity < cutoff;
}

export type ResolvedSession = {
  id: string;
  token: string;
  status: TableSession["status"];
};

export type ResolveSessionResult =
  { success: true; session: ResolvedSession } | { success: false; error: string };

async function closeSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sessionId: string,
): Promise<void> {
  await supabase
    .from("table_sessions")
    .update({ status: "CLOSED", closed_at: new Date().toISOString() })
    .eq("id", sessionId);
}

async function touchSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sessionId: string,
): Promise<void> {
  await supabase
    .from("table_sessions")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", sessionId);
}

export async function resolveTableSession(input: {
  restaurantId: string;
  tableId: string;
  cachedSessionToken: string | null;
}): Promise<ResolveSessionResult> {
  const supabase = await createClient();

  // Fast path: the guest's browser already knows a token. Reuse it unless
  // it's been closed or has gone stale.
  if (input.cachedSessionToken) {
    const { data: cached } = await supabase
      .from("table_sessions")
      .select("*")
      .eq("session_token", input.cachedSessionToken)
      .eq("table_id", input.tableId)
      .maybeSingle<TableSession>();

    if (cached && cached.status !== "CLOSED") {
      if (cached.status !== "ACTIVE" || !isStale(cached)) {
        await touchSession(supabase, cached.id);
        return {
          success: true,
          session: { id: cached.id, token: cached.session_token, status: cached.status },
        };
      }
      await closeSession(supabase, cached.id);
    }
  }

  // No usable cached session - look for another ACTIVE session already
  // open at this table (e.g. a different guest at the same table, or the
  // guest cleared their browser storage).
  const { data: active } = await supabase
    .from("table_sessions")
    .select("*")
    .eq("table_id", input.tableId)
    .eq("status", "ACTIVE")
    .maybeSingle<TableSession>();

  if (active) {
    if (!isStale(active)) {
      await touchSession(supabase, active.id);
      return {
        success: true,
        session: { id: active.id, token: active.session_token, status: active.status },
      };
    }
    await closeSession(supabase, active.id);
  }

  // Nothing usable - open a fresh session. The partial unique index in
  // 0008 makes this race-safe: if another request wins the insert first,
  // fall back to reading whatever they created.
  const token = generateSessionToken();
  const { data: created, error } = await supabase
    .from("table_sessions")
    .insert({ restaurant_id: input.restaurantId, table_id: input.tableId, session_token: token })
    .select("*")
    .single<TableSession>();

  if (error || !created) {
    const { data: winner } = await supabase
      .from("table_sessions")
      .select("*")
      .eq("table_id", input.tableId)
      .eq("status", "ACTIVE")
      .maybeSingle<TableSession>();

    if (winner) {
      return {
        success: true,
        session: { id: winner.id, token: winner.session_token, status: winner.status },
      };
    }
    return { success: false, error: "Could not start a table session. Please try again." };
  }

  return {
    success: true,
    session: { id: created.id, token: created.session_token, status: created.status },
  };
}

export type PlaceOrderItemInput = {
  productId: string;
  quantity: number;
  note: string;
};

export type PlaceOrderInput = {
  restaurantId: string;
  tableId: string;
  tableSessionId: string;
  items: PlaceOrderItemInput[];
};

export type PlaceOrderResult =
  { success: true; orderId: string } | { success: false; error: string };

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  if (input.items.length === 0) {
    return { success: false, error: "Your cart is empty." };
  }

  const supabase = await createClient();

  const { data: session } = await supabase
    .from("table_sessions")
    .select("*")
    .eq("id", input.tableSessionId)
    .eq("table_id", input.tableId)
    .eq("restaurant_id", input.restaurantId)
    .maybeSingle<TableSession>();

  if (!session || session.status !== "ACTIVE") {
    return { success: false, error: "This table session is no longer active." };
  }

  // Never trust client-supplied prices/names - re-fetch current values.
  const productIds = input.items.map((item) => item.productId);
  const { data: products } = await supabase
    .from("menu_products")
    .select("id, name, price")
    .eq("restaurant_id", input.restaurantId)
    .eq("is_available", true)
    .in("id", productIds);

  const productById = new Map((products ?? []).map((product) => [product.id, product]));

  const resolvedItems = input.items
    .map((item) => {
      const product = productById.get(item.productId);
      if (!product || item.quantity < 1) return null;
      return {
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        quantity: item.quantity,
        note: item.note.trim() || null,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (resolvedItems.length === 0) {
    return { success: false, error: "None of the items in your cart are available anymore." };
  }

  const totalPrice = resolvedItems.reduce(
    (sum, item) => sum + item.product_price * item.quantity,
    0,
  );

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      restaurant_id: input.restaurantId,
      table_id: input.tableId,
      table_session_id: input.tableSessionId,
      total_price: totalPrice,
    })
    .select("id")
    .single<{ id: string }>();

  if (orderError || !order) {
    return { success: false, error: orderError?.message ?? "Failed to place order." };
  }

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(resolvedItems.map((item) => ({ ...item, order_id: order.id })));

  if (itemsError) {
    return { success: false, error: itemsError.message };
  }

  await touchSession(supabase, input.tableSessionId);

  return { success: true, orderId: order.id };
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
  restaurantId: string;
  tableId: string;
  tableSessionId: string;
};

type ServiceActionResult = { success: true } | { success: false; error: string };

export async function callWaiter(input: ServiceActionInput): Promise<ServiceActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("service_requests").insert({
    restaurant_id: input.restaurantId,
    table_id: input.tableId,
    table_session_id: input.tableSessionId,
    type: "CALL_WAITER",
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function requestBill(input: ServiceActionInput): Promise<ServiceActionResult> {
  const supabase = await createClient();

  const { error: requestError } = await supabase.from("service_requests").insert({
    restaurant_id: input.restaurantId,
    table_id: input.tableId,
    table_session_id: input.tableSessionId,
    type: "REQUEST_BILL",
  });

  if (requestError) return { success: false, error: requestError.message };

  const { error: updateError } = await supabase
    .from("table_sessions")
    .update({ status: "REQUESTED_BILL" })
    .eq("id", input.tableSessionId)
    .eq("status", "ACTIVE");

  if (updateError) return { success: false, error: updateError.message };

  return { success: true };
}
