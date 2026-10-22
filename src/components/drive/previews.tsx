"use client";

// Previews for every kind of file the browser can make sense of, all made in
// this browser: an end-to-end encrypted file is never sent to an online
// viewer (Office Online, Google's) to be shown. Each library loads only when
// a file of its kind is opened.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Download, File, Folder, Loader2 } from "lucide-react";
import { saveBlob } from "@/lib/vault/download";
import { zipEntries, zipRead, type ZipEntry } from "@/lib/vault/zipread";
import { cn } from "@/lib/utils";
import { bytes } from "./format";
import { Button } from "./ui/button";

export type PreviewKind =
  | "image"
  | "heic"
  | "tiff"
  | "svg"
  | "video"
  | "audio"
  | "pdf"
  | "docx"
  | "sheet"
  | "slides"
  | "markdown"
  | "html"
  | "json"
  | "code"
  | "text"
  | "archive"
  | "font"
  | "rtf";

const EXT: Record<string, PreviewKind> = {};
const add = (kind: PreviewKind, list: string) => list.split(" ").forEach((e) => (EXT[e] = kind));
add("image", "jpg jpeg jfif png gif webp avif bmp ico");
add("heic", "heic heif");
add("tiff", "tif tiff");
add("svg", "svg");
add("video", "mp4 m4v mov webm ogv mkv avi 3gp");
add("audio", "mp3 m4a aac wav flac ogg oga opus weba");
add("pdf", "pdf");
add("docx", "docx dotx docm");
add("sheet", "xlsx xlsm xlsb xls ods csv tsv numbers");
add("slides", "pptx pptm odp");
add("markdown", "md markdown mdx");
add("html", "html htm xhtml");
add("json", "json geojson webmanifest");
add(
  "code",
  "js mjs cjs ts tsx jsx py rb go rs java kt kts swift c h cpp hpp cc cs php sh bash zsh fish ps1 bat cmd sql css scss sass less xml yaml yml toml ini cfg conf gradle dart lua r pl vue svelte graphql gql proto env gitignore dockerfile makefile tf hcl"
);
add("text", "txt log text nfo srt vtt");
add("archive", "zip jar apk aab ipa epub xpi cbz");
add("font", "ttf otf woff woff2");
add("rtf", "rtf");

const LANG: Record<string, string> = {
  js: "javascript", mjs: "javascript", cjs: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript", py: "python", rb: "ruby",
  rs: "rust", kt: "kotlin", kts: "kotlin", h: "c", hpp: "cpp", cc: "cpp", cs: "csharp", sh: "bash", zsh: "bash", fish: "bash", ps1: "powershell",
  bat: "dos", cmd: "dos", yml: "yaml", toml: "ini", cfg: "ini", conf: "ini", gradle: "gradle", pl: "perl", vue: "xml", svelte: "xml",
  gql: "graphql", proto: "protobuf", dockerfile: "dockerfile", makefile: "makefile", tf: "ini", hcl: "ini", json: "json", xml: "xml",
  html: "xml", css: "css", scss: "scss", less: "less", sql: "sql", go: "go", java: "java", swift: "swift", c: "c", cpp: "cpp", php: "php",
  dart: "dart", lua: "lua", r: "r", graphql: "graphql", ini: "ini", env: "ini", gitignore: "plaintext", yaml: "yaml",
};

export function extOf(name: string): string {
  const base = name.toLowerCase();
  if (base === "dockerfile" || base === "makefile") return base;
  return base.includes(".") ? base.split(".").pop()! : "";
}

/** What kind of preview a file gets, from its type and then its name. */
export function previewKindOf(name: string, mime: string | undefined): PreviewKind | null {
  const m = (mime ?? "").toLowerCase();
  const byExt = EXT[extOf(name)];
  if (byExt) return byExt;
  if (m === "image/heic" || m === "image/heif") return "heic";
  if (m === "image/tiff") return "tiff";
  if (m === "image/svg+xml") return "svg";
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  if (m === "application/pdf") return "pdf";
  if (m === "text/markdown") return "markdown";
  if (m === "text/html") return "html";
  if (m === "application/json") return "json";
  if (m.startsWith("text/")) return "text";
  return null;
}

