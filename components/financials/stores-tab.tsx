"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocale } from "@/hooks/use-locale";
import { formatSarExact, formatNumber } from "@/lib/format";

type StoreFinancialRow = {
  id: string;
  storeId: string;
  storeCode: string;
  storeName: string;
  city: string;
  salesSar: number;
  commissionSar: number;
  netSar: number;
  ordersCount: number;
  payoutStatus: string;
  status: string;
};

const STORE_STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  paid: { ar: "مُرحّل", en: "Paid" },
  pending: { ar: "بانتظار", en: "Pending" },
  none: { ar: "بدون طلبات", en: "No orders" },
};

export function FinancialsStoresTab({
  rows,
}: {
  rows: StoreFinancialRow[];
}) {
  const { t, locale } = useLocale();

  const totalSales = rows.reduce((sum, r) => sum + r.salesSar, 0);
  const totalCommission = rows.reduce((sum, r) => sum + r.commissionSar, 0);
  const totalNet = rows.reduce((sum, r) => sum + r.netSar, 0);
  const totalOrders = rows.reduce((sum, r) => sum + r.ordersCount, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">
              {t({ ar: "أرباح المتاجر", en: "Store Income History" })}
            </h2>
            <Badge variant="outline" className="font-mono text-xs">
              {rows.length}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {t({
              ar: "مجمع الدخل والعمولة وصافي المستحق لكل متجر",
              en: "Aggregated income, commission, and net payout per store",
            })}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          {
            label: t({ ar: "إجمالي المبيعات", en: "Total Sales" }),
            value: formatSarExact(totalSales, locale),
          },
          {
            label: t({ ar: "إجمالي العمولة", en: "Total Commission" }),
            value: formatSarExact(totalCommission, locale),
          },
          {
            label: t({ ar: "صافي المستحق", en: "Total Net Payout" }),
            value: formatSarExact(totalNet, locale),
          },
          {
            label: t({ ar: "إجمالي الطلبات", en: "Total Orders" }),
            value: formatNumber(totalOrders),
          },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border bg-card p-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                {card.label}
              </span>
              <span className="text-xl font-bold tracking-tight font-mono">
                {card.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t({ ar: "المتجر", en: "Store" })}</TableHead>
              <TableHead className="text-center">{t({ ar: "الرمز", en: "Code" })}</TableHead>
              <TableHead className="text-xs text-muted-foreground">{t({ ar: "المدينة", en: "City" })}</TableHead>
              <TableHead className="text-end">{t({ ar: "المبيعات", en: "Sales" })}</TableHead>
              <TableHead className="text-end">{t({ ar: "العمولة", en: "Commission" })}</TableHead>
              <TableHead className="text-end">{t({ ar: "صافي المستحق", en: "Net Payout" })}</TableHead>
              <TableHead className="text-end">{t({ ar: "الطلبات", en: "Orders" })}</TableHead>
              <TableHead className="text-center">{t({ ar: "الحالة", en: "Status" })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                  {t({ ar: "لا توجد بيانات متاجر", en: "No store data" })}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.storeId}>
                  <TableCell className="text-sm font-medium">
                    {row.storeName}
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs text-muted-foreground">
                    {row.storeCode}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.city || "—"}
                  </TableCell>
                  <TableCell className="text-end font-mono text-xs">
                    {formatSarExact(row.salesSar, locale)}
                  </TableCell>
                  <TableCell className="text-end font-mono text-xs text-muted-foreground">
                    −{formatSarExact(row.commissionSar, locale)}
                  </TableCell>
                  <TableCell className="text-end font-mono text-xs font-medium">
                    {formatSarExact(row.netSar, locale)}
                  </TableCell>
                  <TableCell className="text-end font-mono text-xs">
                    {formatNumber(row.ordersCount)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={`text-xs ${row.status === "paid" ? "border-green/40 bg-green/10 text-green" : "border-amber/40 bg-amber/10 text-amber"}`}
                    >
                      {STORE_STATUS_LABELS[row.payoutStatus]?.[locale] ?? row.payoutStatus}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
