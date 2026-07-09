"use client";

import Link from "next/link";
import Button from "@mui/material/Button";

export function BackToDashboardButton() {
  return (
    <Button component={Link} href="/super-admin" sx={{ mb: 2 }}>
      ← Back to dashboard
    </Button>
  );
}
