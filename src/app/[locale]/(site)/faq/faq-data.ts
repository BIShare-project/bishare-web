import type { LucideIcon } from "lucide-react";
import { ArrowLeftRight, Rocket, ShieldCheck, Wrench } from "lucide-react";

/**
 * FAQ structure (page-local). Only the non-translatable data lives here — the
 * group ordering, icons, item counts, and optional follow-up link hrefs. Every
 * user-facing string (labels, blurbs, questions, answers, link labels) comes
 * from the "faq" message namespace, keyed by group id + item index, so the
 * same source feeds both the rendered accordions and the FAQPage JSON-LD.
 */

export interface FaqItemMeta {
  /** Optional follow-up link href; its label comes from translations. */
  linkHref?: string;
}

export interface FaqGroupMeta {
  id: string;
  icon: LucideIcon;
  items: FaqItemMeta[];
}

export const FAQ_GROUPS: FaqGroupMeta[] = [
  {
    id: "getting-started",
    icon: Rocket,
    items: [{}, { linkHref: "/download" }, {}, {}],
  },
  {
    id: "transfers",
    icon: ArrowLeftRight,
    items: [{}, {}, {}, {}, {}],
  },
  {
    id: "privacy-security",
    icon: ShieldCheck,
    items: [{ linkHref: "/security" }, {}, {}, { linkHref: "/privacy" }],
  },
  {
    id: "troubleshooting",
    icon: Wrench,
    items: [{}, {}, {}],
  },
];
