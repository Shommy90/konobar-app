"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { setRestaurantStatus } from "@/app/super-admin/actions";
import type { RestaurantStatus } from "@/types/database";

export function StatusToggleButton({
  restaurantId,
  status,
}: {
  restaurantId: string;
  status: RestaurantStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isDisabled = status === "DISABLED";
  const nextStatus: RestaurantStatus = isDisabled ? "ACTIVE" : "DISABLED";

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await setRestaurantStatus(restaurantId, nextStatus);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        color={isDisabled ? "success" : "error"}
        disabled={isPending}
        onClick={handleClick}
      >
        {isDisabled ? "Activate" : "Disable"}
      </Button>
      {error && (
        <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
          {error}
        </Typography>
      )}
    </>
  );
}
