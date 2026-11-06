export type KsaCity = {
  slug: string;
  name: { ar: string; en: string };
  defaultFeeSar: number;
};

export const KSA_CITIES: KsaCity[] = [
  { slug: "riyadh", name: { ar: "الرياض", en: "Riyadh" }, defaultFeeSar: 20 },
  { slug: "kharj", name: { ar: "الخرج", en: "Al Kharj" }, defaultFeeSar: 20 },
  { slug: "jeddah", name: { ar: "جدة", en: "Jeddah" }, defaultFeeSar: 25 },
  { slug: "makkah", name: { ar: "مكة المكرمة", en: "Makkah" }, defaultFeeSar: 25 },
  { slug: "dammam", name: { ar: "الدمام", en: "Dammam" }, defaultFeeSar: 25 },
  { slug: "khobar", name: { ar: "الخبر", en: "Khobar" }, defaultFeeSar: 25 },
  { slug: "dhahran", name: { ar: "الظهران", en: "Dhahran" }, defaultFeeSar: 25 },
  { slug: "qatif", name: { ar: "القطيف", en: "Qatif" }, defaultFeeSar: 25 },
  { slug: "madinah", name: { ar: "المدينة المنورة", en: "Madinah" }, defaultFeeSar: 30 },
  { slug: "taif", name: { ar: "الطائف", en: "Taif" }, defaultFeeSar: 35 },
  { slug: "buraidah", name: { ar: "بريدة", en: "Buraidah" }, defaultFeeSar: 35 },
  { slug: "ahsa", name: { ar: "الأحساء", en: "Al Ahsa" }, defaultFeeSar: 35 },
  { slug: "yanbu", name: { ar: "ينبع", en: "Yanbu" }, defaultFeeSar: 40 },
  { slug: "abha", name: { ar: "أبها", en: "Abha" }, defaultFeeSar: 40 },
  { slug: "tabuk", name: { ar: "تبوك", en: "Tabuk" }, defaultFeeSar: 40 },
  { slug: "hail", name: { ar: "حائل", en: "Hail" }, defaultFeeSar: 40 },
  { slug: "najran", name: { ar: "نجران", en: "Najran" }, defaultFeeSar: 45 },
  { slug: "jazan", name: { ar: "جازان", en: "Jazan" }, defaultFeeSar: 45 },
];

export function ksaCityName(slug: string, locale: "ar" | "en"): string {
  const city = KSA_CITIES.find((c) => c.slug === slug);
  return city?.name[locale] ?? slug;
}

export function ksaDefaultFee(slug: string): number | null {
  const city = KSA_CITIES.find((c) => c.slug === slug);
  return city?.defaultFeeSar ?? null;
}
