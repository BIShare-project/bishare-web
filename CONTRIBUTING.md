# Contributing to BIShare Web

Thanks for your interest in improving BIShare! This repo is the web app +
marketing site behind [bishare.app](https://bishare.app). Contributions of all
sizes are welcome — from fixing a typo to adding a language to shipping a feature.

## Ways to help

- 🌍 **Translations** — the easiest and most valuable contribution. See below.
- 🐛 **Bug fixes** — check the [issues](https://github.com/BIShare-project/bishare-web/issues) or open a new one.
- ✨ **Features & UI** — please open an issue first for anything non-trivial so we can align on direction.
- 📝 **Docs** — clarify the README, add examples, improve comments.

## Getting started

**Prerequisites:** Node.js 26+ and npm.

```bash
git clone https://github.com/BIShare-project/bishare-web.git
cd bishare-web
npm install
cp .env.example .env           # optional: another API_URL
npm run dev                    # http://localhost:8788
```

The site talks to the hosted transfer API by default (`https://api.bishare.app`),
so the transfer UI works without running a backend locally.

## Adding or improving a translation

The app ships in **13 languages**. Message catalogs live in
`src/messages/<locale>/`, one JSON file per namespace.

1. To improve an existing language, edit the JSON values in
   `src/messages/<locale>/`. **Only translate the values** — keep the keys, any
   `<strong>`/`<highlight>` tags, and `{placeholders}` intact.
2. To add a new language, copy `src/messages/en/`, translate the values, and register
   the locale in `src/i18n/routing.ts`. A message that is missing falls back to English.
3. Do not translate brand names (BIShare, AirDrop, LocalSend, etc.).

## Coding conventions

- **TypeScript + Hono JSX.** A page renders to HTML at build time; a component that does something in the
  browser starts with `"island";`. Match the style of the file you're editing.
- **Tailwind** for styling; prefer the existing design tokens/components.
- **Localize all user-facing strings** — never hardcode UI text; add it to the message catalogs.
- Keep the public repo free of real infrastructure IDs and secrets.

## Pull requests

1. Fork the repo and create a feature branch (`git checkout -b feat/my-change`).
2. Make your change and verify the build:
   ```bash
   npm run build && npm test && npm run typecheck
   ```
3. Open a PR with a clear description of what and why. Link any related issue.

## Code of conduct

Be respectful and constructive. We want BIShare to be a welcoming project for
contributors of every background and experience level.

## License

By contributing, you agree that your contributions are licensed under the
project's [Apache License 2.0](LICENSE).
