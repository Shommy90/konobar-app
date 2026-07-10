"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import { getProductImageUrl } from "@/lib/productImage";
import type { MenuProduct } from "@/types/database";

type ProductCardProps = {
  product: MenuProduct;
  quantityInCart: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled: boolean;
};

export function ProductCard({
  product,
  quantityInCart,
  onAdd,
  onIncrement,
  onDecrement,
  disabled,
}: ProductCardProps) {
  const imageUrl = getProductImageUrl(product.image_path);

  return (
    <Box sx={{ py: 1.5 }}>
      <Stack direction="row" spacing={1.5}>
        <Box
          sx={{
            width: 64,
            height: 64,
            flexShrink: 0,
            borderRadius: 1,
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
              alt={product.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <ImageOutlinedIcon color="disabled" />
          )}
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Typography variant="subtitle1">{product.name}</Typography>
              {product.is_popular && <Chip size="small" color="warning" label="Popular" />}
            </Stack>
            <Typography variant="subtitle1" sx={{ whiteSpace: "nowrap", ml: 2 }}>
              {product.price.toFixed(2)}
            </Typography>
          </Stack>
          {product.description && (
            <Typography variant="body2" color="text.secondary">
              {product.description}
            </Typography>
          )}
          <Box sx={{ mt: 1 }}>
            {quantityInCart === 0 ? (
              <Button size="small" variant="outlined" onClick={onAdd} disabled={disabled}>
                Add
              </Button>
            ) : (
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <IconButton size="small" onClick={onDecrement} disabled={disabled}>
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography sx={{ minWidth: 20, textAlign: "center" }}>{quantityInCart}</Typography>
                <IconButton size="small" onClick={onIncrement} disabled={disabled}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Stack>
            )}
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
