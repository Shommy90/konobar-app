import type { ReactElement } from "react";
import Chip, { type ChipProps } from "@mui/material/Chip";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ScheduleIcon from "@mui/icons-material/Schedule";
import type { OrderStatus } from "@/types/database";

type StatusMeta = { label: string; color: ChipProps["color"]; icon: ReactElement };

const STATUS_META: Record<OrderStatus, StatusMeta> = {
  NEW: { label: "New", color: "warning", icon: <ScheduleIcon /> },
  ACCEPTED: { label: "Accepted", color: "info", icon: <CheckCircleIcon /> },
  READY: { label: "Ready", color: "success", icon: <LocalShippingIcon /> },
  DELIVERED: { label: "Delivered", color: "default", icon: <DoneAllIcon /> },
  CANCELLED: { label: "Cancelled", color: "error", icon: <CancelIcon /> },
};

/** Single source of truth for order-status colors/icons - shared by the staff and guest UIs. */
export function OrderStatusChip({
  status,
  size = "small",
}: {
  status: OrderStatus;
  size?: "small" | "medium";
}) {
  const meta = STATUS_META[status];
  return <Chip size={size} color={meta.color} icon={meta.icon} label={meta.label} />;
}
