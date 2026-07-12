import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";

export function SessionEndedScreen({
  restaurantName,
  tableName,
  message,
}: {
  restaurantName: string;
  tableName: string;
  message: string;
}) {
  return (
    <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
      <EventBusyOutlinedIcon color="disabled" sx={{ fontSize: 56, mb: 2 }} />
      <Typography variant="h5" component="h1" gutterBottom>
        {restaurantName}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        {tableName}
      </Typography>
      <Typography variant="body1">{message}</Typography>
    </Container>
  );
}
