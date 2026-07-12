"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { formatElapsedMinutes, formatRemainingMinutes } from "@/lib/elapsed";
import type { StaffActiveSession } from "@/app/staff/data";

type ActiveTableCardProps = {
  session: StaffActiveSession;
  now: number | null;
  onViewOrders: (sessionId: string) => void;
  onCloseTable: (sessionId: string) => Promise<void>;
};

export function ActiveTableCard({
  session,
  now,
  onViewOrders,
  onCloseTable,
}: ActiveTableCardProps) {
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const tableLabel = session.restaurant_tables?.name ?? "Table";

  async function handleConfirmClose() {
    setBusy(true);
    await onCloseTable(session.id);
    setBusy(false);
    setConfirmOpen(false);
  }

  return (
    <Card>
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {tableLabel.toUpperCase()}
          </Typography>
          {session.status === "REQUESTED_BILL" && (
            <Chip size="small" color="warning" label="Bill requested" />
          )}
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Active {formatElapsedMinutes(session.opened_at, now)}
          {now !== null &&
            session.expires_at &&
            ` · Expires in ${formatRemainingMinutes(session.expires_at, now)}`}
        </Typography>
        <Typography variant="body1" sx={{ mt: 0.5 }}>
          Total: {session.total.toFixed(2)}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <Button size="small" variant="outlined" onClick={() => onViewOrders(session.id)}>
            View Orders
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            disabled={busy}
            onClick={() => setConfirmOpen(true)}
          >
            Close Table
          </Button>
        </Stack>
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmClose}
        title="Close this table?"
        description={`Close ${tableLabel}? This ends the guest's ordering session immediately.`}
        confirmLabel="Close Table"
        pending={busy}
      />
    </Card>
  );
}
