"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import RoomServiceOutlinedIcon from "@mui/icons-material/RoomServiceOutlined";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { StaffServiceRequest } from "@/app/staff/data";

type ServiceRequestCardProps = {
  request: StaffServiceRequest;
  sessionTotal: number | undefined;
  onDismiss: (requestId: string) => Promise<void>;
  onCloseTable: (sessionId: string) => Promise<void>;
};

export function ServiceRequestCard({
  request,
  sessionTotal,
  onDismiss,
  onCloseTable,
}: ServiceRequestCardProps) {
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const tableLabel = request.restaurant_tables?.name ?? "Table";

  async function handleDismiss() {
    setBusy(true);
    await onDismiss(request.id);
    setBusy(false);
  }

  async function handleConfirmClose() {
    setBusy(true);
    await onCloseTable(request.table_session_id);
    setBusy(false);
    setConfirmOpen(false);
  }

  if (request.type === "CALL_WAITER") {
    return (
      <Card sx={{ borderColor: "info.main", borderWidth: 2 }}>
        <CardContent>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <RoomServiceOutlinedIcon color="info" />
              <Typography variant="h6">{tableLabel.toUpperCase()} needs a waiter</Typography>
            </Stack>
            <Button variant="contained" size="large" disabled={busy} onClick={handleDismiss}>
              Done
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ borderColor: "warning.main", borderWidth: 2 }}>
      <CardContent>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
          <PaidOutlinedIcon color="warning" />
          <Typography variant="h6">{tableLabel.toUpperCase()} requests the bill</Typography>
        </Stack>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Current bill: {sessionTotal !== undefined ? sessionTotal.toFixed(2) : "—"}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            fullWidth
            size="large"
            variant="contained"
            color="success"
            disabled={busy}
            onClick={() => setConfirmOpen(true)}
          >
            Paid - Close Table
          </Button>
          <Button fullWidth size="large" variant="outlined" disabled={busy} onClick={handleDismiss}>
            Not Done
          </Button>
        </Stack>
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmClose}
        title="Close this table?"
        description={`Mark ${tableLabel} as paid and close the table? This immediately ends the guest's ordering session.`}
        confirmLabel="Close Table"
        confirmColor="primary"
        pending={busy}
      />
    </Card>
  );
}
