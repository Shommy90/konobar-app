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
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { updateRestaurant } from "@/app/super-admin/actions";
import type { RestaurantStatus, SubscriptionPlan } from "@/types/database";

const STATUS_OPTIONS: RestaurantStatus[] = ["TRIAL", "ACTIVE", "DISABLED"];
const PLAN_OPTIONS: SubscriptionPlan[] = ["BASIC", "BUSINESS", "ENTERPRISE"];

export type EditRestaurantInitialValues = {
  restaurantId: string;
  name: string;
  slug: string;
  address: string;
  status: RestaurantStatus;
  plan: string;
  price: string;
  trialEnd: string;
};

export function EditRestaurantDialog({ initial }: { initial: EditRestaurantInitialValues }) {
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

    const result = await updateRestaurant(form);

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
      <Button variant="outlined" onClick={handleOpen}>
        Edit Restaurant
      </Button>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Edit Restaurant</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                label="Name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Slug"
                value={form.slug}
                onChange={(event) => setForm({ ...form, slug: event.target.value })}
                helperText="Used in the guest ordering URL, e.g. my-cafe"
                required
                fullWidth
              />
              <TextField
                label="Address"
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
                fullWidth
              />
              <TextField
                select
                label="Status"
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value as RestaurantStatus })
                }
                fullWidth
              >
                {STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Subscription plan"
                value={form.plan}
                onChange={(event) =>
                  setForm({ ...form, plan: event.target.value as SubscriptionPlan })
                }
                fullWidth
              >
                {PLAN_OPTIONS.map((plan) => (
                  <MenuItem key={plan} value={plan}>
                    {plan}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Price"
                type="number"
                slotProps={{ htmlInput: { step: "0.01", min: 0 } }}
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                fullWidth
              />
              <TextField
                label="Trial end date"
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                value={form.trialEnd}
                onChange={(event) => setForm({ ...form, trialEnd: event.target.value })}
                fullWidth
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
