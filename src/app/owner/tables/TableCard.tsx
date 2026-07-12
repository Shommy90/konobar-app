"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FormDialog } from "@/components/FormDialog";
import { deleteTable, setTableActive, updateTable } from "@/app/owner/actions";
import { submitOnEnter } from "@/lib/submitOnEnter";
import { useServerAction } from "@/lib/useServerAction";
import { useToast } from "@/lib/toast/ToastProvider";
import type { RestaurantTable } from "@/types/database";

type TableCardProps = {
  table: RestaurantTable;
  guestUrl: string;
  qrDataUrl: string;
  restaurantName: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function TableCard({ table, guestUrl, qrDataUrl, restaurantName }: TableCardProps) {
  const router = useRouter();
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: table.name,
    number: table.number != null ? String(table.number) : "",
  });

  const toggleAction = useServerAction(setTableActive);
  const deleteAction = useServerAction(deleteTable);
  const editAction = useServerAction(updateTable);

  async function handleCopyLink() {
    await navigator.clipboard.writeText(guestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePrint() {
    const printWindow = window.open("", "_blank", "width=420,height=560");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head><title>${escapeHtml(table.name)} QR</title></head>
        <body style="text-align:center;font-family:sans-serif;padding:24px;">
          <h2 style="margin-bottom:4px;">${escapeHtml(restaurantName)}</h2>
          <h3 style="margin-top:0;color:#555;">${escapeHtml(table.name)}</h3>
          <img src="${qrDataUrl}" width="240" height="240" alt="Table QR code" />
          <p style="word-break:break-all;color:#555;">${escapeHtml(guestUrl)}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  async function handleToggleActive() {
    const ok = await toggleAction.run(table.id, !table.is_active);
    if (ok) {
      router.refresh();
      toast.success(table.is_active ? "Table deactivated." : "Table activated.");
    }
  }

  async function handleConfirmDelete() {
    const ok = await deleteAction.run(table.id);
    if (ok) {
      setDeleteOpen(false);
      router.refresh();
      toast.success("Table deleted.");
    }
  }

  async function handleEditSubmit(event: FormEvent) {
    event.preventDefault();
    const ok = await editAction.run({ tableId: table.id, ...editForm });
    if (ok) {
      setEditOpen(false);
      router.refresh();
      toast.success("Table updated.");
    }
  }

  return (
    <Card>
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography variant="h6" component="p">
              {table.name}
            </Typography>
            {table.number != null && (
              <Typography variant="body2" color="text.secondary">
                Number: {table.number}
              </Typography>
            )}
          </Box>
          <Chip
            size="small"
            label={table.is_active ? "Active" : "Inactive"}
            color={table.is_active ? "success" : "default"}
          />
        </Stack>

        <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} width={140} height={140} alt={`QR code for ${table.name}`} />
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", wordBreak: "break-all", mb: 1 }}
        >
          {guestUrl}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mb: 1 }}>
          <Button size="small" onClick={handleCopyLink}>
            {copied ? "Copied!" : "Copy link"}
          </Button>
          <Button size="small" component="a" href={qrDataUrl} download={`${table.name}-qr.png`}>
            Download PNG
          </Button>
          <Button size="small" onClick={handlePrint}>
            Print
          </Button>
        </Stack>

        {(toggleAction.error || deleteAction.error) && (
          <Typography variant="body2" color="error" sx={{ mb: 1 }}>
            {toggleAction.error ?? deleteAction.error}
          </Typography>
        )}

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          <Button size="small" variant="outlined" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          <Button
            size="small"
            variant="outlined"
            color={table.is_active ? "error" : "success"}
            disabled={toggleAction.loading}
            onClick={handleToggleActive}
          >
            {table.is_active ? "Deactivate" : "Activate"}
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            disabled={deleteAction.loading}
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </Button>
        </Stack>
      </CardContent>

      <FormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
        title="Edit Table"
        maxWidth="xs"
        error={editAction.error}
        pending={editAction.loading}
      >
        <TextField
          label="Table name"
          value={editForm.name}
          onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
          onKeyDown={submitOnEnter}
          autoFocus
          required
          fullWidth
        />
        <TextField
          label="Table number"
          type="number"
          value={editForm.number}
          onChange={(event) => setEditForm({ ...editForm, number: event.target.value })}
          onKeyDown={submitOnEnter}
          fullWidth
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete table?"
        description={`Delete "${table.name}"? Its QR code will stop working immediately.`}
        confirmLabel="Delete"
        pending={deleteAction.loading}
      />
    </Card>
  );
}
