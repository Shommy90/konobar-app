"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { setCategoryActive } from "@/app/owner/menu/actions";
import { useServerAction } from "@/lib/useServerAction";
import { useToast } from "@/lib/toast/ToastProvider";

export function CategoryActiveToggleButton({
  categoryId,
  isActive,
}: {
  categoryId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { run, loading, error } = useServerAction(setCategoryActive);

  async function handleConfirmed() {
    const ok = await run(categoryId, !isActive);
    if (ok) {
      setConfirmOpen(false);
      router.refresh();
      toast.success(isActive ? "Category deactivated." : "Category activated.");
    }
  }

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        color={isActive ? "error" : "success"}
        disabled={loading}
        onClick={() => (isActive ? setConfirmOpen(true) : handleConfirmed())}
      >
        {isActive ? "Deactivate" : "Activate"}
      </Button>
      {error && (
        <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
          {error}
        </Typography>
      )}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmed}
        title="Deactivate category?"
        description="Guests will immediately stop seeing this category and all of its products on the menu."
        confirmLabel="Deactivate"
        pending={loading}
      />
    </>
  );
}
