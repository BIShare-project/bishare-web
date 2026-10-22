// Thumbnails made in the browser for what it uploads (VAULT-SPEC
// "Thumbnails"): the app's rules, a JPEG of at most 32 KB whose long edge is
// 320 px, of a photo or of a frame of a video. Best effort: null when this
// browser cannot decode the file (HEIC outside Safari, an odd codec).

export const MAX_JPEG = 32 * 1024;
const EDGE = 320;

export function wantsThumbnail(mime: string | undefined): boolean {
  return !!mime && (mime.startsWith("image/") || mime.startsWith("video/"));
}

type Source = { draw: CanvasImageSource; width: number; height: number; done: () => void };

async function imageSource(file: Blob): Promise<Source> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { draw: bmp, width: bmp.width, height: bmp.height, done: () => bmp.close() };
    } catch {
      // Fall through to an <img>, which knows a few more formats in some browsers.
    }
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
  return { draw: img, width: img.naturalWidth, height: img.naturalHeight, done: () => URL.revokeObjectURL(url) };
}

function videoSource(file: Blob): Promise<Source> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    const fail = () => {
      URL.revokeObjectURL(url);
      reject(new Error("video did not decode"));
    };
    const timer = setTimeout(fail, 15_000);
    v.onerror = () => {
      clearTimeout(timer);
      fail();
    };
    v.onloadedmetadata = () => {
      // A frame a little way in: the first one is often black.
      v.currentTime = Math.min(1, (v.duration || 0) / 10);
    };
    v.onseeked = () => {
      clearTimeout(timer);
      resolve({
        draw: v,
        width: v.videoWidth,
        height: v.videoHeight,
        done: () => {
          v.removeAttribute("src");
          v.load();
          URL.revokeObjectURL(url);
        },
      });
    };
    v.src = url;
  });
}

function toJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

export async function makeThumbnail(file: Blob, mime: string): Promise<Uint8Array | null> {
  if (!wantsThumbnail(mime)) return null;
  let src: Source;
  try {
    src = mime.startsWith("video/") ? await videoSource(file) : await imageSource(file);
  } catch {
    return null;
  }
  try {
    if (!src.width || !src.height) return null;
    let edge = EDGE;
    for (const quality of [0.72, 0.6, 0.48, 0.36]) {
      if (quality === 0.48) edge = Math.round(EDGE * 0.75);
      const scale = Math.min(1, edge / Math.max(src.width, src.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(src.width * scale));
      canvas.height = Math.max(1, Math.round(src.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(src.draw, 0, 0, canvas.width, canvas.height);
      const blob = await toJpeg(canvas, quality);
      if (blob && blob.size <= MAX_JPEG) return new Uint8Array(await blob.arrayBuffer());
    }
    return null;
  } catch {
    return null;
  } finally {
    src.done();
  }
}
