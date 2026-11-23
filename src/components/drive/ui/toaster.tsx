import { useEffect, useState, type Child } from "@/jsx";
import { CheckCircle2, OctagonXIcon } from "@/ui/icons";

// The messages at the bottom of the Drive (drive.css, .toast). At most three, the newest at the front.

interface Options {
  description?: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}
interface Shown extends Options {
  id: number;
  text: string;
  tone?: "ok" | "error";
}

let list: Shown[] = [];
let next = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function add(text: string, o: Options = {}, tone?: "ok" | "error") {
  list = [...list, { ...o, text, tone, id: next++ }].slice(-3);
  emit();
}
const remove = (id: number) => {
  list = list.filter((t) => t.id !== id);
  emit();
};

export const toast = Object.assign((text: string, o?: Options) => add(text, o), {
  success: (text: string, o?: Options) => add(text, o, "ok"),
  error: (text: string, o?: Options) => add(text, o, "error"),
});

function Toast({ t, paused }: { t: Shown; paused: boolean }) {
  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => remove(t.id), t.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [paused, t.id]);
  const icon: Child = t.tone === "ok" ? <CheckCircle2 className="size-4" /> : t.tone === "error" ? <OctagonXIcon className="size-4" /> : null;
  return (
    <li className="toast" tabIndex={0}>
      {icon ? <div className="toast-icon">{icon}</div> : null}
      <div className="toast-content">
        <div className="toast-title">{t.text}</div>
        {t.description ? <div className="toast-description">{t.description}</div> : null}
      </div>
      {t.action ? (
        <button
          type="button"
          className="toast-button"
          onClick={() => {
            t.action!.onClick();
            remove(t.id);
          }}
        >
          {t.action.label}
        </button>
      ) : null}
    </li>
  );
}

export function Toaster() {
  const [shown, setShown] = useState(list);
  const [over, setOver] = useState(false);
  useEffect(() => {
    const l = () => setShown(list);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  return (
    <section aria-live="polite" aria-relevant="additions text" aria-atomic="false" aria-label="Notifications">
      {shown.length ? (
        <ol className="toasts" onMouseEnter={() => setOver(true)} onMouseLeave={() => setOver(false)}>
          {shown.map((t) => (
            <Toast key={t.id} t={t} paused={over} />
          ))}
        </ol>
      ) : null}
    </section>
  );
}
