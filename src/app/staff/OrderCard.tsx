"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { OrderStatusChip } from "@/components/OrderStatusChip";
import { formatElapsedMinutes } from "@/lib/elapsed";
import type { StaffOrder } from "@/app/staff/data";

type OrderCardProps = {
  order: StaffOrder;
  now: number | null;
  onAccept: (orderId: string) => Promise<void>;
  onCancel: (orderId: string) => Promise<void>;
};

export function OrderCard({ order, now, onAccept, onCancel }: OrderCardProps) {
  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  async function handleAccept() {
    setBusy(true);
    await onAccept(order.id);
    setBusy(false);
  }

  async function handleConfirmCancel() {
    setBusy(true);
    await onCancel(order.id);
    setBusy(false);
    setCancelOpen(false);
  }

  const tableLabel = order.restaurant_tables?.name ?? "Table";
  const timeLabel =
    now !== null
      ? new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "--:--";

  return (
    <Card
      sx={{
        borderColor: order.status === "NEW" ? "warning.main" : undefined,
        borderWidth: order.status === "NEW" ? 2 : 1,
      }}
    >
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {tableLabel.toUpperCase()}
          </Typography>
          <OrderStatusChip status={order.status} size="medium" />
        </Stack>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="caption" color="text.secondary">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {timeLabel} · {formatElapsedMinutes(order.created_at, now)}
          </Typography>
        </Stack>

        <Divider sx={{ my: 1 }} />

        <Stack spacing={0.5}>
          {order.order_items.map((item) => (
            <Box key={item.id}>
              <Typography variant="body1">
                {item.quantity}x {item.product_name}
              </Typography>
              {item.note && (
                <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                  note: {item.note}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>

        <Divider sx={{ my: 1 }} />

        <Typography variant="h6">Total: {order.total_price.toFixed(2)}</Typography>

        {order.status === "NEW" && (
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button
              fullWidth
              size="large"
              variant="contained"
              color="success"
              startIcon={<CheckCircleOutlinedIcon />}
              disabled={busy}
              onClick={handleAccept}
            >
              Accept Order
            </Button>
            <Button
              fullWidth
              size="large"
              variant="outlined"
              color="error"
              startIcon={<CloseOutlinedIcon />}
              disabled={busy}
              onClick={() => setCancelOpen(true)}
            >
              Cancel
            </Button>
          </Stack>
        )}
      </CardContent>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel this order?"
        description={`Cancel the order for ${tableLabel}? The guest will need to place it again if this was a mistake.`}
        confirmLabel="Cancel Order"
        pending={busy}
      />
    </Card>
  );
}