/** The most bytes a preview of [kind] takes on; above it the file is offered as a download. */
export const PREVIEW_MAX: Record<PreviewKind, number> = {
  image: 192 << 20, heic: 60 << 20, tiff: 80 << 20, svg: 8 << 20, video: 192 << 20, audio: 192 << 20, pdf: 192 << 20,
  docx: 40 << 20, sheet: 40 << 20, slides: 60 << 20, markdown: 4 << 20, html: 4 << 20, json: 8 << 20, code: 4 << 20,
  text: 8 << 20, archive: 192 << 20, font: 20 << 20, rtf: 8 << 20,
};

function Busy({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-10 text-2xs text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
      {label}
    </div>
  );
}

function Problem({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex max-w-xs flex-col items-center gap-2 p-8 text-center">
      <p className="text-xs font-medium">{title}</p>
      <p className="text-2xs text-muted-foreground">{body}</p>
      {action}
    </div>
  );
}

/** A file's preview from its opened bytes. */
export function FilePreview({ kind, blob, name, onDownload }: { kind: PreviewKind; blob: Blob; name: string; onDownload: () => void }) {
  const t = useTranslations("drive");
  const download = (
    <Button variant="outline" size="sm" className="mt-1" onClick={onDownload}>
      <Download /> {t("act.download")}
    </Button>
  );
  const failed = <Problem title={t("viewer.failed")} body={t("preview.notReadable")} action={download} />;
  switch (kind) {
    case "image":
    case "svg":
      return <ImagePreview blob={blob} name={name} />;
    case "heic":
      return <HeicPreview blob={blob} name={name} fallback={failed} />;
    case "tiff":
      return <TiffPreview blob={blob} name={name} fallback={failed} />;
    case "video":
    case "audio":
      return <MediaPreview blob={blob} kind={kind} fallback={<Problem title={t("preview.cantPlay")} body={t("preview.cantPlayBody")} action={download} />} />;
    case "pdf":
      return <PdfPreview blob={blob} name={name} />;
    case "docx":
      return <DocxPreview blob={blob} fallback={failed} />;
    case "sheet":
      return <SheetPreview blob={blob} name={name} fallback={failed} />;
    case "slides":
      return <SlidesPreview blob={blob} name={name} fallback={failed} />;
    case "markdown":
      return <MarkdownPreview blob={blob} />;
    case "html":
      return <HtmlPreview blob={blob} name={name} />;
    case "json":
    case "code":
      return <CodePreview blob={blob} name={name} kind={kind} />;
    case "text":
      return <TextPreview blob={blob} />;
    case "rtf":
      return <RtfPreview blob={blob} />;
    case "archive":
      return <ArchivePreview blob={blob} fallback={failed} />;
    case "font":
      return <FontPreview blob={blob} name={name} fallback={failed} />;
  }
}

function useObjectUrl(blob: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) return setUrl(null);
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}

function ImagePreview({ blob, name }: { blob: Blob; name: string }) {
  const url = useObjectUrl(blob);
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img src={url} alt={name} className="max-h-[62vh] w-full object-contain" /> : null;
}

