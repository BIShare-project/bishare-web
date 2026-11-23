interface Code {
  getModules(): boolean[][];
}
declare const qrcodegen: {
  QrCode: { Ecc: Record<"LOW" | "MEDIUM" | "QUARTILE" | "HIGH", unknown>; encodeSegments(segments: unknown[], level: unknown, minVersion?: number): Code };
  QrSegment: { makeSegments(text: string): unknown[] };
};
export default qrcodegen;
