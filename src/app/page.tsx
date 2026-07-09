import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

export default function HomePage() {
  return (
    <Container maxWidth="md" sx={{ py: 8, textAlign: "center" }}>
      <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Konobar
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        QR table ordering for restaurants and cafes. Scan, browse the menu, order, done.
      </Typography>
      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
        <Button variant="contained" href="/login">
          Staff / Owner Login
        </Button>
        <Button variant="outlined" href="/super-admin">
          Super Admin
        </Button>
      </Box>
    </Container>
  );
}
