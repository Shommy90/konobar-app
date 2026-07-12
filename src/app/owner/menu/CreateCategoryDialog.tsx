"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { FormDialog } from "@/components/FormDialog";
import { createCategory } from "@/app/owner/menu/actions";
import { submitOnEnter } from "@/lib/submitOnEnter";
import { useToast } from "@/lib/toast/ToastProvider";

const EMPTY_FORM = { name: "", description: "", sortOrder: "" };

export function CreateCategoryDialog() {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleClose() {
    setOpen(false);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await createCategory(form);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.refresh();
    handleClose();
    toast.success("Category created.");
  }

  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Create Category
      </Button>
      <FormDialog
        open={open}
        onClose={handleClose}
        onSubmit={handleSubmit}
        title="Create Category"
        maxWidth="xs"
        error={error}
        pending={loading}
        submitLabel="Create"
        pendingLabel="Creating..."
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
