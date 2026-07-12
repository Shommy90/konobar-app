"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import MenuIcon from "@mui/icons-material/Menu";
import { useAuth } from "@/lib/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";

const DASHBOARD_LINKS = [
  { href: "/super-admin", label: "Super Admin" },
  { href: "/owner", label: "Owner" },
  { href: "/staff", label: "Staff" },
];

export function NavBar() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setDrawerOpen(false);
    router.push("/login");
    router.refresh();
  }

  const authAction = loading ? null : user ? (
    <Button color="inherit" onClick={handleLogout}>
      Logout ({user.email})
    </Button>
  ) : (
    <Button component={Link} href="/login" color="inherit">
      Login
    </Button>
  );

  return (
    <AppBar
      position="static"
      color="default"
      sx={{ borderBottom: 1, borderColor: "divider" }}
    >
      <Toolbar sx={{ gap: 1 }}>
        <Typography
          component={Link}
          href="/"
          variant="h6"
          sx={{ flexGrow: 1, color: "inherit", textDecoration: "none", fontWeight: 700 }}
        >
          Konobar
        </Typography>

        <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 1 }}>
          {DASHBOARD_LINKS.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Button
                key={link.href}
                component={Link}
                href={link.href}
                color="inherit"
                sx={{
                  fontWeight: active ? 700 : 500,
                  bgcolor: active ? "action.selected" : undefined,
                }}
              >
                {link.label}
              </Button>
            );
          })}
          {authAction}
        </Box>

        <IconButton
          color="inherit"
          aria-label="Open navigation menu"
          onClick={() => setDrawerOpen(true)}
          sx={{ display: { xs: "inline-flex", sm: "none" } }}
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 240 }} role="presentation">
          <List>
            {DASHBOARD_LINKS.map((link) => {
              const active = pathname?.startsWith(link.href);
              return (
                <ListItemButton
                  key={link.href}
                  component={Link}
                  href={link.href}
                  selected={active}
                  onClick={() => setDrawerOpen(false)}
                >
                  <ListItemText primary={link.label} />
                </ListItemButton>
              );
            })}
          </List>
          <Divider />
          <List>
            {!loading &&
              (user ? (
                <ListItemButton onClick={handleLogout}>
                  <ListItemText primary={`Logout (${user.email})`} />
                </ListItemButton>
              ) : (
                <ListItemButton component={Link} href="/login" onClick={() => setDrawerOpen(false)}>
                  <ListItemText primary="Login" />
                </ListItemButton>
              ))}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}
