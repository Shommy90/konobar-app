"use client";

import type { FormEvent, ReactNode } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";

type FormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  title: string;
  children: ReactNode;
  error?: string | null;
  pending?: boolean;
  submitLabel?: string;
  pendingLabel?: string;
  maxWidth?: "xs" | "sm" | "md";
  submitDisabled?: boolean;
};

/**
 * Shared Dialog/form shell for the app's create/edit dialogs - each caller
 * keeps its own open/form/error/pending state and submit handler (including
 * any extra work like the product dialogs' image upload); this only absorbs
 * the repeated JSX shell (title, form wrapper, error alert, cancel/submit
 * buttons with a spinner) so every dialog looks and behaves consistently.
 */
export function FormDialog({
  open,
  onClose,
  onSubmit,
  title,
  children,
  error,
  pending = false,
  submitLabel = "Save",
  pendingLabel,
  maxWidth = "sm",
  submitDisabled = false,
}: FormDialogProps) {
  return (
    <Dialog open={open} onClose={pending ? undefined : onClose} fullWidth maxWidth={maxWidth}>
      <DialogTitle>{title}</DialogTitle>
      <Box component="form" onSubmit={onSubmit}>
        <DialogContent>
          <Stack spacing={2}>
            {children}
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={pending || submitDisabled}
            startIcon={pending ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {pending ? (pendingLabel ?? "Saving...") : submitLabel}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
