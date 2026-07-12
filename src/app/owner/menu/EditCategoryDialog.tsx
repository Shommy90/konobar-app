"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { FormDialog } from "@/components/FormDialog";
import { updateCategory } from "@/app/owner/menu/actions";
import { submitOnEnter } from "@/lib/submitOnEnter";
import { useToast } from "@/lib/toast/ToastProvider";

export type EditCategoryInitialValues = {
  categoryId: string;
  name: string;
  description: string;
  sortOrder: string;
};

export function EditCategoryDialog({ initial }: { initial: EditCategoryInitialValues }) {
  const router = useRouter();
  const toast = useToast();
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

    const result = await updateCategory(form);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.refresh();
    handleClose();
    toast.success("Category updated.");
  }

  return (
    <>
      <Button size="small" variant="outlined" onClick={handleOpen}>
        Edit
      </Button>
      <FormDialog
        open={open}
        onClose={handleClose}
        onSubmit={handleSubmit}
        title="Edit Category"
        maxWidth="xs"
        error={error}
        pending={loading}
      >
        <TextField
          label="Name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          onKeyDown={submitOnEnter}
          autoFocus
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
          label="Sort order"
          type="number"
          value={form.sortOrder}
          onChange={(event) => setForm({ ...form, sortOrder: event.target.value })}
          onKeyDown={submitOnEnter}
          helperText="Lower numbers appear first"
          fullWidth
        />
      </FormDialog>
    </>
  );
}
