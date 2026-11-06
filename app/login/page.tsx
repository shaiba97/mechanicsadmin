"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "cn";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/hooks/use-locale";
import { t } from "@/lib/i18n/messages";

async function postLogin(
  identifier: string,
  password: string,
): Promise<{ ok: true; data: { user?: unknown; accessToken?: string; refreshToken?: string } } | { ok: false; message: string }> {
  const response = await fetch("/api/session/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: identifier, password }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof data === "object" && data && "message" in data
        ? String((data as { message: unknown }).message)
        : "Sign in failed";
    return { ok: false, message };
  }
  return { ok: true, data };
}

export default function LoginPage() {
  const { locale, setLocale } = useLocale();
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState("");
  const router = useRouter();

  const handleLanguageChange = (value: "en" | "ar") => {
    setLocale(value);
  };

  async function submit() {
    setError("");
    if (!identifier.trim() || !password) {
      setError(t("login.errorRequired", locale));
      return;
    }
    setPending(true);
    try {
      const result = await postLogin(identifier.trim(), password);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      if (result.data.accessToken && result.data.refreshToken) {
        localStorage.setItem("accessToken", result.data.accessToken);
        localStorage.setItem("refreshToken", result.data.refreshToken);
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(t("login.errorUnavailable", locale));
    } finally {
      setPending(false);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    submit();
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center p-4">
      <div className="flex justify-end mb-4">
        <div className="flex overflow-hidden rounded-lg border border-border">
          <button
            type="button"
            aria-pressed={locale === "en"}
            onClick={() => handleLanguageChange("en")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold border-r",
              locale === "en"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-foreground hover:bg-muted",
            )}
          >
            {t("login.switchToEnglish", locale)}
          </button>
          <button
            type="button"
            aria-pressed={locale === "ar"}
            onClick={() => handleLanguageChange("ar")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold",
              locale === "ar"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-foreground hover:bg-muted",
            )}
          >
            {t("login.switchToArabic", locale)}
          </button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LogIn size={16} className="text-muted-foreground" aria-hidden />
            {t("login.title", locale)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4 text-start" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5 text-start">
              <Label htmlFor="login-email">{t("login.email", locale)}</Label>
              <Input
                id="login-email"
                type="email"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder={t("login.emailPlaceholder", locale)}
                autoComplete="username"
                required
                aria-invalid={!!error && error === t("login.errorRequired", locale)}
              />
            </div>
            <div className="relative flex flex-col gap-1.5 text-start">
              <Label htmlFor="login-password">{t("login.password", locale)}</Label>
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="pe-10"
                aria-invalid={!!error && error === t("login.errorRequired", locale)}
              />
              <button
                type="button"
                className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? t("login.hidePassword", locale) : t("login.showPassword", locale)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={pending || !identifier.trim() || !password}
            >
              {pending ? t("login.signingIn", locale) : t("login.signIn", locale)}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {t("login.footer", locale)}
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
