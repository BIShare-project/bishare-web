/** Every language in its own script, its short name, and the flag that conventionally stands for it. */
export const LANGUAGES: Record<string, { name: string; short: string; flag: string }> = {
  en: { name: "English", short: "EN", flag: "🇬🇧" },
  id: { name: "Bahasa Indonesia", short: "ID", flag: "🇮🇩" },
  es: { name: "Español", short: "ES", flag: "🇪🇸" },
  fr: { name: "Français", short: "FR", flag: "🇫🇷" },
  de: { name: "Deutsch", short: "DE", flag: "🇩🇪" },
  "pt-BR": { name: "Português (BR)", short: "PT", flag: "🇧🇷" },
  ru: { name: "Русский", short: "RU", flag: "🇷🇺" },
  ar: { name: "العربية", short: "AR", flag: "🇸🇦" },
  hi: { name: "हिन्दी", short: "HI", flag: "🇮🇳" },
  ja: { name: "日本語", short: "JA", flag: "🇯🇵" },
  ko: { name: "한국어", short: "KO", flag: "🇰🇷" },
  "zh-Hans": { name: "简体中文", short: "中", flag: "🇨🇳" },
  "zh-Hant": { name: "繁體中文", short: "繁", flag: "🇹🇼" },
};
