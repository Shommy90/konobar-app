"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getSessionOrders } from "@/app/r/[restaurantSlug]/table/[tableToken]/actions";
import type { Order, OrderStatus } from "@/types/database";

const STATUS_LABEL: Record<OrderStatus, string> = {
  NEW: "New",
  ACCEPTED: "Accepted",
  READY: "Ready",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_COLOR: Record<OrderStatus, "default" | "primary" | "success" | "error"> = {
  NEW: "primary",
  ACCEPTED: "primary",
  READY: "success",
  DELIVERED: "default",
  CANCELLED: "error",
};

// Mounted only while the dialog is open, so useState(true) below is a
// correct "loading" value on every fresh mount - no effect-driven reset.
function OrderStatusContent({ tableSessionId }: { tableSessionId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getSessionOrders(tableSessionId).then((result) => {
      if (!cancelled) {
        setOrders(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tableSessionId]);

  function handleRefresh() {
    setLoading(true);
    getSessionOrders(tableSessionId).then((result) => {
      setOrders(result);
      setLoading(false);
    });
  }

  return (
    <>
      {orders.length === 0 ? (
        <Typography color="text.secondary">{loading ? "Loading..." : "No orders yet."}</Typography>
      ) : (
        <Stack spacing={2} divider={<Divider />}>
          {orders.map((order) => (
            <Stack
              key={order.id}
              direction="row"
              sx={{ justifyContent: "space-between", alignItems: "center" }}
            >
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {new Date(order.created_at).toLocaleTimeString()}
                </Typography>
                <Typography variant="subtitle2">{order.total_price.toFixed(2)}</Typography>
              </Box>
              <Chip
                size="small"
                label={STATUS_LABEL[order.status]}
                color={STATUS_COLOR[order.status]}
              />
            </Stack>
          ))}
        </Stack>
      )}
      <Button onClick={handleRefresh} disabled={loading} sx={{ mt: 2 }}>
        Refresh
      </Button>
    </>
  );
}

export function OrderStatusDialog({
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
      <DialogTitle>Order Status</DialogTitle>
      <DialogContent>
        {open && tableSessionId ? (
          <OrderStatusContent tableSessionId={tableSessionId} />
        ) : (
          <Typography color="text.secondary">No orders yet.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
