"use client";

import { useEffect, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";

const DETECT_INTERVAL_MS = 300;
const UNSUPPORTED_MESSAGE =
  "This browser doesn't support in-app scanning. Use your phone's camera app to scan the table's QR code instead.";

function isBarcodeDetectorSupported() {
  return typeof window !== "undefined" && "BarcodeDetector" in window && !!window.BarcodeDetector;
}

function resolveSameOriginUrl(rawValue: string): URL | null {
  try {
    const url = new URL(rawValue, window.location.href);
    return url.origin === window.location.origin ? url : null;
  } catch {
    return null;
  }
}

// Mounted only while the dialog is open (Dialog discards children when
// closed), so the camera is acquired/released on every open/close rather
// than needing separate start/stop handlers.
function ScannerContent() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(() =>
    isBarcodeDetectorSupported() ? null : UNSUPPORTED_MESSAGE,
  );
  const [scanError, setScanError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const BarcodeDetectorCtor = window.BarcodeDetector;
    if (!BarcodeDetectorCtor) return;

    let cancelled = false;
    let stream: MediaStream | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let scanErrorTimeoutId: ReturnType<typeof setTimeout> | null = null;
    const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((mediaStream) => {
        if (cancelled) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = mediaStream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = mediaStream;
        video.play().then(() => setReady(true));

        intervalId = setInterval(() => {
          if (!video || video.readyState < video.HAVE_CURRENT_DATA) return;
          detector
            .detect(video)
            .then((barcodes) => {
              const rawValue = barcodes[0]?.rawValue;
              if (!rawValue) return;
              const target = resolveSameOriginUrl(rawValue);
              if (!target) {
                setScanError("That QR code doesn't belong to this restaurant. Try again.");
                if (scanErrorTimeoutId) clearTimeout(scanErrorTimeoutId);
                scanErrorTimeoutId = setTimeout(() => setScanError(null), 2500);
                return;
              }
              cancelled = true;
              window.location.href = target.toString();
            })
            .catch(() => {
              // Transient decode failures on a given frame are expected - keep polling.
            });
        }, DETECT_INTERVAL_MS);
      })
      .catch((err: DOMException) => {
        if (cancelled) return;
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setFatalError(
            "Camera access was denied. Allow camera access in your browser and try again.",
          );
        } else if (err.name === "NotFoundError") {
          setFatalError("No camera was found on this device.");
        } else {
          setFatalError("Couldn't access the camera.");
        }
      });

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      if (scanErrorTimeoutId) clearTimeout(scanErrorTimeoutId);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  if (fatalError) {
    return <Alert severity="warning">{fatalError}</Alert>;
  }

  return (
    <Box sx={{ position: "relative", aspectRatio: "1", bgcolor: "black", borderRadius: 1, overflow: "hidden" }}>
      {scanError && (
        <Alert
          severity="warning"
          sx={{ position: "absolute", top: 8, left: 8, right: 8, zIndex: 2 }}
        >
          {scanError}
        </Alert>
      )}
      {!ready && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress sx={{ color: "common.white" }} size={32} />
        </Box>
      )}
      <video
        ref={videoRef}
        muted
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </Box>
  );
}

export function QrScannerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Scan QR Code</DialogTitle>
      <DialogContent>{open && <ScannerContent />}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
