"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

type ProductImagePickerProps = {
  previewUrl: string | null;
  onFileChange: (file: File) => void;
  onRemove?: () => void;
  error?: string | null;
};

export function ProductImagePicker({
  previewUrl,
  onFileChange,
  onRemove,
  error,
}: ProductImagePickerProps) {
  return (
    <Stack spacing={1}>
      <Typography variant="body2">Product image</Typography>
      <Box
        sx={{
          width: 120,
          height: 120,
          borderRadius: 1,
          overflow: "hidden",
          bgcolor: "action.hover",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Product preview"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <ImageOutlinedIcon color="disabled" fontSize="large" />
        )}
      </Box>
      <Stack direction="row" spacing={1}>
        <Button component="label" size="small" variant="outlined">
          {previewUrl ? "Replace Image" : "Choose Image"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onFileChange(file);
              event.target.value = "";
            }}
          />
        </Button>
        {onRemove && previewUrl && (
          <Button size="small" variant="outlined" color="error" onClick={onRemove}>
            Remove Image
          </Button>
        )}
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
    </Stack>
  );
}
