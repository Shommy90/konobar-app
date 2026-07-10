"use client";

import { useState, type FormEvent } from "react";
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
import { submitOnEnter } from "@/lib/submitOnEnter";

type CategoryOption = { id: string; name: string };

export type EditProductInitialValues = {
  productId: string;
  categoryId: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  isPopular: boolean;
  sortOrder: string;
};

export function EditProductDialog({
  initial,
  categories,
}: {
  initial: EditProductInitialValues;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleOpen() {
    setForm(initial);
    setError(null);
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await updateProduct(form);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.refresh();
    handleClose();
  }

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
              <TextField
                label="Image URL"
                value={form.imageUrl}
                onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
                onKeyDown={submitOnEnter}
                helperText="Optional - paste a link to an image hosted elsewhere"
                fullWidth
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