function HeicPreview({ blob, name, fallback }: { blob: Blob; name: string; fallback: ReactNode }) {
  const t = useTranslations("drive");
  const [shown, setShown] = useState<Blob | null>(null);
  const [state, setState] = useState<"try" | "convert" | "failed">("try");
  const url = useObjectUrl(shown ?? (state === "try" ? blob : null));
  useEffect(() => {
    if (state !== "convert") return;
    let live = true;
    void (async () => {
      try {
        const heic2any = (await import("heic2any")).default;
        const out = await heic2any({ blob, toType: "image/jpeg", quality: 0.9 });
        if (live) setShown(Array.isArray(out) ? out[0]! : out);
      } catch {
        if (live) setState("failed");
      }
    })();
    return () => {
      live = false;
    };
  }, [state, blob]);
  if (state === "failed") return <>{fallback}</>;
  if (state === "convert" && !shown) return <Busy label={t("preview.converting")} />;
  // Safari shows HEIC itself; elsewhere the <img> fails and the file is converted here.
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img src={url} alt={name} className="max-h-[62vh] w-full object-contain" onError={() => !shown && setState("convert")} /> : null;
}

function TiffPreview({ blob, name, fallback }: { blob: Blob; name: string; fallback: ReactNode }) {
  const t = useTranslations("drive");
  const [png, setPng] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const UTIF = (await import("utif")).default;
        const buf = await blob.arrayBuffer();
        const ifds = UTIF.decode(buf);
        UTIF.decodeImage(buf, ifds[0]);
        const rgba = UTIF.toRGBA8(ifds[0]);
        const canvas = document.createElement("canvas");
        canvas.width = ifds[0].width;
        canvas.height = ifds[0].height;
        const ctx = canvas.getContext("2d")!;
        const img = ctx.createImageData(canvas.width, canvas.height);
        img.data.set(rgba);
        ctx.putImageData(img, 0, 0);
        if (live) setPng(canvas.toDataURL("image/png"));
      } catch {
        if (live) setFailed(true);
      }
    })();
    return () => {
      live = false;
    };
  }, [blob]);
  if (failed) return <>{fallback}</>;
  // eslint-disable-next-line @next/next/no-img-element
  return png ? <img src={png} alt={name} className="max-h-[62vh] w-full object-contain" /> : <Busy label={t("preview.converting")} />;
}

function MediaPreview({ blob, kind, fallback }: { blob: Blob; kind: "video" | "audio"; fallback: ReactNode }) {
  const url = useObjectUrl(blob);
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  if (!url) return null;
  return kind === "video" ? (
    <video src={url} controls autoPlay playsInline className="max-h-[62vh] w-full bg-black" onError={() => setFailed(true)} />
  ) : (
    <div className="w-full p-8">
      <audio src={url} controls autoPlay className="w-full" onError={() => setFailed(true)} />
    </div>
  );
}

