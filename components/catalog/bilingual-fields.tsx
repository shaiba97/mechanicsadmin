"use client";

import { Input } from "@/components/ui/input";
import { useLocale } from "@/hooks/use-locale";

export function BilingualNameFields({
  arLabel,
  enLabel,
  arValue,
  enValue,
  onArChange,
  onEnChange,
  arError,
  enError,
}: {
  arLabel: string;
  enLabel: string;
  arValue: string;
  enValue: string;
  onArChange: (value: string) => void;
  onEnChange: (value: string) => void;
  arError?: string;
  enError?: string;
}) {
  const { t } = useLocale();

  return (
    <>
      <label className="grid gap-1.5 text-xs font-medium">
        {arLabel}
        <Input
          value={arValue}
          onChange={(event) => onArChange(event.target.value)}
          placeholder={t({ ar: "أدخل الاسم بالعربية", en: "Enter Arabic name" })}
          aria-invalid={Boolean(arError)}
        />
        {arError ? <span className="text-destructive">{arError}</span> : null}
      </label>
      <label className="grid gap-1.5 text-xs font-medium">
        {enLabel}
        <Input
          value={enValue}
          onChange={(event) => onEnChange(event.target.value)}
          placeholder={t({ ar: "Enter English name", en: "Enter English name" })}
          dir="ltr"
          aria-invalid={Boolean(enError)}
        />
        {enError ? <span className="text-destructive">{enError}</span> : null}
      </label>
    </>
  );
}
