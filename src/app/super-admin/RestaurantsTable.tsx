"use client";

import Link from "next/link";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { RestaurantStatusChip } from "@/app/super-admin/RestaurantStatusChip";
import { StatusToggleButton } from "@/app/super-admin/StatusToggleButton";
import type { RestaurantWithRelations } from "@/app/super-admin/data";

export function RestaurantsTable({ restaurants }: { restaurants: RestaurantWithRelations[] }) {
  if (restaurants.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography color="text.secondary">
          No restaurants yet. Create the first one above.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Slug</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Plan</TableCell>
            <TableCell>Subscription</TableCell>
            <TableCell>Owner</TableCell>
            <TableCell>Created</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {restaurants.map((restaurant) => (
            <TableRow key={restaurant.id}>
              <TableCell>{restaurant.name}</TableCell>
              <TableCell>{restaurant.slug}</TableCell>
              <TableCell>
                <RestaurantStatusChip status={restaurant.status} />
              </TableCell>
              <TableCell>{restaurant.subscription?.plan ?? "—"}</TableCell>
              <TableCell>{restaurant.subscription?.status ?? "—"}</TableCell>
              <TableCell>{restaurant.owner?.email ?? "—"}</TableCell>
              <TableCell>{new Date(restaurant.created_at).toLocaleDateString()}</TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                  <Button
                    size="small"
                    component={Link}
                    href={`/super-admin/restaurants/${restaurant.id}`}
                  >
                    View
                  </Button>
                  <StatusToggleButton restaurantId={restaurant.id} status={restaurant.status} />
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
