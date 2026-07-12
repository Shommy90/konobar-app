"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { setRestaurantStatus } from "@/app/super-admin/actions";
import { useToast } from "@/lib/toast/ToastProvider";
import type { RestaurantStatus } from "@/types/database";

export function StatusToggleButton({
  restaurantId,
  status,
}: {
  restaurantId: string;
  status: RestaurantStatus;
}) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isDisabled = status === "DISABLED";
  const nextStatus: RestaurantStatus = isDisabled ? "ACTIVE" : "DISABLED";

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await setRestaurantStatus(restaurantId, nextStatus);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setConfirmOpen(false);
      router.refresh();
      toast.success(isDisabled ? "Restaurant activated." : "Restaurant disabled.");
    });
  }

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        color={isDisabled ? "success" : "error"}
        disabled={isPending}
        onClick={() => (isDisabled ? handleConfirm() : setConfirmOpen(true))}
      >
        {isDisabled ? "Activate" : "Disable"}
      </Button>
      {error && (
        <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
          {error}
        </Typography>
      )}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        title="Disable restaurant?"
        description="This restaurant's guest ordering page will stop working immediately. Staff and owner logins are unaffected."
        confirmLabel="Disable"
        confirmColor="error"
        pending={isPending}
      />
    </>
  );
}
