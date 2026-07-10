"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { createProduct } from "@/app/owner/menu/actions";
import {
  deleteProductImage,
  resizeImageToWebp,
  uploadProductImage,
  validateImageFile,
} from "@/lib/imageUpload";
import { buildProductImagePath } from "@/lib/productImage";
import { submitOnEnter } from "@/lib/submitOnEnter";
import { ProductImagePicker } from "@/app/owner/menu/ProductImagePicker";

type CategoryOption = { id: string; name: string };

const EMPTY_FORM = {
  categoryId: "",
  name: "",
  description: "",
  price: "",
  isPopular: false,
  sortOrder: "",
};

export function CreateProductDialog({
  restaurantId,
  categories,
}: {
  restaurantId: string;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const previewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileChange(file: File) {
    const validationError = validateImageFile(file);
    if (validationError) {
      setImageError(validationError);
      return;
    }
    setImageError(null);
    setSelectedFile(file);
  }

  function handleClose() {
    setOpen(false);
    setForm(EMPTY_FORM);
    setSelectedFile(null);
    setImageError(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const productId = crypto.randomUUID();
    let imagePath: string | null = null;

    if (selectedFile) {
      const webpBlob = await resizeImageToWebp(selectedFile);
      const path = buildProductImagePath(restaurantId, productId);
      const uploadError = await uploadProductImage(path, webpBlob);
      if (uploadError) {
        setLoading(false);
        setError(uploadError);
        return;
      }
      imagePath = path;
    }

    const result = await createProduct({ id: productId, ...form, imagePath });

    setLoading(false);

    if (!result.success) {
      if (imagePath) {
        await deleteProductImage(imagePath);
      }
      setError(result.error);
      return;
    }

    router.refresh();
    handleClose();
  }

  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)} disabled={categories.length === 0}>
        Create Product
      </Button>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Create Product</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                select
                label="Category"
                value={form.categoryId}
                onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
                required
                fullWidth
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                onKeyDown={submitOnEnter}
                required
                fullWidth
              />
              <TextField
                label="Description"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                multiline
                minRows={2}
                fullWidth
              />
              <TextField
                label="Price"
                type="number"
                slotProps={{ htmlInput: { step: "0.01", min: 0 } }}
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                onKeyDown={submitOnEnter}
                required
                fullWidth
              />
              <ProductImagePicker
                previewUrl={previewUrl}
                onFileChange={handleFileChange}
                error={imageError}
              />
              <TextField
                label="Sort order"
                type="number"
                value={form.sortOrder}
                onChange={(event) => setForm({ ...form, sortOrder: event.target.value })}
                onKeyDown={submitOnEnter}
                helperText="Lower numbers appear first"
                fullWidth
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.isPopular}
                    onChange={(event) => setForm({ ...form, isPopular: event.target.checked })}
                  />
                }
                label="Mark as popular"
              />
              {error && <Alert severity="error">{error}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
