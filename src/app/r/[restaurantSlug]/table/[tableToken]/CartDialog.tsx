"use client";

import { useMemo } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
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
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import RemoveIcon from "@mui/icons-material/Remove";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import { EmptyState } from "@/components/EmptyState";
import type { CartItem } from "@/lib/guestCart";
import { getProductImageUrl } from "@/lib/productImage";
import type { MenuProduct } from "@/types/database";

type CartDialogProps = {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  products: MenuProduct[];
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
  products,
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

  const imageByProductId = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const product of products) map.set(product.id, getProductImageUrl(product.image_path));
    return map;
  }, [products]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Your Cart</DialogTitle>
      <DialogContent>
        {items.length === 0 ? (
          <EmptyState icon={<ShoppingCartOutlinedIcon />} title="Your cart is empty" />
        ) : (
          <Stack spacing={2} divider={<Divider />}>
            {items.map((item) => {
              const imageUrl = imageByProductId.get(item.productId) ?? null;
              return (
                <Box key={item.productId}>
                  <Stack direction="row" spacing={1.5}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        flexShrink: 0,
                        borderRadius: 1.5,
                        overflow: "hidden",
                        bgcolor: "action.hover",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl}
                          alt={item.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <ImageOutlinedIcon color="disabled" fontSize="small" />
                      )}
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Stack
                        direction="row"
                        sx={{ justifyContent: "space-between", alignItems: "center" }}
                      >
                        <Typography variant="subtitle2">{item.name}</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {(item.price * item.quantity).toFixed(2)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => onDecrement(item.productId)}
                          aria-label={`Remove one ${item.name}`}
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Typography sx={{ minWidth: 20, textAlign: "center" }}>
                          {item.quantity}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => onIncrement(item.productId)}
                          aria-label={`Add one more ${item.name}`}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => onRemove(item.productId)}
                          sx={{ ml: "auto" }}
                        >
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
                  </Stack>
                </Box>
              );
            })}
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
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {total.toFixed(2)}
          </Typography>
        </Stack>
        <Button
          variant="contained"
          size="large"
          disabled={items.length === 0 || placing || disabled}
          onClick={onPlaceOrder}
          startIcon={placing ? <CircularProgress size={16} color="inherit" /> : undefined}
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
