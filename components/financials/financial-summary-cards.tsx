"use client";

import { Banknote, Landmark, Percent, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/hooks/use-locale";
import { formatPercent, formatSarExact } from "@/lib/format";

export type FinancialSummary = {
  totalGmvSar: number;
  commissionSar: number;
  pendingPayoutSar: number;
  completedPayoutSar: number;
  blendedTakeRate: number;
};

export function FinancialSummaryCards({ summary }: { summary: FinancialSummary }) {
  const { t, locale } = useLocale();

  const cards = [
    {
      icon: Banknote,
      label: t({ ar: "إجمالي مبيعات المنصة", en: "Total GMV processed" }),
      value: formatSarExact(summary.totalGmvSar, locale),
      hint: t({ ar: "الرصيد القابل للترحيل هذا الشهر", en: "Settleable balance this month" }),
    },
    {
      icon: Percent,
      label: t({ ar: "أرباح العمولة", en: "Commission earnings" }),
      value: formatSarExact(summary.commissionSar, locale),
      badge: formatPercent(summary.blendedTakeRate),
      hint: t({ ar: "متوسط النسبة المرجّح بالمبيعات", en: "Sales-weighted blended rate" }),
    },
    {
      icon: Wallet,
      label: t({ ar: "بانتظار ترحيل للمتاجر", en: "Pending store payouts" }),
      value: formatSarExact(summary.pendingPayoutSar, locale),
      hint: t({ ar: "بانتظار الموافقة أو التحويل البنكي", en: "Awaiting approval or transfer" }),
    },
    {
      icon: Landmark,
      label: t({ ar: "مُرحّل هذه الدورة", en: "Completed payouts this cycle" }),
      value: formatSarExact(summary.completedPayoutSar, locale),
      hint: t({ ar: "منفّذ عبر شركة المصرّف", en: "Executed via payout provider" }),
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="gap-2 border-border/70 py-4">
          <CardContent className="flex flex-col gap-1 px-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
              <card.icon className="size-3.5 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold tracking-tight">{card.value}</span>
              {card.badge ? (
                <span className="rounded bg-[oklch(0.45_0.15_22)] px-1.5 py-0.5 text-[11px] font-medium text-white">
                  {card.badge}
                </span>
              ) : null}
            </div>
            <span className="text-[11px] leading-tight text-muted-foreground">{card.hint}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
