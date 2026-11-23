// The behaviour every page shares: bar, menus, theme, notices, image zoom, table of contents. Nothing else runs on a
// marketing page, so keep it small.
import "@/lib/pwa-install"; // catches the browser's "install this web app" event (src/lib/pwa-install.ts)

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s)];
const stored = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return "blocked";
  }
};
const store = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    // Private mode: the choice lasts for this page.
  }
};
const fromTemplate = (id: string) => ($<HTMLTemplateElement>(`#${id}`)?.content.firstElementChild?.cloneNode(true) as HTMLElement | undefined) ?? null;

// Bar: flush at the top, a floating island once the page scrolls.
const header = $("[data-site-header]");
if (header) {
  const parts = [header, ...$$("[data-swap]", header)].map((el) => ({ el, rest: el.className, swap: el.dataset.swap!.split("|") as [string, string] }));
  let was = false;
  const onScroll = () => {
    const scrolled = scrollY > 8;
    if (scrolled === was) return;
    was = scrolled;
    for (const { el, rest, swap } of parts) el.className = scrolled ? rest.replace(swap[0], swap[1]) : rest;
  };
  onScroll();
  addEventListener("scroll", onScroll, { passive: true });
}

// Menus.
function closeLanguage(focus = false) {
  for (const box of $$("[data-language]")) {
    const menu = $("[role=listbox]", box);
    if (!menu) continue;
    menu.remove();
    const button = $("button", box)!;
    button.setAttribute("aria-expanded", "false");
    if (focus) button.focus();
  }
}
function togglePhoneMenu(button: HTMLElement, open = button.getAttribute("aria-expanded") !== "true") {
  $("[data-phone-menu]")?.remove();
  if (open) {
    const menu = fromTemplate("phone-menu")!;
    menu.dataset.phoneMenu = "";
    header!.append(menu);
  }
  button.setAttribute("aria-expanded", String(open));
  const other = button.dataset.labelClose!;
  button.dataset.labelClose = button.getAttribute("aria-label")!;
  button.setAttribute("aria-label", other);
  $$(".i", button).forEach((i) => i.classList.toggle("hidden"));
}

function setTheme(light: boolean) {
  const root = document.documentElement;
  root.classList.toggle("light", light);
  root.classList.toggle("dark", !light);
  const color = light ? "#f7f9fd" : "#030711"; // THEME_COLORS in src/lib/site-shell.ts
  $$<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => (m.content = color));
}

document.addEventListener("click", (e) => {
  const at = e.target as Element;
  const menuButton = at.closest<HTMLElement>("[data-menu]");
  if (menuButton) return togglePhoneMenu(menuButton);

  const option = at.closest<HTMLAnchorElement>("[data-locale]");
  if (option) {
    e.preventDefault();
    const { locale } = option.dataset;
    closeLanguage();
    if (locale === document.documentElement.lang) return;
    // The address alone would send the reader back to the language their browser remembers.
    document.cookie = `NEXT_LOCALE=${locale}; path=/; samesite=lax`;
    location.replace(option.href);
    return;
  }
  const language = at.closest<HTMLElement>("[data-language]");
  const wasOpen = language && $("[role=listbox]", language);
  closeLanguage();
  if (language && !wasOpen) {
    language.append(fromTemplate("language-menu")!);
    $("button", language)!.setAttribute("aria-expanded", "true");
  }

  if (at.closest("[data-phone-menu] a")) {
    const b = $("[data-menu]");
    if (b) togglePhoneMenu(b, false);
  }
  if (at.closest("[data-theme-toggle]")) {
    const light = !document.documentElement.classList.contains("light");
    setTheme(light);
    store("bishare-theme", light ? "light" : "dark");
  }
  if (at.closest("[data-app-bar-close]")) {
    store("bishare-app-bar", "1");
    document.documentElement.removeAttribute("data-app-bar");
  }
  const video = at.closest<HTMLElement>("[data-video]");
  if (video) {
    const player = document.createElement("iframe");
    player.className = "absolute inset-0 h-full w-full";
    player.src = `https://www.youtube-nocookie.com/embed/${video.dataset.video}?autoplay=1&rel=0&playsinline=1`;
    player.title = video.dataset.title!;
    player.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    player.allowFullscreen = true;
    player.referrerPolicy = "strict-origin-when-cross-origin";
    video.replaceWith(player);
  }
  const img = at.closest<HTMLImageElement>(".blog-prose img, figure[data-zoom] img");
  if (img && !img.closest("a") && $("#lightbox")) zoom(img);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLanguage(true);
});

