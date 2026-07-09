"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { deleteTable, setTableActive, updateTable } from "@/app/owner/actions";
import { submitOnEnter } from "@/lib/submitOnEnter";
import type { RestaurantTable } from "@/types/database";

type TableCardProps = {
  table: RestaurantTable;
  guestUrl: string;
  qrDataUrl: string;
  restaurantName: string;
};

export function TableCard({ table, guestUrl, qrDataUrl, restaurantName }: TableCardProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: table.name,
    number: table.number != null ? String(table.number) : "",
  });

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
        <head><title>${table.name} QR</title></head>
        <body style="text-align:center;font-family:sans-serif;padding:24px;">
          <h2 style="margin-bottom:4px;">${restaurantName}</h2>
          <h3 style="margin-top:0;color:#555;">${table.name}</h3>
          <img src="${qrDataUrl}" width="240" height="240" alt="Table QR code" />
          <p style="word-break:break-all;color:#555;">${guestUrl}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  async function handleToggleActive() {
    setBusy(true);
    setError(null);
    const result = await setTableActive(table.id, !table.is_active);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${table.name}"? Its QR code will stop working.`)) {
      return;
    }
    setBusy(true);
    setError(null);
    const result = await deleteTable(table.id);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleEditSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await updateTable({ tableId: table.id, ...editForm });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setEditOpen(false);
    router.refresh();
  }

  return (
    <Card variant="outlined">
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

        {error && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {error}
          </Alert>
        )}

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          <Button size="small" variant="outlined" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          <Button
            size="small"
            variant="outlined"
            color={table.is_active ? "error" : "success"}
            disabled={busy}
            onClick={handleToggleActive}
          >
            {table.is_active ? "Deactivate" : "Activate"}
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            disabled={busy}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Stack>
      </CardContent>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Edit Table</DialogTitle>
        <Box component="form" onSubmit={handleEditSubmit}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                label="Table name"
                value={editForm.name}
                onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                onKeyDown={submitOnEnter}
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
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={busy}>
              {busy ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Card>
  );
}
