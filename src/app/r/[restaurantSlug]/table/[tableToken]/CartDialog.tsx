"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import type { CartItem } from "@/lib/guestCart";

type CartDialogProps = {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onRemove: (productId: string) => void;
  onNoteChange: (productId: string, note: string) => void;
  onPlaceOrder: () => void;
  placing: boolean;
  disabled: boolean;
  error: string | null;
};

export function CartDialog({
  open,
  onClose,
  items,
  onIncrement,
  onDecrement,
  onRemove,
  onNoteChange,
  onPlaceOrder,
  placing,
  disabled,
  error,
}: CartDialogProps) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Your Cart</DialogTitle>
      <DialogContent>
        {items.length === 0 ? (
          <Typography color="text.secondary">Your cart is empty.</Typography>
        ) : (
          <Stack spacing={2} divider={<Divider />}>
            {items.map((item) => (
              <Box key={item.productId}>
                <Stack
                  direction="row"
                  sx={{ justifyContent: "space-between", alignItems: "center" }}
                >
                  <Typography variant="subtitle2">{item.name}</Typography>
                  <Typography variant="subtitle2">
                    {(item.price * item.quantity).toFixed(2)}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 0.5 }}>
                  <IconButton size="small" onClick={() => onDecrement(item.productId)}>
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography sx={{ minWidth: 20, textAlign: "center" }}>
                    {item.quantity}
                  </Typography>
                  <IconButton size="small" onClick={() => onIncrement(item.productId)}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                  <Button size="small" color="error" onClick={() => onRemove(item.productId)}>
                    Remove
                  </Button>
                </Stack>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Note (e.g. no ice)"
                  value={item.note}
                  onChange={(event) => onNoteChange(item.productId, event.target.value)}
                  sx={{ mt: 1 }}
                />
              </Box>
            ))}
          </Stack>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ flexDirection: "column", alignItems: "stretch", px: 3, pb: 2 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", mb: 1 }}>
          <Typography variant="subtitle1">Total</Typography>
          <Typography variant="subtitle1">{total.toFixed(2)}</Typography>
        </Stack>
        <Button
          variant="contained"
          disabled={items.length === 0 || placing || disabled}
          onClick={onPlaceOrder}
        >
          {placing ? "Placing order..." : "Place Order"}
        </Button>
        <Button onClick={onClose} sx={{ mt: 1 }}>
          Continue browsing
        </Button>
      </DialogActions>
    </Dialog>
  );
}
