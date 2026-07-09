"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getCurrentProfile, type CurrentUser } from "@/lib/auth/getCurrentProfile";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { success: true } | { success: false; error: string };

async function requireOwner(): Promise<CurrentUser & { profile: { restaurant_id: string } }> {
  const current = await getCurrentProfile();
  if (!current || current.profile.role !== "OWNER" || !current.profile.restaurant_id) {
    throw new Error("Unauthorized");
  }
  return current as CurrentUser & { profile: { restaurant_id: string } };
}

function generateTableToken(): string {
  return randomUUID().replace(/-/g, "");
}

export type CreateTableInput = {
  name: string;
  number: string;
};

export async function createTable(input: CreateTableInput): Promise<ActionResult> {
  const current = await requireOwner();

  const name = input.name.trim();
  if (!name) {
    return { success: false, error: "Table name is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("restaurant_tables").insert({
    restaurant_id: current.profile.restaurant_id,
    name,
    number: input.number ? Number(input.number) : null,
    table_token: generateTableToken(),
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/owner");
  revalidatePath("/owner/tables");
  return { success: true };
}

export type UpdateTableInput = {
  tableId: string;
  name: string;
  number: string;
};

export async function updateTable(input: UpdateTableInput): Promise<ActionResult> {
  const current = await requireOwner();

  const name = input.name.trim();
  if (!name) {
    return { success: false, error: "Table name is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurant_tables")
    .update({ name, number: input.number ? Number(input.number) : null })
    .eq("id", input.tableId)
    .eq("restaurant_id", current.profile.restaurant_id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/owner/tables");
  return { success: true };
}

export async function setTableActive(tableId: string, isActive: boolean): Promise<ActionResult> {
  const current = await requireOwner();

  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurant_tables")
    .update({ is_active: isActive })
    .eq("id", tableId)
    .eq("restaurant_id", current.profile.restaurant_id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/owner");
  revalidatePath("/owner/tables");
  return { success: true };
}

export async function deleteTable(tableId: string): Promise<ActionResult> {
  const current = await requireOwner();

  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurant_tables")
    .delete()
    .eq("id", tableId)
    .eq("restaurant_id", current.profile.restaurant_id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/owner");
  revalidatePath("/owner/tables");
  return { success: true };
}
