"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
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
  const tableLabel = request.restaurant_tables?.name ?? "Table";

  async function handleDismiss() {
    setBusy(true);
    await onDismiss(request.id);
    setBusy(false);
  }

  async function handleClose() {
    setBusy(true);
    await onCloseTable(request.table_session_id);
    setBusy(false);
  }

  if (request.type === "CALL_WAITER") {
    return (
      <Card variant="outlined" sx={{ borderColor: "info.main", borderWidth: 2 }}>
        <CardContent>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">{tableLabel.toUpperCase()} needs a waiter</Typography>
            <Button variant="contained" size="large" disabled={busy} onClick={handleDismiss}>
              Done
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ borderColor: "warning.main", borderWidth: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {tableLabel.toUpperCase()} requests the bill
        </Typography>
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
            onClick={handleClose}
          >
            Paid - Close Table
          </Button>
          <Button fullWidth size="large" variant="outlined" disabled={busy} onClick={handleDismiss}>
            Not Done
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
