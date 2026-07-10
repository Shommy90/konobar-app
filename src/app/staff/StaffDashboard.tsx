"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { createClient } from "@/lib/supabase/client";
import { playNotificationSound, unlockNotificationSound } from "@/lib/notificationSound";
import { useNow } from "@/lib/useNow";
import {
  acceptOrder,
  cancelOrder,
  closeTableSession,
  dismissServiceRequest,
  markOrderDelivered,
  markOrderReady,
  refreshStaffDashboard,
} from "@/app/staff/actions";
import { ActiveTableCard } from "@/app/staff/ActiveTableCard";
import { OrderCard } from "@/app/staff/OrderCard";
import { ServiceRequestCard } from "@/app/staff/ServiceRequestCard";
import { SessionOrdersDialog } from "@/app/staff/SessionOrdersDialog";
import type {
  StaffActiveSession,
  StaffDashboardData,
  StaffOrder,
  StaffServiceRequest,
} from "@/app/staff/data";

const SOUND_PREF_KEY = "konobar:staff:soundEnabled";

function loadSoundPreference(): boolean {
  if (typeof window === "undefined") return true;
  const stored = window.localStorage.getItem(SOUND_PREF_KEY);
  return stored === null ? true : stored === "true";
}

type Section = { title: string; orders: StaffOrder[] };

export function StaffDashboard({
  restaurantId,
  restaurantName,
  initialData,
}: {
  restaurantId: string;
  restaurantName: string;
  initialData: StaffDashboardData;
}) {
  const [orders, setOrders] = useState<StaffOrder[]>(initialData.orders);
  const [serviceRequests, setServiceRequests] = useState<StaffServiceRequest[]>(
    initialData.serviceRequests,
  );
  const [activeSessions, setActiveSessions] = useState<StaffActiveSession[]>(
    initialData.activeSessions,
  );
  const [soundEnabled, setSoundEnabled] = useState(() => loadSoundPreference());
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);

  const now = useNow(30000);
  const seenOrderIdsRef = useRef<Set<string>>(new Set(initialData.orders.map((order) => order.id)));
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Stable across renders (only ever touches refs + stable setState setters)
  // so the realtime effect below can depend on it without resubscribing.
  const refetch = useCallback(async () => {
    const data = await refreshStaffDashboard();

    const arrivedNew = data.orders.some(
      (order) => order.status === "NEW" && !seenOrderIdsRef.current.has(order.id),
    );
    for (const order of data.orders) seenOrderIdsRef.current.add(order.id);

    if (arrivedNew && soundEnabledRef.current) {
      playNotificationSound();
    }

    setOrders(data.orders);
    setServiceRequests(data.serviceRequests);
    setActiveSessions(data.activeSessions);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const trigger = () => {
      void refetch();
    };

    const channel = supabase
      .channel(`staff-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        trigger,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        trigger,
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "service_requests",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        trigger,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "service_requests",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        trigger,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, refetch]);

  function handleToggleSound(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.checked;
    setSoundEnabled(next);
    window.localStorage.setItem(SOUND_PREF_KEY, String(next));
    if (next) unlockNotificationSound();
  }

  async function handleAccept(orderId: string) {
    await acceptOrder(orderId);
    await refetch();
  }

  async function handleCancel(orderId: string) {
    await cancelOrder(orderId);
    await refetch();
  }

  async function handleMarkReady(orderId: string) {
    await markOrderReady(orderId);
    await refetch();
  }

  async function handleMarkDelivered(orderId: string) {
    await markOrderDelivered(orderId);
    await refetch();
  }

  async function handleDismissRequest(requestId: string) {
    await dismissServiceRequest(requestId);
    await refetch();
  }

  async function handleCloseTable(sessionId: string) {
    await closeTableSession(sessionId);
    await refetch();
  }

  const sections: Section[] = [
    { title: "New Orders", orders: orders.filter((order) => order.status === "NEW") },
    { title: "Active Orders", orders: orders.filter((order) => order.status === "ACCEPTED") },
    { title: "Ready", orders: orders.filter((order) => order.status === "READY") },
  ];

  const sessionTotalById = new Map(activeSessions.map((session) => [session.id, session.total]));

  return (
    <Stack sx={{ p: { xs: 2, md: 3 } }} spacing={4}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h4">{restaurantName} · Staff</Typography>
        <FormControlLabel
          control={<Switch checked={soundEnabled} onChange={handleToggleSound} />}
          label="Sound"
        />
      </Stack>

      <Grid container spacing={2}>
        {sections.map((section) => (
          <Grid key={section.title} size={{ xs: 12, md: 4 }}>
            <Typography variant="h5" gutterBottom>
              {section.title.toUpperCase()} ({section.orders.length})
            </Typography>
            <Stack spacing={2}>
              {section.orders.length === 0 ? (
                <Typography color="text.secondary">Nothing here.</Typography>
              ) : (
                section.orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    now={now}
                    onAccept={handleAccept}
                    onCancel={handleCancel}
                    onMarkReady={handleMarkReady}
                    onMarkDelivered={handleMarkDelivered}
                  />
                ))
              )}
            </Stack>
          </Grid>
        ))}
      </Grid>

      <Divider />

      <Stack spacing={2}>
        <Typography variant="h5">SERVICE REQUESTS ({serviceRequests.length})</Typography>
        {serviceRequests.length === 0 ? (
          <Typography color="text.secondary">No open requests.</Typography>
        ) : (
          <Grid container spacing={2}>
            {serviceRequests.map((request) => (
              <Grid key={request.id} size={{ xs: 12, md: 6 }}>
                <ServiceRequestCard
                  request={request}
                  sessionTotal={sessionTotalById.get(request.table_session_id)}
                  onDismiss={handleDismissRequest}
                  onCloseTable={handleCloseTable}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>

      <Divider />

      <Stack spacing={2}>
        <Typography variant="h5">ACTIVE TABLES</Typography>
        {activeSessions.length === 0 ? (
          <Typography color="text.secondary">No active tables right now.</Typography>
        ) : (
          <Grid container spacing={2}>
            {activeSessions.map((session) => (
              <Grid key={session.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <ActiveTableCard
                  session={session}
                  now={now}
                  onViewOrders={setViewingSessionId}
                  onCloseTable={handleCloseTable}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>

      <SessionOrdersDialog
        open={viewingSessionId !== null}
        onClose={() => setViewingSessionId(null)}
        sessionId={viewingSessionId}
      />
    </Stack>
  );
}
