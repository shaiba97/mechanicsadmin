export type MessageKey =
  | "login.title"
  | "login.email"
  | "login.emailPlaceholder"
  | "login.password"
  | "login.passwordPlaceholder"
  | "login.errorRequired"
  | "login.errorEmail"
  | "login.errorUnavailable"
  | "login.errorFailed"
  | "login.signingIn"
  | "login.signIn"
  | "login.continue"
  | "login.footer"
  | "login.showPassword"
  | "login.hidePassword"
  | "login.switchToEnglish"
  | "login.switchToArabic";

export const en: Record<MessageKey, string> = {
  "login.title": "Administrator sign in",
  "login.email": "Email",
  "login.emailPlaceholder": "admin@example.com",
  "login.password": "Password",
  "login.passwordPlaceholder": "Enter your password",
  "login.errorRequired": "Email and password are required.",
  "login.errorEmail": "Enter a valid email address.",
  "login.errorUnavailable": "Admin portal is unavailable — try again",
  "login.errorFailed": "Sign in failed",
  "login.signingIn": "Signing in…",
  "login.signIn": "Sign in",
  "login.continue": "Continue",
  "login.footer": "System administrators only.",
  "login.showPassword": "Show password",
  "login.hidePassword": "Hide password",
  "login.switchToEnglish": "English",
  "login.switchToArabic": "العربية",
};

export const ar: Record<MessageKey, string> = {
  "login.title": "تسجيل دخول المدير",
  "login.email": "البريد الإلكتروني",
  "login.emailPlaceholder": "admin@example.com",
  "login.password": "كلمة المرور",
  "login.passwordPlaceholder": "أدخل كلمة المرور",
  "login.errorRequired": "البريد الإلكتروني وكلمة المرور مطلوبان.",
  "login.errorEmail": "أدخل بريدًا إلكترونيًا صالحًا.",
  "login.errorUnavailable": "بوابة المدير غير متاحة — حاول مرة أخرى",
  "login.errorFailed": "فشل تسجيل الدخول",
  "login.signingIn": "جارٍ تسجيل الدخول…",
  "login.signIn": "تسجيل الدخول",
  "login.continue": "متابعة",
  "login.footer": "للمدراء النظام فقط.",
  "login.showPassword": "إظهار كلمة مرور",
  "login.hidePassword": "إخفاء كلمة مرور",
  "login.switchToEnglish": "English",
  "login.switchToArabic": "العربية",
};

export function t(key: MessageKey, locale: "en" | "ar"): string {
  return (locale === "ar" ? ar : en)[key];
}
