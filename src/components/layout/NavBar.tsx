"use client";

import Link from "next/link";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

const NAV_LINKS = [
  { href: "/login", label: "Login" },
  { href: "/super-admin", label: "Super Admin" },
  { href: "/owner", label: "Owner" },
  { href: "/staff", label: "Staff" },
];

export function NavBar() {
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
        <Box sx={{ display: "flex", gap: 1 }}>
          {NAV_LINKS.map((link) => (
            <Button key={link.href} component={Link} href={link.href} color="inherit">
              {link.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
