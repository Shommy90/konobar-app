"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { createStaff } from "@/app/owner/staff/actions";
import { submitOnEnter } from "@/lib/submitOnEnter";

const EMPTY_FORM = { nickname: "", password: "", fullName: "" };

export function CreateStaffDialog() {
  const router = useRouter();
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

    const result = await createStaff(form);

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
      <Button variant="contained" onClick={() => setOpen(true)}>
        Create Staff
      </Button>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Create Staff Account</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                label="Full name"
                value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                onKeyDown={submitOnEnter}
                fullWidth
              />
              <TextField
                label="Nickname"
                value={form.nickname}
                onChange={(event) => setForm({ ...form, nickname: event.target.value })}
                onKeyDown={submitOnEnter}
                helperText="What they'll log in with, e.g. mara or waiter1 - lowercase letters, numbers, - or _."
                required
                fullWidth
              />
              <TextField
                label="Temporary password"
                type="text"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                onKeyDown={submitOnEnter}
                helperText="Share this with them directly; they can change it after logging in."
                required
                fullWidth
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
