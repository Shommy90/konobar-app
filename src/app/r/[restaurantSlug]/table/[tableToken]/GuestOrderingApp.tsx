"use client";

import { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  callWaiter,
  placeOrder,
  requestBill,
  resolveTableSession,
  type ResolvedSession,
} from "@/app/r/[restaurantSlug]/table/[tableToken]/actions";
import { BillDialog } from "@/app/r/[restaurantSlug]/table/[tableToken]/BillDialog";
import { CartDialog } from "@/app/r/[restaurantSlug]/table/[tableToken]/CartDialog";
import { OrderStatusDialog } from "@/app/r/[restaurantSlug]/table/[tableToken]/OrderStatusDialog";
import { ProductCard } from "@/app/r/[restaurantSlug]/table/[tableToken]/ProductCard";
import { clearCart, loadCart, saveCart, type CartItem } from "@/lib/guestCart";
import { loadStoredSession, saveStoredSession } from "@/lib/guestSessionStorage";
import type { MenuCategory, MenuProduct, Restaurant, RestaurantTable } from "@/types/database";

type GuestOrderingAppProps = {
  restaurant: Restaurant;
  table: RestaurantTable;
  categories: MenuCategory[];
  products: MenuProduct[];
};

export function GuestOrderingApp({
  restaurant,
  table,
  categories,
  products,
}: GuestOrderingAppProps) {
  const tableToken = table.table_token;

  const [cart, setCart] = useState<CartItem[]>(() => loadCart(tableToken));
  const [session, setSession] = useState<ResolvedSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [cartOpen, setCartOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const [placing, setPlacing] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => {
    const cached = loadStoredSession(tableToken);
    resolveTableSession({
      restaurantId: restaurant.id,
      tableId: table.id,
      cachedSessionToken: cached?.sessionToken ?? null,
    }).then((result) => {
      setSessionLoading(false);
      if (result.success) {
        setSession(result.session);
        saveStoredSession(tableToken, {
          restaurantId: restaurant.id,
          tableId: table.id,
          sessionId: result.session.id,
          sessionToken: result.session.token,
        });
      }
    });
    // Only ever needs to run once per page load - restaurant/table are fixed for this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persistCart(next: CartItem[]) {
    setCart(next);
    saveCart(tableToken, next);
  }

  function handleAdd(product: MenuProduct) {
    const existing = cart.find((item) => item.productId === product.id);
    if (existing) {
      persistCart(
        cart.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        ),
      );
    } else {
      persistCart([
        ...cart,
        { productId: product.id, name: product.name, price: product.price, quantity: 1, note: "" },
      ]);
    }
  }

  function handleIncrement(productId: string) {
    persistCart(
      cart.map((item) =>
        item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
  }

  function handleDecrement(productId: string) {
    const existing = cart.find((item) => item.productId === productId);
    if (!existing) return;
    if (existing.quantity <= 1) {
      persistCart(cart.filter((item) => item.productId !== productId));
    } else {
      persistCart(
        cart.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item,
        ),
      );
    }
  }

  function handleRemove(productId: string) {
    persistCart(cart.filter((item) => item.productId !== productId));
  }

  function handleNoteChange(productId: string, note: string) {
    persistCart(cart.map((item) => (item.productId === productId ? { ...item, note } : item)));
  }

  async function handlePlaceOrder() {
    if (!session) return;
    setPlacing(true);
    setCartError(null);

    const result = await placeOrder({
      restaurantId: restaurant.id,
      tableId: table.id,
      tableSessionId: session.id,
      items: cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        note: item.note,
      })),
    });

    setPlacing(false);

    if (!result.success) {
      setCartError(result.error);
      return;
    }

    persistCart([]);
    clearCart(tableToken);
    setCartOpen(false);
    setSnackbar("Your order was sent!");
    setStatusOpen(true);
  }

  async function handleCallWaiter() {
    if (!session) return;
    const result = await callWaiter({
      restaurantId: restaurant.id,
      tableId: table.id,
      tableSessionId: session.id,
    });
    setSnackbar(result.success ? "Waiter has been notified." : result.error);
  }

  async function handleRequestBill() {
    if (!session) return;
    const result = await requestBill({
      restaurantId: restaurant.id,
      tableId: table.id,
      tableSessionId: session.id,
    });
    if (result.success) {
      setSession({ ...session, status: "REQUESTED_BILL" });
      setSnackbar("Bill requested - a staff member will be with you shortly.");
    } else {
      setSnackbar(result.error);
    }
  }

  const cartQuantities = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of cart) map.set(item.productId, item.quantity);
    return map;
  }, [cart]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const uncategorized = products.filter((product) => !product.category_id);
  const orderingLocked = session?.status !== "ACTIVE";
  const hasAnyItems = products.length > 0;

  return (
    <Container maxWidth="sm" sx={{ py: 4, pb: cartCount > 0 ? 12 : 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {restaurant.name}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
        {table.name}
      </Typography>

      {session?.status === "REQUESTED_BILL" && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Bill requested - a staff member will be with you shortly.
        </Alert>
      )}

      <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: "wrap" }}>
        <Button
          size="small"
          variant="outlined"
          onClick={handleCallWaiter}
          disabled={sessionLoading}
        >
          Call Waiter
        </Button>
        <Button size="small" variant="outlined" onClick={() => setBillOpen(true)}>
          Current Bill
        </Button>
        <Button size="small" variant="outlined" onClick={() => setStatusOpen(true)}>
          Order Status
        </Button>
        {session?.status === "ACTIVE" && (
          <Button size="small" variant="outlined" color="warning" onClick={handleRequestBill}>
            Request Bill
          </Button>
        )}
      </Stack>

      {!hasAnyItems ? (
        <Typography color="text.secondary">Menu coming soon.</Typography>
      ) : (
        <Stack spacing={3}>
          {categories.map((category) => {
            const categoryProducts = products.filter(
              (product) => product.category_id === category.id,
            );
            if (categoryProducts.length === 0) return null;

            return (
              <Paper key={category.id} variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6">{category.name}</Typography>
                {category.description && (
                  <Typography variant="body2" color="text.secondary">
                    {category.description}
                  </Typography>
                )}
                <Stack divider={<Box sx={{ borderBottom: 1, borderColor: "divider" }} />}>
                  {categoryProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      quantityInCart={cartQuantities.get(product.id) ?? 0}
                      onAdd={() => handleAdd(product)}
                      onIncrement={() => handleIncrement(product.id)}
                      onDecrement={() => handleDecrement(product.id)}
                      disabled={orderingLocked}
                    />
                  ))}
                </Stack>
              </Paper>
            );
          })}

          {uncategorized.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6">Other Items</Typography>
              <Stack divider={<Box sx={{ borderBottom: 1, borderColor: "divider" }} />}>
                {uncategorized.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    quantityInCart={cartQuantities.get(product.id) ?? 0}
                    onAdd={() => handleAdd(product)}
                    onIncrement={() => handleIncrement(product.id)}
                    onDecrement={() => handleDecrement(product.id)}
                    disabled={orderingLocked}
                  />
                ))}
              </Stack>
            </Paper>
          )}
        </Stack>
      )}

      {cartCount > 0 && (
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            bgcolor: "background.paper",
            borderTop: 1,
            borderColor: "divider",
            zIndex: (theme) => theme.zIndex.appBar,
          }}
        >
          <Container maxWidth="sm" disableGutters>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => setCartOpen(true)}
              startIcon={<Badge badgeContent={cartCount} color="secondary" />}
            >
              View Cart · {cartTotal.toFixed(2)}
            </Button>
          </Container>
        </Box>
      )}

      <CartDialog
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onRemove={handleRemove}
        onNoteChange={handleNoteChange}
        onPlaceOrder={handlePlaceOrder}
        placing={placing}
        disabled={orderingLocked}
        error={cartError}
      />
      <BillDialog
        open={billOpen}
        onClose={() => setBillOpen(false)}
        tableSessionId={session?.id ?? null}
      />
      <OrderStatusDialog
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        tableSessionId={session?.id ?? null}
      />

      <Snackbar
        open={snackbar !== null}
        autoHideDuration={3000}
        onClose={() => setSnackbar(null)}
        message={snackbar}
      />
    </Container>
  );
}
