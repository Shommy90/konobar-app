"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import QrCodeScannerOutlinedIcon from "@mui/icons-material/QrCodeScannerOutlined";
import { QrScannerDialog } from "@/app/r/[restaurantSlug]/table/[tableToken]/QrScannerDialog";

export function SessionEndedScreen({
  restaurantName,
  tableName,
  message,
}: {
  restaurantName: string;
  tableName: string;
  message: string;
}) {
  const [scannerOpen, setScannerOpen] = useState(false);

  return (
    <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
      <EventBusyOutlinedIcon color="disabled" sx={{ fontSize: 56, mb: 2 }} />
      <Typography variant="h5" component="h1" gutterBottom>
        {restaurantName}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        {tableName}
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        {message}
      </Typography>
      <Button
        variant="contained"
        startIcon={<QrCodeScannerOutlinedIcon />}
        onClick={() => setScannerOpen(true)}
      >
        Scan QR Code
      </Button>
      <QrScannerDialog open={scannerOpen} onClose={() => setScannerOpen(false)} />
    </Container>
  );
}
