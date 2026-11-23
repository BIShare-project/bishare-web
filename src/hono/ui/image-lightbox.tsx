/** @jsxImportSource hono/jsx */

/** Turns on tap-to-zoom for article images (client/site.ts draws the overlay). */
export function ImageLightbox({ closeLabel = "Close" }: { closeLabel?: string } = {}) {
  return <template id="lightbox" data-close={closeLabel} />;
}
