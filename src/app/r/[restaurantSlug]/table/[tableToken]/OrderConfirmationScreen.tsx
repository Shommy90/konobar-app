import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import { OrderStatusChip } from "@/components/OrderStatusChip";
import type { CartItem } from "@/lib/guestCart";

type OrderConfirmationScreenProps = {
  restaurantName: string;
  tableName: string;
  orderId: string;
  items: CartItem[];
  total: number;
  onContinue: () => void;
};

export function OrderConfirmationScreen({
  restaurantName,
  tableName,
  orderId,
  items,
  total,
  onContinue,
}: OrderConfirmationScreenProps) {
  const orderNumber = orderId.slice(0, 8).toUpperCase();

  return (
    <Container maxWidth="sm" sx={{ py: 6, textAlign: "center" }}>
      <CheckCircleOutlineIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
      <Typography variant="h5" component="h1" gutterBottom>
        Order sent!
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
        {restaurantName} · {tableName}
      </Typography>
      <Stack
        direction="row"
        spacing={1}
        sx={{ justifyContent: "center", alignItems: "center", mb: 3 }}
      >
        <Typography variant="subtitle1">Order #{orderNumber}</Typography>
        <OrderStatusChip status="NEW" />
      </Stack>

      <Box sx={{ textAlign: "left", border: 1, borderColor: "divider", borderRadius: 2, p: 2, mb: 3 }}>
        <Stack spacing={1} divider={<Divider />}>
          {items.map((item) => (
            <Stack key={item.productId} direction="row" sx={{ justifyContent: "space-between" }}>
              <Typography variant="body2">
                {item.quantity}x {item.name}
              </Typography>
              <Typography variant="body2">{(item.price * item.quantity).toFixed(2)}</Typography>
            </Stack>
          ))}
        </Stack>
        <Divider sx={{ my: 1.5 }} />
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="subtitle1">Total</Typography>
          <Typography variant="subtitle1">{total.toFixed(2)}</Typography>
        </Stack>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        The kitchen has received your order. You can keep browsing and order more anytime.
      </Typography>

      <Button variant="contained" size="large" fullWidth onClick={onContinue}>
        Continue ordering
      </Button>
    </Container>
  );
}
