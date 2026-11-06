"use client";

import * as React from "react";
import { DirectionProvider } from "@/components/ui/direction";
import { LocaleProvider, useLocale } from "@/hooks/use-locale";

function DirectionBridge({ children }: { children: React.ReactNode }) {
  const { dir } = useLocale();
  return <DirectionProvider direction={dir}>{children}</DirectionProvider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <DirectionBridge>{children}</DirectionBridge>
    </LocaleProvider>
  );
}
