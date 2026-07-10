"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { setProductAvailable } from "@/app/owner/menu/actions";

export function ProductAvailableToggleButton({
  productId,
  isAvailable,
}: {
  productId: string;
  isAvailable: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const result = await setProductAvailable(productId, !isAvailable);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        color={isAvailable ? "error" : "success"}
        disabled={loading}
        onClick={handleClick}
      >
        {isAvailable ? "Mark unavailable" : "Mark available"}
      </Button>
      {error && (
        <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
          {error}
        </Typography>
      )}
    </>
  );
}
