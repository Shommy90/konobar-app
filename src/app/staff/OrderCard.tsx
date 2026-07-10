"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { formatElapsedMinutes } from "@/lib/elapsed";
import type { StaffOrder } from "@/app/staff/data";

type OrderCardProps = {
  order: StaffOrder;
  now: number | null;
  onAccept: (orderId: string) => Promise<void>;
  onCancel: (orderId: string) => Promise<void>;
  onMarkReady: (orderId: string) => Promise<void>;
  onMarkDelivered: (orderId: string) => Promise<void>;
};

export function OrderCard({
  order,
  now,
  onAccept,
  onCancel,
  onMarkReady,
  onMarkDelivered,
}: OrderCardProps) {
  const [busy, setBusy] = useState(false);

  async function handle(action: (id: string) => Promise<void>) {
    setBusy(true);
    await action(order.id);
    setBusy(false);
  }

  const tableLabel = order.restaurant_tables?.name ?? "Table";
  const timeLabel =
    now !== null
      ? new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "--:--";

  return (
    <Card
      variant="outlined"
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
          <Typography variant="body2" color="text.secondary">
            {timeLabel} · {formatElapsedMinutes(order.created_at, now)}
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Order #{order.id.slice(0, 8).toUpperCase()}
        </Typography>

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

        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          {order.status === "NEW" && (
            <>
              <Button
                fullWidth
                size="large"
                variant="contained"
                color="success"
                disabled={busy}
                onClick={() => handle(onAccept)}
              >
                Accept Order
              </Button>
              <Button
                fullWidth
                size="large"
                variant="outlined"
                color="error"
                disabled={busy}
                onClick={() => handle(onCancel)}
              >
                Cancel
              </Button>
            </>
          )}
          {order.status === "ACCEPTED" && (
            <Button
              fullWidth
              size="large"
              variant="contained"
              disabled={busy}
              onClick={() => handle(onMarkReady)}
            >
              Mark Ready
            </Button>
          )}
          {order.status === "READY" && (
            <Button
              fullWidth
              size="large"
              variant="contained"
              color="success"
              disabled={busy}
              onClick={() => handle(onMarkDelivered)}
            >
              Mark Delivered
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
