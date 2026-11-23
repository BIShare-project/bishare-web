interface AuroraBackgroundProps {
  /**
   * "hero"    — full three-blob field (blue→cyan, violet support, cyan floor).
   * "section" — half-size primary blob, violet dropped.
   * "footer"  — single bottom-anchored blue blob at low alpha.
   */
  variant?: "hero" | "section" | "footer";
  /**
   * Freeze the blob drift (`animation: none` via `.aurora-static`). Use for
   * decorative in-card halos (e.g. VisualFrame) so at most ONE animated
   * aurora runs per viewport — reserve animation for hero/finale sections.
   */
  static?: boolean;
  className?: string;
}

/**
 * Aurora mesh-gradient background (Nightglass §1.6). Server component.
 *
 * The positioned host MUST be `relative isolate overflow-hidden` — the blobs
 * are absolutely positioned at `z-index: -1` and blurred well past the box.
 * Without `isolate` the negative z-index escapes the host's stacking context
 * and the aurora paints BEHIND any opaque ancestor background, i.e. it
 * silently disappears (review #1). Never stack two auroras (or an aurora plus
 * another animated background) in the same viewport.
 */
export function AuroraBackground(_props: AuroraBackgroundProps) {
  // Geist redesign: the colorful aurora is retired. Kept as a no-op so the
  // pages that still request it (Section backdrop="aurora") render clean —
  // section backdrops are now the faint hairline grid instead.
  return null;
}
