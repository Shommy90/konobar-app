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
import { updateProduct } from "@/app/owner/menu/actions";
import {
  deleteProductImage,
  resizeImageToWebp,
  uploadProductImage,
  validateImageFile,
} from "@/lib/imageUpload";
import { buildProductImagePath, getProductImageUrl } from "@/lib/productImage";
import { submitOnEnter } from "@/lib/submitOnEnter";
import { ProductImagePicker } from "@/app/owner/menu/ProductImagePicker";

type CategoryOption = { id: string; name: string };

export type EditProductInitialValues = {
  productId: string;
  categoryId: string;
  name: string;
  description: string;
  price: string;
  imagePath: string | null;
  isPopular: boolean;
  sortOrder: string;
};

export function EditProductDialog({
  restaurantId,
  initial,
  categories,
}: {
  restaurantId: string;
  initial: EditProductInitialValues;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeRequested, setRemoveRequested] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const localPreviewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile],
  );

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  function handleOpen() {
    setForm(initial);
    setSelectedFile(null);
    setRemoveRequested(false);
    setImageError(null);
    setError(null);
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setError(null);
  }

  function handleFileChange(file: File) {
    const validationError = validateImageFile(file);
    if (validationError) {
      setImageError(validationError);
      return;
    }
    setImageError(null);
    setRemoveRequested(false);
    setSelectedFile(file);
  }

  function handleRemoveImage() {
    setSelectedFile(null);
    setRemoveRequested(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    let imagePath = initial.imagePath;

    if (selectedFile) {
      const webpBlob = await resizeImageToWebp(selectedFile);
      const newPath = buildProductImagePath(restaurantId, initial.productId);
      const uploadError = await uploadProductImage(newPath, webpBlob);
      if (uploadError) {
        setLoading(false);
        setError(uploadError);
        return;
      }
      imagePath = newPath;
    } else if (removeRequested) {
      imagePath = null;
    }

    const { categoryId, name, description, price, isPopular, sortOrder } = form;
    const result = await updateProduct({
      productId: initial.productId,
      categoryId,
      name,
      description,
      price,
      isPopular,
      sortOrder,
      imagePath,
    });

    setLoading(false);

    if (!result.success) {
      // Roll back the new upload - the DB update never happened, so it
      // would otherwise be an orphaned object nothing points to.
      if (imagePath && imagePath !== initial.imagePath) {
        await deleteProductImage(imagePath);
      }
      setError(result.error);
      return;
    }

    // Only remove the old object once the DB row is confirmed pointing at
    // the new one (or at nothing, if removed) - never delete-then-update.
    if (initial.imagePath && imagePath !== initial.imagePath) {
      await deleteProductImage(initial.imagePath);
    }

    router.refresh();
    handleClose();
  }

  const previewUrl =
    localPreviewUrl ?? (removeRequested ? null : getProductImageUrl(initial.imagePath));

  return (
    <>
      <Button size="small" variant="outlined" onClick={handleOpen}>
        Edit
      </Button>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Edit Product</DialogTitle>
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
                onRemove={handleRemoveImage}
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
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
