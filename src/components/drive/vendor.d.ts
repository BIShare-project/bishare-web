// utif (TIFF decoding for previews) ships without types; only what previews.tsx uses.
declare module "utif" {
  interface Ifd {
    width: number;
    height: number;
  }
  const UTIF: {
    decode(buf: ArrayBuffer): Ifd[];
    decodeImage(buf: ArrayBuffer, ifd: Ifd): void;
    toRGBA8(ifd: Ifd): Uint8Array;
  };
  export default UTIF;
}
