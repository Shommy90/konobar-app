"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { FormDialog } from "@/components/FormDialog";
import { updateOwner } from "@/app/super-admin/actions";
import { useToast } from "@/lib/toast/ToastProvider";
import { submitOnEnter } from "@/lib/submitOnEnter";

export type EditOwnerInitialValues = {
  profileId: string;
  restaurantId: string;
  fullName: string;
  email: string;
};

export function EditOwnerDialog({ initial }: { initial: EditOwnerInitialValues }) {
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

    const result = await updateOwner(form);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.refresh();
    handleClose();
    toast.success("Owner updated.");
  }

  return (
    <>
      <Button variant="outlined" size="small" onClick={handleOpen}>
        Edit Owner
      </Button>
      <FormDialog
        open={open}
        onClose={handleClose}
        onSubmit={handleSubmit}
        title="Edit Owner"
        error={error}
        pending={loading}
      >
        <TextField
          label="Full name"
          value={form.fullName}
          onChange={(event) => setForm({ ...form, fullName: event.target.value })}
          onKeyDown={submitOnEnter}
          autoFocus
          fullWidth
        />
        <TextField
          label="Email"
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          onKeyDown={submitOnEnter}
          helperText="Changing this updates their login email too."
          required
          fullWidth
        />
      </FormDialog>
    </>
  );
}
