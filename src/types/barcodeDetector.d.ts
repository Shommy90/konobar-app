// Not yet part of TypeScript's bundled DOM lib - see
// https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API
// (Chrome/Edge/Android + Safari 17+; no Firefox support, handled as a
// feature-detected fallback in QrScannerDialog).
interface BarcodeDetectorOptions {
  formats?: string[];
}

interface DetectedBarcode {
  rawValue: string;
}

declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions);
  static getSupportedFormats(): Promise<string[]>;
  detect(image: CanvasImageSource): Promise<DetectedBarcode[]>;
}

interface Window {
  BarcodeDetector?: typeof BarcodeDetector;
}
