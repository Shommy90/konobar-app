"use client";

import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { setProductAvailable } from "@/app/owner/menu/actions";
import { useServerAction } from "@/lib/useServerAction";
import { useToast } from "@/lib/toast/ToastProvider";

export function ProductAvailableToggleButton({
  productId,
  isAvailable,
}: {
  productId: string;
  isAvailable: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const { run, loading, error } = useServerAction(setProductAvailable);

  async function handleClick() {
    const ok = await run(productId, !isAvailable);
    if (ok) {
      router.refresh();
      toast.success(isAvailable ? "Product marked unavailable." : "Product marked available.");
    }
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
