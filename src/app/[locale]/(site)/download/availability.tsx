/**
 * Where the desktop builds live. Linux has no storefront, so its download
 * button points at the release assets: every tagged release carries a .deb,
 * an AppImage and a tarball. Windows keeps the same page as a second route
 * for anyone who would rather not use the Microsoft Store.
 */
export const RELEASES_URL =
  "https://github.com/BIShare-project/bishare-flutter/releases/latest";
