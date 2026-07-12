import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Box sx={{ textAlign: "center", py: 6, px: 2 }}>
      {icon && (
        <Box
          sx={{
            display: "inline-flex",
            color: "text.disabled",
            mb: 1.5,
            "& svg": { fontSize: 40 },
          }}
        >
          {icon}
        </Box>
      )}
      <Typography variant="h6" component="p" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 360, mx: "auto", mb: action ? 3 : 0 }}
        >
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}
