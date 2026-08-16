# Blog backlog — planned articles (ship ONE at a time, full SEO pass each)

Owner's 20-title plan (2026-08-13). ✅ = published (in registry.ts).

## Cross-Platform File Transfer

1. ✅ How to Transfer Files from iPhone to Windows PC Without Cable
   — slug: transfer-files-from-iphone-to-windows-without-cable
2. ✅ 5 Easy Ways to Send Large Videos from Android to Mac
   — slug: send-large-videos-from-android-to-mac (scheduled 2026-08-15)
3. ✅ How to Share Files Between iOS and Android Instantly
   — slug: share-files-between-ios-and-android (scheduled 2026-08-18)
4. ✅ The Ultimate Guide to Wireless File Transfer Between PC and Mobile
   — slug: wireless-file-transfer-pc-mobile-guide (scheduled 2026-08-21)
5. ✅ How to Set Up a WebDAV Server to Connect Android with Mac
   — slug: webdav-server-android-mac (scheduled 2026-08-24)

## Large File Sharing & Productivity

6. ✅ How to Send 10GB Files Online for Free Without Compression
   — slug: send-10gb-files-online-free (scheduled 2026-08-27)
7. ✅ Fast Alternatives to WeTransfer for Sending Large Folders
   — slug: wetransfer-alternatives-large-folders (scheduled 2026-08-30)
8. ✅ How to Share High-Res Photos Locally Without Losing Quality
   — slug: share-high-res-photos-without-losing-quality (scheduled 2026-09-02)
9. ✅ The Best Ways to Send Massive Video Files to Your Clients
   — slug: send-massive-video-files-to-clients (scheduled 2026-09-05)
10. ✅ How to Transfer Large Files Instantly Without Cloud Storage Limits
    — slug: transfer-large-files-without-cloud-limits (scheduled 2026-09-08) — **kategori Large Files KOMPLIT 5/5**

## Security & Privacy

11. ✅ How to Securely Send Confidential Business Documents Wirelessly
    — slug: securely-send-confidential-documents (scheduled 2026-09-11)
12. ✅ What is End-to-End Encrypted File Sharing and Why Do You Need It?
    — slug: what-is-end-to-end-encrypted-file-sharing (scheduled 2026-09-14)
13. ✅ How to Transfer Private Data Locally Without Using the Internet
    — slug: transfer-files-locally-without-internet (scheduled 2026-09-17)
14. ✅ Safe File Sharing: How to Prevent Data Leaks During Transfer
    — slug: prevent-data-leaks-file-sharing (scheduled 2026-09-20) — **kategori Security KOMPLIT 4/4**

## Competitor Alternatives & App Features

15. ✅ Best SHAREit Alternatives in 2026: Fast, Lightweight, and Ad-Free
    — slug: best-shareit-alternatives (scheduled 2026-09-23)
16. ✅ BIShare Review: An Honest Tour From the Team That Built It
    — slug: bishare-review (scheduled 2026-09-26) — judul asli ("The Fastest…") DIUBAH: superlatif tak terverifikasi + menyamar sebagai review pihak ketiga. Artikel membuka dengan 5 alasan JANGAN pakai.
17. ✅ What is QUIC Protocol? The Technology Behind Ultra-Fast File Transfer
    — slug: what-is-quic-protocol (scheduled 2026-09-29)
18. ✅ How to Use Local Sharing to Transfer Files Without Using Cellular Data
    — slug: local-sharing-without-cellular-data (scheduled 2026-10-02)
19. ✅ Top 5 Ad-Free File Transfer Apps for Android and iOS
    — slug: ad-free-file-transfer-apps (scheduled 2026-10-05)
20. ☐ AirDrop for Windows: How to Get AirDrop-Like Speeds on Any PC
    — planned slug: airdrop-for-windows-speeds (mind cannibalization: the site already has /airdrop-for-windows landing — this article targets informational intent and links to it)

## Publish schedule (every 3 days — SET datePublished FROM THIS TABLE)

The infra auto-schedules: registry `datePublished` in the future = the article
stays hidden from index/article/RSS/sitemap until that UTC date arrives (pages
are SSR'd, so it appears by itself — no redeploy). Write ahead freely; the date
does the publishing.

| # | Article | datePublished |
|---|---------|---------------|
| 1 | see list above (#1) | 2026-08-12 |
| 2 | see list above (#2) | 2026-08-15 |
| 3 | see list above (#3) | 2026-08-18 |
| 4 | see list above (#4) | 2026-08-21 |
| 5 | see list above (#5) | 2026-08-24 |
| 6 | see list above (#6) | 2026-08-27 |
| 7 | see list above (#7) | 2026-08-30 |
| 8 | see list above (#8) | 2026-09-02 |
| 9 | see list above (#9) | 2026-09-05 |
| 10 | see list above (#10) | 2026-09-08 |
| 11 | see list above (#11) | 2026-09-11 |
| 12 | see list above (#12) | 2026-09-14 |
| 13 | see list above (#13) | 2026-09-17 |
| 14 | see list above (#14) | 2026-09-20 |
| 15 | see list above (#15) | 2026-09-23 |
| 16 | see list above (#16) | 2026-09-26 |
| 17 | see list above (#17) | 2026-09-29 |
| 18 | see list above (#18) | 2026-10-02 |
| 19 | see list above (#19) | 2026-10-05 |
| 20 | see list above (#20) | 2026-10-08 |

## Per-article SEO checklist (apply to every publish)

- ≥3,000 words; primary keyword in H1 / metaTitle (≤60ch) / first 100 words / one H2.
- Derived keywords each get an H2/H3; natural density, no stuffing.
- metaTitle + description (~155ch) unique; slug short + keyword.
- ≥2 images with descriptive alt: branded hero SVG + one explanatory diagram in the body.
- **Run `node tool/hero-raster.mjs` after adding the hero** — og:image and
  BlogPosting.image point at `<hero>.jpg`; SVG is not a valid format for either.
- Internal links: ≥5 to landing pages (+ related posts) with descriptive anchors.
- 2–3 authoritative external links (vendor docs), open in new tab.
- Quick-answer paragraph up top (featured-snippet target); comparison table.
- FAQ (5) in registry → rendered on page + FAQPage JSON-LD; BlogPosting + BreadcrumbList emitted by the article template.
- Honest claims only — no invented benchmarks or fake ratings.

## Uniqueness protocol (owner requirement: "artikel harus benar-benar unik")

- **Original prose only** — never adapt competitor articles; write from scratch.
- **Verify before publish**: web-search 3 distinctive exact sentences in quotes → must return zero exact matches (done for #1: 3/3 clean).
- **Distinct structure per article** — do NOT reuse #1's "N methods + table" template everywhere; vary formats (narrative deep-dive, teardown, checklist, myth-busting, protocol explainer…).
- **No paragraph reuse between articles**; cross-reference by LINK instead.
- **≥1 first-hand data point per article** from our own engineering/testing (measured speeds, bugs we hit, protocol details) — the moat no competitor blog can copy.
- Article vs landing-page cannibalization check: informational intent here, commercial intent on landing pages; interlink, don't duplicate.
