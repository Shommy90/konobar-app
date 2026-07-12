"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import RemoveIcon from "@mui/icons-material/Remove";
import StarIcon from "@mui/icons-material/Star";
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
  const [loaded, setLoaded] = useState(false);

  return (
    <Box sx={{ py: 1.5 }}>
      <Stack direction="row" spacing={1.5}>
        <Box
          sx={{
            width: 72,
            height: 72,
            flexShrink: 0,
            borderRadius: 2,
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
              onLoad={() => setLoaded(true)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: loaded ? 1 : 0,
                transition: "opacity 200ms ease",
              }}
            />
          ) : (
            <ImageOutlinedIcon color="disabled" />
          )}
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {product.name}
              </Typography>
              {product.is_popular && (
                <Chip
                  size="small"
                  color="warning"
                  icon={<StarIcon fontSize="small" />}
                  label="Popular"
                />
              )}
            </Stack>
            <Typography
              variant="subtitle1"
              sx={{ whiteSpace: "nowrap", ml: 2, fontWeight: 700, color: "primary.main" }}
            >
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
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: "center",
                  display: "inline-flex",
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 999,
                  px: 0.5,
                }}
              >
                <IconButton
                  size="small"
                  onClick={onDecrement}
                  disabled={disabled}
                  aria-label={`Remove one ${product.name}`}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography sx={{ minWidth: 20, textAlign: "center" }}>{quantityInCart}</Typography>
                <IconButton
                  size="small"
                  onClick={onIncrement}
                  disabled={disabled}
                  aria-label={`Add one more ${product.name}`}
                >
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
