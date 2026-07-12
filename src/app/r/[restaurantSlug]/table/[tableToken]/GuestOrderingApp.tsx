"use client";

import { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import {
  callWaiter,
  establishGuestSession,
  placeOrder,
  pollGuestSession,
  requestBill,
  type GuestSessionResult,
  type GuestSessionState,
} from "@/app/r/[restaurantSlug]/table/[tableToken]/actions";
import { BillDialog } from "@/app/r/[restaurantSlug]/table/[tableToken]/BillDialog";
import { CartDialog } from "@/app/r/[restaurantSlug]/table/[tableToken]/CartDialog";
import { OrderConfirmationScreen } from "@/app/r/[restaurantSlug]/table/[tableToken]/OrderConfirmationScreen";
import { OrderStatusDialog } from "@/app/r/[restaurantSlug]/table/[tableToken]/OrderStatusDialog";
import { ProductCard } from "@/app/r/[restaurantSlug]/table/[tableToken]/ProductCard";
import { SessionEndedScreen } from "@/app/r/[restaurantSlug]/table/[tableToken]/SessionEndedScreen";
import { clearCart, loadCart, saveCart, type CartItem } from "@/lib/guestCart";
import { getOrCreateGuestDeviceToken } from "@/lib/guestDeviceToken";
import { SESSION_EXPIRED_MESSAGE } from "@/lib/tableSession";
import { useToast } from "@/lib/toast/ToastProvider";
import type { MenuCategory, MenuProduct, Restaurant, RestaurantTable } from "@/types/database";

const ENDED_MESSAGE =
  "This visit has ended. Scan the QR code on the table again to start a new session.";

const POLL_INTERVAL_MS = 15000;
const CATEGORY_TABS_TOP_OFFSET = 0;

type SessionState =
  | { kind: "loading" }
  | { kind: "unclaimed" }
  | { kind: "active"; sessionId: string }
  | { kind: "requested_bill"; sessionId: string }
  | { kind: "ended"; message: string };

type OrderConfirmation = { orderId: string; items: CartItem[]; total: number };

function sessionStateFromGuestSession(session: GuestSessionState): SessionState {
  if (session.state === "unclaimed") return { kind: "unclaimed" };
  if (session.state === "active") return { kind: "active", sessionId: session.sessionId };
  if (session.state === "requested_bill") {
    return { kind: "requested_bill", sessionId: session.sessionId };
  }
  return { kind: "ended", message: ENDED_MESSAGE };
}

function toSessionState(result: GuestSessionResult): SessionState {
  if (!result.success) {
    return { kind: "ended", message: result.error };
  }
  return sessionStateFromGuestSession(result.session);
}

type GuestOrderingAppProps = {
  restaurant: Restaurant;
  table: RestaurantTable;
  categories: MenuCategory[];
  products: MenuProduct[];
  scanNonce: string | null;
};

export function GuestOrderingApp({
  restaurant,
  table,
  categories,
  products,
  scanNonce,
}: GuestOrderingAppProps) {
  const tableToken = table.table_token;
  const toast = useToast();

  const [cart, setCart] = useState<CartItem[]>(() => loadCart(tableToken));
  const [guestDeviceToken] = useState(() => getOrCreateGuestDeviceToken(tableToken));
  const [session, setSession] = useState<SessionState>({ kind: "loading" });
  const [orderConfirmation, setOrderConfirmation] = useState<OrderConfirmation | null>(null);

  const [cartOpen, setCartOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const [placing, setPlacing] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  useEffect(() => {
    establishGuestSession({
      nonce: scanNonce ?? "",
      restaurantId: restaurant.id,
      tableId: table.id,
      guestDeviceToken,
    }).then((result) => {
      setSession(toSessionState(result));
    });
    // Only ever needs to run once per page load - restaurant/table/nonce are fixed for this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sessionId =
    session.kind === "active" || session.kind === "requested_bill" ? session.sessionId : null;

  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(() => {
      pollGuestSession({ tableId: table.id, guestDeviceToken }).then((result) => {
        setSession(toSessionState(result));
      });
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [sessionId, table.id, guestDeviceToken]);

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
    setPlacing(true);
    setCartError(null);

    const cartAtSubmit = cart;
    const cartTotalAtSubmit = cartAtSubmit.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const result = await placeOrder({
      restaurantId: restaurant.id,
      tableId: table.id,
      guestDeviceToken,
      items: cartAtSubmit.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        note: item.note,
      })),
    });

    setPlacing(false);

    if (!result.success) {
      if (result.error === SESSION_EXPIRED_MESSAGE) {
        setSession({ kind: "ended", message: ENDED_MESSAGE });
        setCartOpen(false);
        return;
      }
      setCartError(result.error);
      return;
    }

    setSession(sessionStateFromGuestSession(result.session));
    persistCart([]);
    clearCart(tableToken);
    setCartOpen(false);
    setOrderConfirmation({
      orderId: result.orderId,
      items: cartAtSubmit,
      total: cartTotalAtSubmit,
    });
  }

  async function handleCallWaiter() {
    if (!sessionId) return;
    const result = await callWaiter({ sessionId, guestDeviceToken });
    if (result.success) {
      toast.success("Waiter has been notified.");
    } else {
      toast.error(result.error);
    }
  }

  async function handleRequestBill() {
    if (!sessionId) return;
    const result = await requestBill({ sessionId, guestDeviceToken });
    if (result.success) {
      setSession(toSessionState(result));
      toast.success("Bill requested - a staff member will be with you shortly.");
    } else {
      toast.error(result.error);
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
  const orderingLocked = session.kind === "loading" || session.kind === "requested_bill";
  const hasAnyItems = products.length > 0;

  const categoriesWithProducts = categories.filter((category) =>
    products.some((product) => product.category_id === category.id),
  );
  const [activeCategoryId, setActiveCategoryId] = useState<string | false>(
    categoriesWithProducts[0]?.id ?? false,
  );

  function handleCategoryTabChange(categoryId: string) {
    setActiveCategoryId(categoryId);
    document
      .getElementById(`category-${categoryId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (orderConfirmation) {
    return (
      <OrderConfirmationScreen
        restaurantName={restaurant.name}
        tableName={table.name}
        orderId={orderConfirmation.orderId}
        items={orderConfirmation.items}
        total={orderConfirmation.total}
        onContinue={() => setOrderConfirmation(null)}
      />
    );
  }

  if (session.kind === "ended") {
    return (
      <SessionEndedScreen
        restaurantName={restaurant.name}
        tableName={table.name}
        message={session.message}
      />
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4, pb: cartCount > 0 ? 12 : 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {restaurant.name}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
        {table.name}
      </Typography>

      {session.kind === "requested_bill" && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Your bill has been requested. This ordering session is now closed.
        </Alert>
      )}

      <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: "wrap" }}>
        <Button size="small" variant="outlined" onClick={handleCallWaiter} disabled={!sessionId}>
          Call Waiter
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => setBillOpen(true)}
          disabled={!sessionId}
        >
          Current Bill
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => setStatusOpen(true)}
          disabled={!sessionId}
        >
          Order Status
        </Button>
        {session.kind === "active" && (
          <Button size="small" variant="outlined" color="warning" onClick={handleRequestBill}>
            Request Bill
          </Button>
        )}
      </Stack>

      {!hasAnyItems ? (
        <Typography color="text.secondary">Menu coming soon.</Typography>
      ) : (
        <>
          {categoriesWithProducts.length > 1 && (
            <Box
              sx={{
                position: "sticky",
                top: CATEGORY_TABS_TOP_OFFSET,
                zIndex: (theme) => theme.zIndex.appBar,
                bgcolor: "background.default",
                mb: 2,
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <Tabs
                value={activeCategoryId}
                onChange={(_event, value: string) => handleCategoryTabChange(value)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
              >
                {categoriesWithProducts.map((category) => (
                  <Tab key={category.id} value={category.id} label={category.name} />
                ))}
              </Tabs>
            </Box>
          )}

          <Stack spacing={3}>
            {categories.map((category) => {
              const categoryProducts = products.filter(
                (product) => product.category_id === category.id,
              );
              if (categoryProducts.length === 0) return null;

              return (
                <Paper
                  key={category.id}
                  id={`category-${category.id}`}
                  variant="outlined"
                  sx={{ p: 2, scrollMarginTop: 64 }}
                >
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
        </>
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
        products={products}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onRemove={handleRemove}
        onNoteChange={handleNoteChange}
        onPlaceOrder={handlePlaceOrder}
        placing={placing}
        disabled={orderingLocked}
        error={cartError}
      />
      <BillDialog open={billOpen} onClose={() => setBillOpen(false)} tableSessionId={sessionId} />
      <OrderStatusDialog
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        tableSessionId={sessionId}
      />
    </Container>
  );
}