function PdfPreview({ blob, name }: { blob: Blob; name: string }) {
  const url = useObjectUrl(blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" }));
  return url ? <iframe src={url} title={name} className="h-[62vh] w-full border-0 bg-white" /> : null;
}

function DocxPreview({ blob, fallback }: { blob: Blob; fallback: ReactNode }) {
  const t = useTranslations("drive");
  const outer = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"busy" | "done" | "failed">("busy");
  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const { renderAsync } = await import("docx-preview");
        if (!body.current) return;
        body.current.innerHTML = "";
        await renderAsync(blob, body.current, undefined, { inWrapper: true, breakPages: true, ignoreLastRenderedPageBreak: true, renderComments: false, useBase64URL: true });
        if (live) setState("done");
      } catch {
        if (live) setState("failed");
      }
    })();
    return () => {
      live = false;
    };
  }, [blob]);
  // Pages keep their real width; the whole document is scaled to fit the sheet.
  useEffect(() => {
    const el = outer.current;
    const inner = body.current;
    if (!el || !inner || state !== "done") return;
    const fit = () => {
      const page = inner.querySelector<HTMLElement>("section.docx");
      const w = page?.offsetWidth ?? 0;
      inner.style.zoom = w ? String(Math.min(1, (el.clientWidth - 24) / w)) : "1";
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [state]);
  if (state === "failed") return <>{fallback}</>;
  return (
    <div ref={outer} className="max-h-[62vh] w-full overflow-auto bg-muted p-3">
      {state === "busy" ? <Busy label={t("preview.rendering")} /> : null}
      <div ref={body} className="[&_.docx-wrapper]:bg-transparent [&_.docx-wrapper]:p-0 [&_section.docx]:mb-3 [&_section.docx]:shadow-md" />
    </div>
  );
}

const MAX_ROWS = 1000;
const MAX_COLS = 60;

function colName(i: number): string {
  let s = "";
  for (i++; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s;
  return s;
}

function SheetPreview({ blob, name, fallback }: { blob: Blob; name: string; fallback: ReactNode }) {
  const t = useTranslations("drive");
  const [book, setBook] = useState<{ names: string[]; rows: (name: string) => string[][]; total: (name: string) => number } | null>(null);
  const [sheet, setSheet] = useState(0);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const XLSX = await import("xlsx");
        const ext = extOf(name);
        const wb =
          ext === "csv" || ext === "tsv"
            ? XLSX.read(await blob.text(), { type: "string", FS: ext === "tsv" ? "\t" : undefined, raw: true })
            : XLSX.read(new Uint8Array(await blob.arrayBuffer()), { type: "array", cellDates: true, sheetRows: MAX_ROWS + 1 });
        if (!live) return;
        setBook({
          names: wb.SheetNames,
          rows: (n) => (XLSX.utils.sheet_to_json(wb.Sheets[n]!, { header: 1, raw: false, defval: "", blankrows: true }) as string[][]).slice(0, MAX_ROWS),
          total: (n) => {
            const ref = wb.Sheets[n]?.["!ref"];
            return ref ? XLSX.utils.decode_range(ref).e.r + 1 : 0;
          },
        });
      } catch {
        if (live) setFailed(true);
      }
    })();
    return () => {
      live = false;
    };
  }, [blob, name]);
  if (failed) return <>{fallback}</>;
  if (!book) return <Busy label={t("preview.rendering")} />;
  const current = book.names[sheet] ?? book.names[0]!;
  const rows = book.rows(current);
  const width = Math.min(MAX_COLS, Math.max(1, ...rows.map((r) => r.length)));
  return (
    <div className="flex w-full flex-col">
      {book.names.length > 1 ? (
        <div className="flex gap-px overflow-x-auto border-b bg-border">
          {book.names.map((n, i) => (
            <button key={n} type="button" onClick={() => setSheet(i)} className={cn("shrink-0 bg-background px-3 py-1.5 text-2xs", i === sheet ? "font-medium text-foreground shadow-[inset_0_-2px_0_var(--blau)]" : "text-muted-foreground hover:text-foreground")}>
              {n}
            </button>
          ))}
        </div>
      ) : null}
      <div className="max-h-[58vh] overflow-auto bg-background">
        <table className="border-collapse font-mono text-3xs">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="sticky left-0 z-20 min-w-9 border bg-muted px-1.5 py-1 text-muted-foreground" />
              {Array.from({ length: width }, (_, c) => (
                <th key={c} className="min-w-20 border bg-muted px-2 py-1 font-medium text-muted-foreground">
                  {colName(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri}>
                <td className="sticky left-0 border bg-muted px-1.5 py-1 text-end text-muted-foreground">{ri + 1}</td>
                {Array.from({ length: width }, (_, c) => (
                  <td key={c} className="max-w-64 truncate border px-2 py-1" title={r[c] ?? ""}>
                    {r[c] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {book.total(current) > MAX_ROWS ? <p className="border-t px-3 py-2 text-3xs text-muted-foreground">{t("preview.sheetTruncated", { rows: MAX_ROWS })}</p> : null}
    </div>
  );
}

/** Text of an XML document's elements of one tag, paragraph by paragraph. */
function xmlParagraphs(xml: string, para: string, run: string): string[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const out: string[] = [];
  for (const p of Array.from(doc.getElementsByTagName(para))) {
    const text = Array.from(p.getElementsByTagName(run))
      .map((r) => r.textContent ?? "")
      .join("");
    if (text.trim()) out.push(text);
  }
  return out;
}

function SlidesPreview({ blob, name, fallback }: { blob: Blob; name: string; fallback: ReactNode }) {
  const t = useTranslations("drive");
  const [deck, setDeck] = useState<{ thumb: string | null; slides: string[][] } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    let thumbUrl: string | null = null;
    void (async () => {
      try {
        const buf = new Uint8Array(await blob.arrayBuffer());
        const entries = zipEntries(buf);
        if (!entries) throw new Error("not a zip");
        const text = async (e: ZipEntry) => new TextDecoder().decode(await zipRead(buf, e));
        const thumb = entries.find((e) => /^(docProps\/thumbnail\.(jpe?g|png)|Thumbnails\/thumbnail\.png)$/i.test(e.name));
        if (thumb) thumbUrl = URL.createObjectURL(new Blob([(await zipRead(buf, thumb)) as Uint8Array<ArrayBuffer>]));
        let slides: string[][] = [];
        if (extOf(name) === "odp") {
          const content = entries.find((e) => e.name === "content.xml");
          if (content) {
            const doc = new DOMParser().parseFromString(await text(content), "application/xml");
            slides = Array.from(doc.getElementsByTagName("draw:page")).map((page) =>
              Array.from(page.getElementsByTagName("text:p"))
                .map((p) => p.textContent ?? "")
                .filter((s) => s.trim())
            );
          }
        } else {
          const files = entries
            .filter((e) => /^ppt\/slides\/slide\d+\.xml$/.test(e.name))
            .sort((a, b) => Number(/(\d+)\.xml$/.exec(a.name)![1]) - Number(/(\d+)\.xml$/.exec(b.name)![1]));
          for (const f of files) slides.push(xmlParagraphs(await text(f), "a:p", "a:t"));
        }
        if (live) setDeck({ thumb: thumbUrl, slides });
      } catch {
        if (live) setFailed(true);
      }
    })();
    return () => {
      live = false;
      if (thumbUrl) URL.revokeObjectURL(thumbUrl);
    };
  }, [blob, name]);
  if (failed) return <>{fallback}</>;
  if (!deck) return <Busy label={t("preview.rendering")} />;
  return (
    <div className="max-h-[62vh] w-full overflow-auto bg-muted p-3">
      {deck.thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={deck.thumb} alt="" className="mb-3 w-full border bg-white shadow-sm" />
      ) : null}
      <p className="mb-2 text-3xs text-muted-foreground">{t("preview.slidesNote", { n: deck.slides.length })}</p>
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {deck.slides.map((lines, i) => (
          <li key={i} className="border bg-background p-3">
            <div className="mb-1 text-3xs font-semibold text-muted-foreground">{t("preview.slide", { n: i + 1 })}</div>
            {lines.length ? (
              lines.map((l, j) => (
                <p key={j} className={cn("m-0 text-2xs", j === 0 && "text-xs font-semibold")}>
                  {l}
                </p>
              ))
            ) : (
              <p className="m-0 text-2xs text-muted-foreground">{t("preview.slideNoText")}</p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function MarkdownPreview({ blob }: { blob: Blob }) {
  const t = useTranslations("drive");
  const [html, setHtml] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    void (async () => {
      const [{ marked }, DOMPurify] = await Promise.all([import("marked"), import("dompurify").then((m) => m.default)]);
      const raw = await marked.parse(await blob.text(), { gfm: true, async: true });
      // Nothing from outside: images only from inside the file, links open apart.
      DOMPurify.addHook("afterSanitizeAttributes", (node) => {
        if (node.tagName === "IMG" && !/^data:/i.test(node.getAttribute("src") ?? "")) node.removeAttribute("src");
        if (node.tagName === "A") {
          node.setAttribute("target", "_blank");
          node.setAttribute("rel", "noopener noreferrer");
        }
      });
      const clean = DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
      DOMPurify.removeHook("afterSanitizeAttributes");
      if (live) setHtml(clean);
    })();
    return () => {
      live = false;
    };
  }, [blob]);
  if (html === null) return <Busy label={t("preview.rendering")} />;
  return <article className="md-prose max-h-[62vh] w-full overflow-auto bg-background px-6 py-5" dangerouslySetInnerHTML={{ __html: html }} />;
}

function HtmlPreview({ blob, name }: { blob: Blob; name: string }) {
  const t = useTranslations("drive");
  const [doc, setDoc] = useState<string | null>(null);
  useEffect(() => {
    void blob.text().then((s) =>
      // No scripts (sandbox) and nothing fetched from outside (the policy).
      setDoc(`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; font-src data:">${s}`)
    );
  }, [blob]);
  if (doc === null) return <Busy label={t("preview.rendering")} />;
  return (
    <div className="flex w-full flex-col">
      <iframe sandbox="" srcDoc={doc} title={name} className="h-[58vh] w-full border-0 bg-white" />
      <p className="border-t px-3 py-2 text-3xs text-muted-foreground">{t("preview.htmlNote")}</p>
    </div>
  );
}

const CODE_HIGHLIGHT_MAX = 400 * 1024;

function CodePreview({ blob, name, kind }: { blob: Blob; name: string; kind: "code" | "json" }) {
  const t = useTranslations("drive");
  const [out, setOut] = useState<{ html: string | null; text: string } | null>(null);
  useEffect(() => {
    let live = true;
    void (async () => {
      let text = await blob.text();
      if (kind === "json") {
        try {
          text = JSON.stringify(JSON.parse(text), null, 2);
        } catch {
          // Shown as it is.
        }
      }
      let html: string | null = null;
      if (text.length <= CODE_HIGHLIGHT_MAX) {
        try {
          const hljs = (await import("highlight.js/lib/common")).default;
          const lang = kind === "json" ? "json" : LANG[extOf(name)] ?? extOf(name);
          html = hljs.getLanguage(lang) ? hljs.highlight(text, { language: lang, ignoreIllegals: true }).value : null;
        } catch {
          html = null;
        }
      }
      if (live) setOut({ html, text });
    })();
    return () => {
      live = false;
    };
  }, [blob, name, kind]);
  if (!out) return <Busy label={t("preview.rendering")} />;
  const lines = out.text.split("\n").length;
  return (
    <div className="max-h-[62vh] w-full overflow-auto bg-background">
      <div className="flex min-w-max font-mono text-3xs leading-5">
        <pre aria-hidden className="m-0 shrink-0 border-e bg-muted/50 px-3 py-3 text-end text-muted-foreground select-none">
          {Array.from({ length: lines }, (_, i) => i + 1).join("\n")}
        </pre>
        {out.html !== null ? (
          <pre className="hljs m-0 px-4 py-3" dangerouslySetInnerHTML={{ __html: out.html }} />
        ) : (
          <pre className="m-0 px-4 py-3">{out.text}</pre>
        )}
      </div>
    </div>
  );
}

function TextPreview({ blob }: { blob: Blob }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    void blob.text().then(setText);
  }, [blob]);
  return <pre className="m-0 max-h-[62vh] w-full overflow-auto bg-background p-4 font-mono text-2xs leading-relaxed whitespace-pre-wrap">{text ?? ""}</pre>;
}

/** The words of an RTF file, without its formatting. */
function rtfText(rtf: string): string {
  return rtf
    .replace(/\{\\\*[^{}]*\}/g, "")
    .replace(/\\par[d]?\b ?/g, "\n")
    .replace(/\\tab\b ?/g, "\t")
    .replace(/\\'([0-9a-f]{2})/gi, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\u(-?\d+)\??/g, (_, n: string) => String.fromCharCode(Number(n) < 0 ? Number(n) + 65536 : Number(n)))
    .replace(/\\[a-z]+-?\d* ?/gi, "")
    .replace(/[{}]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function RtfPreview({ blob }: { blob: Blob }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    void blob.text().then((s) => setText(rtfText(s)));
  }, [blob]);
  return <pre className="m-0 max-h-[62vh] w-full overflow-auto bg-background p-5 font-sans text-xs leading-relaxed whitespace-pre-wrap">{text ?? ""}</pre>;
}

function ArchivePreview({ blob, fallback }: { blob: Blob; fallback: ReactNode }) {
  const t = useTranslations("drive");
  const locale = useLocale();
  const [data, setData] = useState<{ buf: Uint8Array; entries: ZipEntry[] } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    void (async () => {
      const buf = new Uint8Array(await blob.arrayBuffer());
      const entries = zipEntries(buf);
      if (!live) return;
      if (!entries) setFailed(true);
      else setData({ buf, entries });
    })();
    return () => {
      live = false;
    };
  }, [blob]);
  if (failed) return <>{fallback}</>;
  if (!data) return <Busy label={t("preview.rendering")} />;
  const files = data.entries.filter((e) => !e.dir);
  const total = files.reduce((a, e) => a + e.size, 0);
  const fmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  return (
    <div className="flex w-full flex-col">
      <p className="border-b bg-background px-4 py-2 text-3xs text-muted-foreground">{t("preview.archiveSummary", { n: files.length, size: bytes(total) })}</p>
      <ul className="m-0 max-h-[56vh] list-none overflow-auto bg-background p-0">
        {data.entries.slice(0, 2000).map((e) => {
          const depth = e.name.replace(/\/$/, "").split("/").length - 1;
          const label = e.name.replace(/\/$/, "").split("/").pop();
          return (
            <li key={e.name} className="group flex items-center gap-2 border-b px-3 py-1.5 text-2xs" style={{ paddingInlineStart: 12 + depth * 14 }}>
              {e.dir ? <Folder className="size-3.5 shrink-0 text-blau" /> : <File className="size-3.5 shrink-0 text-muted-foreground" />}
              <span className="min-w-0 flex-1 truncate">{label}</span>
              {e.dir ? null : (
                <>
                  <span className="hidden text-3xs text-muted-foreground sm:inline">{fmt.format(new Date(e.mtimeMs))}</span>
                  <span className="w-16 text-end text-3xs text-muted-foreground tabular-nums">{bytes(e.size)}</span>
                  <button
                    type="button"
                    aria-label={t("act.download")}
                    className="grid size-6 place-items-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground"
                    onClick={async () => saveBlob(new Blob([(await zipRead(data.buf, e)) as Uint8Array<ArrayBuffer>]), label ?? "file")}
                  >
                    <Download className="size-3.5" />
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FontPreview({ blob, name, fallback }: { blob: Blob; name: string; fallback: ReactNode }) {
  const t = useTranslations("drive");
  const [family, setFamily] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let face: FontFace | null = null;
    let live = true;
    void (async () => {
      try {
        const fam = `drive-preview-${Math.random().toString(36).slice(2)}`;
        face = new FontFace(fam, await blob.arrayBuffer());
        await face.load();
        document.fonts.add(face);
        if (live) setFamily(fam);
      } catch {
        if (live) setFailed(true);
      }
    })();
    return () => {
      live = false;
      if (face) document.fonts.delete(face);
    };
  }, [blob]);
  if (failed) return <>{fallback}</>;
  if (!family) return <Busy label={t("preview.rendering")} />;
  return (
    <div className="max-h-[62vh] w-full overflow-auto bg-background p-6" style={{ fontFamily: `"${family}"` }}>
      <p className="m-0 mb-4 font-sans text-3xs text-muted-foreground">{name}</p>
      {[56, 36, 24, 16].map((size) => (
        <p key={size} className="m-0 mb-3 leading-tight" style={{ fontSize: size }}>
          {size >= 36 ? "Aa Bb Gg 123" : t("preview.fontSample")}
        </p>
      ))}
      <p className="m-0 mt-4 text-base break-all">ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 !?&amp;@#%</p>
    </div>
  );
}
