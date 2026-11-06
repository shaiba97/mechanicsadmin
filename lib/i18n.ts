export type Locale = "ar" | "en";

export type Dir = "rtl" | "ltr";

export type Bilingual = {
  readonly ar: string;
  readonly en: string;
};

export const LOCALE_STORAGE_KEY = "mechanics.locale";

export const DEFAULT_LOCALE: Locale = "ar";

export function isLocale(value: string | null): value is Locale {
  return value === "ar" || value === "en";
}
