import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

type LoadingOverlayProps = {
  label?: string;
  size?: number;
  fullSection?: boolean;
};

/**
 * `fullSection` renders a centered spinner+label block, meant for route-level
 * `loading.tsx` files. Without it, renders a bare small spinner meant to sit
 * inline inside a pending submit button (e.g. as `startIcon`).
 */
export function LoadingOverlay({ label, size = 20, fullSection = false }: LoadingOverlayProps) {
  if (fullSection) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.5,
          py: 8,
        }}
      >
        <CircularProgress size={32} />
        {label && (
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        )}
      </Box>
    );
  }

  return <CircularProgress size={size} color="inherit" />;
}
