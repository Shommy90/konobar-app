"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { FormDialog } from "@/components/FormDialog";
import { createOwner } from "@/app/super-admin/actions";
import { useToast } from "@/lib/toast/ToastProvider";
import { submitOnEnter } from "@/lib/submitOnEnter";

type RestaurantOption = { id: string; name: string };

const EMPTY_FORM = { email: "", password: "", fullName: "", restaurantId: "" };

export function CreateOwnerDialog({ restaurants }: { restaurants: RestaurantOption[] }) {
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

    const result = await createOwner(form);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.refresh();
    handleClose();
    toast.success("Owner account created.");
  }

  const noRestaurants = restaurants.length === 0;

  return (
    <>
      <Tooltip title={noRestaurants ? "Create a restaurant first." : ""} disableHoverListener={!noRestaurants}>
        <span>
          <Button variant="outlined" onClick={() => setOpen(true)} disabled={noRestaurants}>
            Create Owner
          </Button>
        </span>
      </Tooltip>
      <FormDialog
        open={open}
        onClose={handleClose}
        onSubmit={handleSubmit}
        title="Create Owner Account"
        error={error}
        pending={loading}
        submitLabel="Create"
        pendingLabel="Creating..."
      >
        <TextField
          select
          label="Restaurant"
          value={form.restaurantId}
          onChange={(event) => setForm({ ...form, restaurantId: event.target.value })}
          autoFocus
          required
          fullWidth
        >
          {restaurants.map((restaurant) => (
            <MenuItem key={restaurant.id} value={restaurant.id}>
              {restaurant.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Full name"
          value={form.fullName}
          onChange={(event) => setForm({ ...form, fullName: event.target.value })}
          onKeyDown={submitOnEnter}
          fullWidth
        />
        <TextField
          label="Email"
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          onKeyDown={submitOnEnter}
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
      </FormDialog>
    </>
  );
}
