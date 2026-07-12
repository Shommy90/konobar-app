"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { deleteProduct } from "@/app/owner/menu/actions";
import { useServerAction } from "@/lib/useServerAction";
import { useToast } from "@/lib/toast/ToastProvider";

export function DeleteProductButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { run, loading, error } = useServerAction(deleteProduct);

  async function handleConfirm() {
    const ok = await run(productId);
    if (ok) {
      setConfirmOpen(false);
      router.refresh();
      toast.success("Product deleted.");
    }
  }

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        color="error"
        disabled={loading}
        onClick={() => setConfirmOpen(true)}
      >
        Delete
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
        title="Delete product?"
        description={`Delete "${productName}"? This cannot be undone.`}
        confirmLabel="Delete"
        pending={loading}
      />
    </>
  );
}
