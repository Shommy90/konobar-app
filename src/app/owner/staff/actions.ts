"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth/requireOwner";
import { createStaffAccount } from "@/lib/staffAccount";

type ActionResult = { success: true } | { success: false; error: string };

export type CreateStaffInput = {
  nickname: string;
  password: string;
  fullName: string;
};

export async function createStaff(input: CreateStaffInput): Promise<ActionResult> {
  const current = await requireOwner();

  const result = await createStaffAccount({
    ...input,
    role: "STAFF",
    restaurantId: current.profile.restaurant_id,
  });

  if (!result.success) {
    return result;
  }

  revalidatePath("/owner/staff");
  return { success: true };
}
