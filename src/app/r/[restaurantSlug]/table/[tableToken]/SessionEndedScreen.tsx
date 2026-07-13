"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import QrCodeScannerOutlinedIcon from "@mui/icons-material/QrCodeScannerOutlined";
import { useToast } from "@/lib/toast/ToastProvider";

function resolveSameOriginUrl(rawValue: string): URL | null {
  try {
    const url = new URL(rawValue, window.location.href);
    return url.origin === window.location.origin ? url : null;
  } catch {
    return null;
  }
}

export function SessionEndedScreen({
  restaurantName,
  tableName,
  message,
}: {
  restaurantName: string;
  tableName: string;
  message: string;
}) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [scanning, setScanning] = useState(false);

  async function handleCapture(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!("BarcodeDetector" in window) || !window.BarcodeDetector) {
      toast.error("This browser can't read photos. Open your camera app and scan the QR code instead.");
      return;
    }

    setScanning(true);
    try {
      const bitmap = await createImageBitmap(file);
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      const barcodes = await detector.detect(bitmap);
      const rawValue = barcodes[0]?.rawValue;
      if (!rawValue) {
        toast.error("No QR code found in that photo. Try again.");
        return;
      }

      const target = resolveSameOriginUrl(rawValue);
      if (!target) {
        toast.error("That QR code doesn't belong to this restaurant.");
        return;
      }

      window.location.href = target.toString();
    } catch {
      toast.error("Couldn't read that photo. Try again.");
    } finally {
      setScanning(false);
    }
  }

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
        loading={scanning}
        onClick={() => fileInputRef.current?.click()}
      >
        Scan QR Code
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handleCapture}
      />
    </Container>
  );
}
