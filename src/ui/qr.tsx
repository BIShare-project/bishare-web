import qrcodegen from "@/lib/qr/qrcodegen";
import { useEffect, useRef } from "@/jsx";

// QR codes: as shapes in the page, and on a canvas for the ones that change many times a second.

type Level = "L" | "M" | "Q" | "H";
const { QrCode, QrSegment } = qrcodegen;
const LEVEL = { L: QrCode.Ecc.LOW, M: QrCode.Ecc.MEDIUM, Q: QrCode.Ecc.QUARTILE, H: QrCode.Ecc.HIGH };

const modules = (value: string, level: Level): boolean[][] => QrCode.encodeSegments(QrSegment.makeSegments(value), LEVEL[level], 1).getModules();

/** The dark modules as one path, a run of them at a time. */
function path(cells: boolean[][], margin: number): string {
  const out: string[] = [];
  cells.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (!row[x]) continue;
      const from = x;
      while (row[x + 1]) x++;
      out.push(`M${from + margin}${x === row.length - 1 ? "," : " "}${y + margin} h${x - from + 1}v1H${from + margin}z`);
    }
  });
  return out.join("");
}

interface Props {
  value: string;
  size?: number;
  level?: Level;
  marginSize?: number;
  bgColor?: string;
  fgColor?: string;
  className?: string;
  title?: string;
}

export function QRCodeSVG({ value, size = 128, level = "L", marginSize = 0, bgColor = "#FFFFFF", fgColor = "#000000", title, ...rest }: Props) {
  const cells = modules(value, level);
  const n = cells.length + marginSize * 2;
  return (
    <svg height={size} width={size} viewBox={`0 0 ${n} ${n}`} role="img" {...rest}>
      {title ? <title>{title}</title> : null}
      <path fill={bgColor} d={`M0,0 h${n}v${n}H0z`} shape-rendering="crispEdges" />
      <path fill={fgColor} d={path(cells, marginSize)} shape-rendering="crispEdges" />
    </svg>
  );
}

export function QRCodeCanvas({ value, size = 128, level = "L", marginSize = 0, bgColor = "#FFFFFF", fgColor = "#000000" }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const cells = modules(value, level);
    const n = cells.length + marginSize * 2;
    const ratio = window.devicePixelRatio || 1;
    canvas.height = canvas.width = size * ratio;
    ctx.scale((size / n) * ratio, (size / n) * ratio);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, n, n);
    ctx.fillStyle = fgColor;
    ctx.fill(new Path2D(path(cells, marginSize)));
  });
  return <canvas ref={ref} role="img" height={size} width={size} style={{ height: `${size}px`, width: `${size}px` }} />;
}
