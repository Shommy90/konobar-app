"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { FormDialog } from "@/components/FormDialog";
import { createTable } from "@/app/owner/actions";
import { submitOnEnter } from "@/lib/submitOnEnter";
import { useToast } from "@/lib/toast/ToastProvider";

const EMPTY_FORM = { name: "", number: "" };

export function CreateTableDialog() {
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

    const result = await createTable(form);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.refresh();
    handleClose();
    toast.success("Table created.");
  }

  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Create Table
      </Button>
      <FormDialog
        open={open}
        onClose={handleClose}
        onSubmit={handleSubmit}
        title="Create Table"
        maxWidth="xs"
        error={error}
        pending={loading}
        submitLabel="Create"
        pendingLabel="Creating..."
      >
        <TextField
          label="Table name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          onKeyDown={submitOnEnter}
          helperText="e.g. Table 5, Patio 2, Bar Seat 1"
          autoFocus
          required
          fullWidth
        />
        <TextField
          label="Table number"
          type="number"
          value={form.number}
          onChange={(event) => setForm({ ...form, number: event.target.value })}
          onKeyDown={submitOnEnter}
          fullWidth
        />
      </FormDialog>
    </>
  );
}
