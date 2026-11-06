"use client";

import { ReceiptText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/hooks/use-locale";
import { formatSarExact } from "@/lib/format";

export const VAT_RATE = 0.15;

export type VatSummary = {
  storeSalesVatSar: number;
  platformFeeVatSar: number;
};

export function ZatcaVatSummary({ vat }: { vat: VatSummary }) {
  const { t, locale } = useLocale();
  const totalVatSar = vat.storeSalesVatSar + vat.platformFeeVatSar;

  const rows = [
    {
      label: t({
        ar: "ضريبة مبيعات المتاجر",
        en: "VAT on store sales",
      }),
      value: vat.storeSalesVatSar,
      hint: t({ ar: "ظاهرة في الفواتير الضريبية", en: "Shown on tax invoices" }),
    },
    {
      label: t({
        ar: "ضريبة عمولات المنصة",
        en: "VAT on platform fees",
      }),
      value: vat.platformFeeVatSar,
      hint: t({ ar: "فاتورة ضرائب من المنصة للمتجر", en: "Billed by platform to stores" }),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t({ ar: "ملخص الضريبة (ZATCA)", en: "VAT summary (ZATCA)" })}</CardTitle>
        <CardDescription>
          {t({
            ar: "ضريبة القيمة المضافة المحصّلة — جاهزة لتقارير هيئة الزكاة",
            en: "Collected VAT — ready for ZATCA reporting",
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-2 border-b border-dashed pb-3 last:border-0 last:pb-0">
            <div className="grid gap-0.5">
              <span className="text-xs font-medium">{row.label}</span>
              <span className="text-[11px] text-muted-foreground">{row.hint}</span>
            </div>
            <span className="font-mono text-sm font-medium">
              {formatSarExact(row.value, locale)}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-2 rounded-md bg-[oklch(0.45_0.15_22)] px-3 py-2 text-white">
          <span className="text-xs font-medium">
            {t({ ar: "إجمالي الالتزام الضريبي", en: "Total VAT payable" })}
          </span>
          <span className="font-mono text-sm font-bold">{formatSarExact(totalVatSar, locale)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <ReceiptText className="size-3" strokeWidth={2} aria-hidden="true" />
          {t({
            ar: `النسبة ${VAT_RATE * 100}% وفق نظام القيمة المضافة السعودي — المرحلة الثانية`,
            en: `${VAT_RATE * 100}% per KSA VAT law (Phase 2, 15%)`,
          })}
        </div>
      </CardContent>
    </Card>
  );
}
