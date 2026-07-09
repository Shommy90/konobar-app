"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
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

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <AppBar
      position="static"
      color="default"
      elevation={0}
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {DASHBOARD_LINKS.map((link) => (
            <Button key={link.href} component={Link} href={link.href} color="inherit">
              {link.label}
            </Button>
          ))}
          {!loading &&
            (user ? (
              <Button color="inherit" onClick={handleLogout}>
                Logout ({user.email})
              </Button>
            ) : (
              <Button component={Link} href="/login" color="inherit">
                Login
              </Button>
            ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
