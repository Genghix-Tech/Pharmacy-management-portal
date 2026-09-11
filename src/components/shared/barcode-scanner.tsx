"use client";

import { useEffect, useRef, useState } from "react";
import { Barcode, Camera, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Not every TS lib.dom.d.ts version ships BarcodeDetector types yet.
interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => BarcodeDetectorLike;
  }
}

/**
 * Reusable barcode input: always offers manual entry, and adds a live camera
 * scan (via the browser's BarcodeDetector API) on browsers that support it —
 * Chrome/Edge desktop and Android today. Safari/iOS fall back to manual
 * entry only, which is called out in the UI rather than silently missing.
 */
export function BarcodeScannerButton({ onScan }: { onScan: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [supported, setSupported] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // BarcodeDetector support can't be known during SSR — detect after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(typeof window !== "undefined" && "BarcodeDetector" in window);
  }, []);

  useEffect(() => {
    if (!open) {
      stopCamera();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(null);
      return;
    }
    if (supported) startCamera();
    return stopCamera;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, supported]);

  function stopCamera() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      const detector = new window.BarcodeDetector!({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"],
      });
      const loop = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          rafRef.current = requestAnimationFrame(loop);
          return;
        }
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            handleScanned(codes[0].rawValue);
            return;
          }
        } catch {
          // detection hiccup — keep trying
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch {
      setError("Camera access was denied or is unavailable. You can still type the barcode below.");
    }
  }

  function handleScanned(code: string) {
    stopCamera();
    setOpen(false);
    onScan(code);
  }

  function onManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleScanned(manualCode.trim());
    setManualCode("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        <Barcode /> Scan barcode
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan a barcode</DialogTitle>
          <DialogDescription>Point the camera at a barcode, or type it in manually.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {supported ? (
            <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
              <video ref={videoRef} className="size-full object-cover" muted playsInline />
              {scanning && (
                <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-primary/80" />
              )}
              <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1.5 text-xs text-white/80">
                <ScanLine className="size-3.5" /> Align the barcode within the frame
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed bg-muted/40 py-8 text-center text-sm text-muted-foreground">
              <Camera className="size-6" />
              Camera scanning isn&apos;t supported in this browser. Enter the barcode manually below.
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <form onSubmit={onManualSubmit} className="flex items-center gap-2">
            <Input
              autoFocus={!supported}
              placeholder="Enter barcode manually"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
            />
            <Button type="submit" disabled={!manualCode.trim()}>
              Use code
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
