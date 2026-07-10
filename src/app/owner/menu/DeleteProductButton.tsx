"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { deleteProduct } from "@/app/owner/menu/actions";

export function DeleteProductButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!window.confirm(`Delete "${productName}"? This cannot be undone.`)) {
      return;
    }
    setLoading(true);
    setError(null);
    const result = await deleteProduct(productId);
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
        color="error"
        disabled={loading}
        onClick={handleClick}
      >
        Delete
      </Button>
      {error && (
        <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
          {error}
        </Typography>
      )}
    </>
  );
}
