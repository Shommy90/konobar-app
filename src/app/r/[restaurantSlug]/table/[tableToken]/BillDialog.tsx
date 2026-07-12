"use client";

import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import { getSessionBill, type BillLine } from "@/app/r/[restaurantSlug]/table/[tableToken]/actions";
import { EmptyState } from "@/components/EmptyState";
import { LoadingOverlay } from "@/components/LoadingOverlay";

// Mounted only while the dialog is open (Dialog discards children when
// closed), so useState(true) below is a correct "loading" value on every
// fresh mount - no effect-driven reset needed.
function BillContent({ tableSessionId }: { tableSessionId: string }) {
  const [bill, setBill] = useState<{ lines: BillLine[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getSessionBill(tableSessionId).then((result) => {
      if (!cancelled) {
        setBill(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tableSessionId]);

  if (loading) {
    return <LoadingOverlay fullSection label="Loading bill..." />;
  }

  if (!bill || bill.lines.length === 0) {
    return <EmptyState icon={<ReceiptLongOutlinedIcon />} title="No orders yet" />;
  }

  return (
    <Stack spacing={1.5}>
      {bill.lines.map((line) => (
        <Stack
          key={`${line.name}-${line.price}`}
          direction="row"
          sx={{ justifyContent: "space-between" }}
        >
          <Typography>
            {line.quantity}x {line.name}
          </Typography>
          <Typography>{(line.price * line.quantity).toFixed(2)}</Typography>
        </Stack>
      ))}
      <Divider />
      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
        <Typography variant="subtitle1">TOTAL</Typography>
        <Typography variant="subtitle1">{bill.total.toFixed(2)}</Typography>
      </Stack>
    </Stack>
  );
}

export function BillDialog({
  open,
  onClose,
  tableSessionId,
}: {
  open: boolean;
  onClose: () => void;
  tableSessionId: string | null;
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Current Bill</DialogTitle>
      <DialogContent>
        {open && tableSessionId && <BillContent tableSessionId={tableSessionId} />}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
