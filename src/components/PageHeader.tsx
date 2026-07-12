"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type Crumb = { label: string; href?: string };

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  breadcrumbs?: Crumb[];
  backHref?: string;
};

export function PageHeader({ title, description, action, breadcrumbs, backHref }: PageHeaderProps) {
  return (
    <Box sx={{ mb: 4 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 1 }}>
          {breadcrumbs.map((crumb) =>
            crumb.href ? (
              <Typography
                key={crumb.label}
                component={Link}
                href={crumb.href}
                variant="body2"
                color="text.secondary"
                sx={{ textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
              >
                {crumb.label}
              </Typography>
            ) : (
              <Typography key={crumb.label} variant="body2" color="text.primary">
                {crumb.label}
              </Typography>
            ),
          )}
        </Breadcrumbs>
      )}
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", rowGap: 2 }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
          {backHref && (
            <IconButton
              component={Link}
              href={backHref}
              size="small"
              aria-label="Back"
              sx={{ mt: 0.5 }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          )}
          <Box>
            <Typography variant="h4" component="h1">
              {title}
            </Typography>
            {description &&
              (typeof description === "string" ? (
                <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                  {description}
                </Typography>
              ) : (
                <Box sx={{ mt: 0.5 }}>{description}</Box>
              ))}
          </Box>
        </Stack>
        {action && <Box>{action}</Box>}
      </Stack>
    </Box>
  );
}
