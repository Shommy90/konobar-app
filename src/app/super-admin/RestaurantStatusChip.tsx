import Chip from "@mui/material/Chip";
import type { RestaurantStatus } from "@/types/database";

const COLOR_BY_STATUS: Record<RestaurantStatus, "success" | "warning" | "default"> = {
  ACTIVE: "success",
  TRIAL: "warning",
  DISABLED: "default",
};

export function RestaurantStatusChip({ status }: { status: RestaurantStatus }) {
  return <Chip size="small" label={status} color={COLOR_BY_STATUS[status]} />;
}
