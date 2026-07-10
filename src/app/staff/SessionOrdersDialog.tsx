"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { viewSessionOrders } from "@/app/staff/actions";
import type { StaffOrder } from "@/app/staff/data";

// Mounted only while the dialog is open, so useState(true) below is a
// correct "loading" value on every fresh mount - no effect-driven reset.
function SessionOrdersContent({ sessionId }: { sessionId: string }) {
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    viewSessionOrders(sessionId).then((result) => {
      if (!cancelled) {
        setOrders(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (loading) {
    return <Typography color="text.secondary">Loading...</Typography>;
  }
  if (orders.length === 0) {
    return <Typography color="text.secondary">No orders yet.</Typography>;
  }

  return (
    <Stack spacing={2} divider={<Divider />}>
      {orders.map((order) => (
        <Box key={order.id}>
          <Stack direction="row" sx={{ justifyContent: "space-between" }}>
            <Typography variant="subtitle2">{order.status}</Typography>
            <Typography variant="subtitle2">{order.total_price.toFixed(2)}</Typography>
          </Stack>
          {order.order_items.map((item) => (
            <Typography key={item.id} variant="body2" color="text.secondary">
              {item.quantity}x {item.product_name}
              {item.note ? ` (${item.note})` : ""}
            </Typography>
          ))}
        </Box>
      ))}
    </Stack>
  );
}

export function SessionOrdersDialog({
  open,
  onClose,
  sessionId,
}: {
  open: boolean;
  onClose: () => void;
  sessionId: string | null;
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Table Orders</DialogTitle>
      <DialogContent>
        {open && sessionId && <SessionOrdersContent sessionId={sessionId} />}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
