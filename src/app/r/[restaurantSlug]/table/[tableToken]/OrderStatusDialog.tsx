"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";
import { getSessionOrders } from "@/app/r/[restaurantSlug]/table/[tableToken]/actions";
import { EmptyState } from "@/components/EmptyState";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { OrderStatusChip } from "@/components/OrderStatusChip";
import type { Order } from "@/types/database";

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
      {loading ? (
        <LoadingOverlay fullSection label="Loading orders..." />
      ) : orders.length === 0 ? (
        <EmptyState icon={<ListAltOutlinedIcon />} title="No orders yet" />
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
              <OrderStatusChip status={order.status} />
            </Stack>
          ))}
        </Stack>
      )}
      <Button
        onClick={handleRefresh}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        sx={{ mt: 2 }}
      >
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
          <EmptyState icon={<ListAltOutlinedIcon />} title="No orders yet" />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
