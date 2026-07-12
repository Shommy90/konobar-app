"use server";

import { revalidatePath } from "next/cache";
import { requireStaffOrOwner } from "@/lib/auth/requireStaffOrOwner";
import { createClient } from "@/lib/supabase/server";
import {
  getSessionOrderHistory,
  getStaffDashboardData,
  type StaffDashboardData,
  type StaffOrder,
} from "@/app/staff/data";

type ActionResult = { success: true } | { success: false; error: string };

export async function refreshStaffDashboard(): Promise<StaffDashboardData> {
  const current = await requireStaffOrOwner();
  return getStaffDashboardData(current.profile.restaurant_id);
}

export async function viewSessionOrders(sessionId: string): Promise<StaffOrder[]> {
  await requireStaffOrOwner();
  return getSessionOrderHistory(sessionId);
}

export async function acceptOrder(orderId: string): Promise<ActionResult> {
  const current = await requireStaffOrOwner();
  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({ status: "ACCEPTED" })
    .eq("id", orderId)
    .eq("restaurant_id", current.profile.restaurant_id)
    .eq("status", "NEW");

  if (error) return { success: false, error: error.message };
  revalidatePath("/staff");
  return { success: true };
}

export async function cancelOrder(orderId: string): Promise<ActionResult> {
  const current = await requireStaffOrOwner();
  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({ status: "CANCELLED" })
    .eq("id", orderId)
    .eq("restaurant_id", current.profile.restaurant_id)
    .eq("status", "NEW");

  if (error) return { success: false, error: error.message };
  revalidatePath("/staff");
  return { success: true };
}

export async function dismissServiceRequest(requestId: string): Promise<ActionResult> {
  const current = await requireStaffOrOwner();
  const supabase = await createClient();

  const { error } = await supabase
    .from("service_requests")
    .update({ status: "DONE" })
    .eq("id", requestId)
    .eq("restaurant_id", current.profile.restaurant_id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/staff");
  return { success: true };
}

export async function closeTableSession(sessionId: string): Promise<ActionResult> {
  const current = await requireStaffOrOwner();
  const supabase = await createClient();

  const { error: sessionError } = await supabase
    .from("table_sessions")
    .update({
      status: "CLOSED",
      close_reason: "CLOSED_BY_STAFF",
      closed_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("restaurant_id", current.profile.restaurant_id);

  if (sessionError) return { success: false, error: sessionError.message };

  // Best-effort cleanup - the session is already closed either way.
  await supabase
    .from("service_requests")
    .update({ status: "DONE" })
    .eq("table_session_id", sessionId)
    .eq("restaurant_id", current.profile.restaurant_id)
    .eq("status", "NEW");

  revalidatePath("/staff");
  return { success: true };
}
