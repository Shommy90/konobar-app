import Container from "@mui/material/Container";
import { LoadingOverlay } from "@/components/LoadingOverlay";

export default function Loading() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <LoadingOverlay fullSection label="Loading restaurant..." />
    </Container>
  );
}
