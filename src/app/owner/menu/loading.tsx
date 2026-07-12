import Container from "@mui/material/Container";
import { LoadingOverlay } from "@/components/LoadingOverlay";

export default function Loading() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <LoadingOverlay fullSection label="Loading menu..." />
    </Container>
  );
}
