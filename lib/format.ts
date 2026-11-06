import { Locale } from "@/lib/i18n";

const numberFormatter = new Intl.NumberFormat("en-US");

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatSar(value: number, locale: Locale): string {
  const amount = numberFormatter.format(value);
  return locale === "ar" ? `${amount} ر.س` : `SAR ${amount}`;
}

const sarExactFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatSarExact(value: number, locale: Locale): string {
  const amount = sarExactFormatter.format(value);
  return locale === "ar" ? `${amount} ر.س` : `SAR ${amount}`;
}

export function formatPercent(fraction: number): string {
  return `${numberFormatter.format(Math.round(fraction * 100))}%`;
}

export function maskIban(iban: string): string {
  if (iban.length < 8) return iban;
  return `${iban.slice(0, 4)}••••••${iban.slice(-4)}`;
}

export function formatPhone(value: string): string {
  const digits = (value || "").replace(/\D/g, "");
  if (digits.startsWith("966")) return `+${digits}`;
  if (digits.length === 9) return `+966${digits}`;
  if (digits.length > 0) return `+${digits}`;
  return "";
}

const dateFormatter: Intl.DateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Riyadh",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatDateTime(date: Date | string | number): string {
  return dateFormatter.format(new Date(date));
}

const dateOnlyFormatters: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Riyadh",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }),
  ar: new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
    timeZone: "Asia/Riyadh",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }),
};

export function formatDate(date: Date | string | number, locale: Locale): string {
  return dateOnlyFormatters[locale].format(new Date(date));
}

export function formatDateRange(
  start: string | Date,
  end: string | Date,
  locale: Locale,
): string {
  return `${formatDate(start, locale)} → ${formatDate(end, locale)}`;
}
