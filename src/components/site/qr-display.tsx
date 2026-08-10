"use client";

import { QRCodeSVG } from "qrcode.react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface QRDisplayProps {
  value: string;
  /** QR module size in px (default 208). */
  size?: number;
  className?: string;
}

/**
 * Branded QR code (mirrors bishare_qr.dart): gradient frame, white inner
 * panel in both themes, centered brand badge. Level H keeps it scannable
 * under the badge.
 */
export function QRDisplay({ value, size = 208, className }: QRDisplayProps) {
  const badge = Math.round(size * 0.22);
  const icon = Math.round(badge * 0.45);

  return (
    <div
      className={cn("relative inline-block p-[3px] rounded-3xl", className)}
      style={{
        background:
          "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 30%, transparent))",
      }}
    >
      <div className="bg-white rounded-[21px] p-4">
        <QRCodeSVG
          value={value}
          size={size}
          level="H"
          fgColor="#000000"
          bgColor="#ffffff"
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="bg-white rounded-full p-[4px]"
          style={{ width: badge, height: badge }}
        >
          <div
            className="w-full h-full rounded-full flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 76%, black))",
            }}
          >
            <Send className="text-white" style={{ width: icon, height: icon }} />
          </div>
        </div>
      </div>
    </div>
  );
}