// Image zoom: full screen, about twice the screen's width on a phone so small labels can be read.
function zoom(img: HTMLImageElement) {
  const label = $("#lightbox")!.dataset.close!;
  const back = document.activeElement as HTMLElement | null;
  const overflow = document.body.style.overflow;
  const box = document.createElement("div");
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", img.alt || "Expanded image");
  box.className = "fixed inset-0 z-[90] flex items-center justify-start overflow-auto bg-background/95 p-4 backdrop-blur-sm sm:justify-center sm:p-8";
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className = "fixed right-4 top-4 z-10 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-lg hover:bg-secondary";
  const big = document.createElement("img");
  big.src = img.currentSrc || img.src;
  big.alt = img.alt;
  big.className = "h-auto w-[220vw] max-w-none shrink-0 rounded-lg border border-border sm:w-full sm:max-w-[1200px] sm:shrink";
  box.append(button, big);
  const close = () => {
    box.remove();
    document.body.style.overflow = overflow;
    removeEventListener("keydown", onKey);
    back?.focus?.();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") close();
    if (e.key === "Tab") e.preventDefault(); // the close button is the only control
  };
  box.addEventListener("click", (e) => e.target !== big && close());
  addEventListener("keydown", onKey);
  document.body.style.overflow = "hidden";
  (($("[class*='font-sans']") as HTMLElement | null) ?? document.body).append(box);
  button.focus();
}

// Table of contents, from the page's own headings, with a reading-progress line.
for (const place of $$("[data-toc]")) {
  const heads = $$(place.dataset.toc!);
  if (!heads.length) continue;
  const bar = document.createElement("div");
  bar.ariaHidden = "true";
  bar.className = "fixed inset-x-0 top-0 z-[60] h-[2px] bg-transparent";
  const fill = document.createElement("div");
  fill.className = "h-full bg-accent-blue";
  bar.append(fill);
  const nav = document.createElement("nav");
  nav.ariaLabel = "Table of contents";
  nav.className = "text-[13px] leading-snug";
  const title = document.createElement("p");
  title.className = "font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground";
  title.textContent = place.dataset.label!;
  const list = document.createElement("ul");
  list.className = "mt-3 space-y-1 border-l border-border";
  const links = heads.map((h) => {
    const a = document.createElement("a");
    a.href = `#${h.id}`;
    a.textContent = h.textContent;
    const li = document.createElement("li");
    li.append(a);
    list.append(li);
    return a;
  });
  const mark = (id: string) =>
    links.forEach((a) => {
      const on = a.hash === `#${id}`;
      a.className = `block border-l-2 py-1 pl-3 ${on ? "border-accent-blue font-medium text-foreground" : "-ml-px border-transparent text-muted-foreground hover:text-foreground"}`;
      if (on) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  mark("");
  nav.append(title, list);
  place.replaceWith(bar, nav);
  const io = new IntersectionObserver(
    (entries) => {
      const last = entries.filter((x) => x.isIntersecting).pop();
      if (last) mark(last.target.id);
    },
    { rootMargin: "-80px 0px -70% 0px" },
  );
  heads.forEach((h) => io.observe(h));
  const progress = () => {
    const d = document.documentElement;
    const max = d.scrollHeight - d.clientHeight;
    fill.style.width = `${max > 0 ? Math.min(1, d.scrollTop / max) * 100 : 0}%`;
  };
  progress();
  addEventListener("scroll", progress, { passive: true });
}

// Cookie notice, after the main content has painted so it never counts as the page's largest paint.
const reveal = () => {
  if (stored("bishare-cookie-notice")) return;
  const notice = fromTemplate("cookie-notice");
  if (!notice) return;
  $("button", notice)!.addEventListener("click", () => {
    store("bishare-cookie-notice", "1");
    notice.remove();
  });
  document.body.append(notice);
};
if ("requestIdleCallback" in window) requestIdleCallback(reveal, { timeout: 2500 });
else setTimeout(reveal, 1800);

if ("serviceWorker" in navigator) {
  const register = () => void navigator.serviceWorker.register("/sw.js").catch(() => {});
  if (document.readyState === "complete") register();
  else addEventListener("load", register, { once: true });
}
