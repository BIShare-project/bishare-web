import { useRef, useState } from "@/jsx";

/** Files dropped on an element. Folders and dragged text are not files. */
export function useDropzone({ onDrop }: { onDrop: (files: File[]) => void }) {
  const [isDragActive, setActive] = useState(false);
  // Enter and leave fire for every element inside; only the last leave is a real one.
  const depth = useRef(0);
  const hasFiles = (e: DragEvent) => [...(e.dataTransfer?.types ?? [])].includes("Files");
  const getRootProps = () => ({
    role: "presentation",
    onDragEnter: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current = (depth.current ?? 0) + 1;
      setActive(true);
    },
    onDragOver: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    },
    onDragLeave: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth.current = Math.max(0, (depth.current ?? 0) - 1);
      if (depth.current === 0) setActive(false);
    },
    onDrop: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current = 0;
      setActive(false);
      const items = [...(e.dataTransfer?.items ?? [])];
      const folders = items.map((i) => (i.kind === "file" ? i.webkitGetAsEntry?.()?.isDirectory : undefined));
      const files = [...(e.dataTransfer?.files ?? [])].filter((_, i) => !folders[i]);
      if (files.length) onDrop(files);
    },
  });
  return { getRootProps, isDragActive };
}
