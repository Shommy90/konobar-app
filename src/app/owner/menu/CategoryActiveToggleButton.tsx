"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { setCategoryActive } from "@/app/owner/menu/actions";

export function CategoryActiveToggleButton({
  categoryId,
  isActive,
}: {
  categoryId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const result = await setCategoryActive(categoryId, !isActive);
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
        color={isActive ? "error" : "success"}
        disabled={loading}
        onClick={handleClick}
      >
        {isActive ? "Deactivate" : "Activate"}
      </Button>
      {error && (
        <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
          {error}
        </Typography>
      )}
    </>
  );
}
