"use client";

/**
 * Start a browser download through a hidden anchor instead of navigating
 * `window.location` at the file URL (review #16): the page — and any
 * one-time/expiry state it is showing — stays alive if the server answers
 * with an error, and in-flight React state is never torn down mid-download.
 */
export function triggerBrowserDownload(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => a.remove(), 1000);
}
