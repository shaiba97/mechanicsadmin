"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocale } from "@/hooks/use-locale";
import { api } from "@/lib/api";
import { formatSarExact, formatDateRange, formatNumber } from "@/lib/format";
import { AccrualAdjustments } from "@/components/financials/accrual-adjustments";

type PeriodId = "day" | "week" | "month" | "quarter" | "half" | "year";

type AccountingTotals = {
  grossSalesSar: number;
  commissionSar: number;
  vatCollectedSar: number;
  netPayoutSar: number;
  escrowHeldSar: number;
  orderCount: number;
  completedCount: number;
  commissionRate: number;
};

type AccountingAccrual = {
  cashCollectedSar: number;
  creditSalesSar: number;
  deferredRevenueSar: number;
  earnedRevenueSar: number;
  cashOrdersCount: number;
  creditOrdersCount: number;
  deferredOrdersCount: number;
};

type AccountingDaily = {
  date: string;
  grossSalesSar: number;
  commissionSar: number;
  ordersCount: number;
};

type AccountingRollup = {
  label: string;
  start: string;
  end: string;
  grossSalesSar: number;
  commissionSar: number;
  vatCollectedSar: number;
  netPayoutSar: number;
  escrowHeldSar: number;
  orderCount: number;
  completedCount: number;
  commissionRate: number;
};

type AccountingPayload = {
  period: string;
  rangeStart: string;
  rangeEnd: string;
  totals: AccountingTotals;
  accrual: AccountingAccrual;
  daily: AccountingDaily[];
  rollups: AccountingRollup[];
};

const PERIODS: PeriodId[] = ["day", "week", "month", "quarter", "half", "year"];

const PERIOD_LABELS: Record<PeriodId, { ar: string; en: string }> = {
  day: { ar: "اليوم", en: "Day" },
  week: { ar: "الأسبوع", en: "Week" },
  month: { ar: "الشهر", en: "Month" },
  quarter: { ar: "الربع", en: "Quarter" },
  half: { ar: "نصف السنة", en: "Half year" },
  year: { ar: "السنة", en: "Year" },
};

export function AccountingTab() {
  const { t, locale } = useLocale();
  const [period, setPeriod] = React.useState<PeriodId>("month");
  const [data, setData] = React.useState<AccountingPayload | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await api.get<AccountingPayload>(
          `/api/admin/financials/accounting?period=${period}`,
        );
        setData(result);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [period]);

  const exportCsv = () => {
    if (!data) return;
    const lines: string[] = [];
    lines.push(
      [
        "period",
        "rangeStart",
        "rangeEnd",
        "grossSalesSar",
        "commissionSar",
        "vatCollectedSar",
        "netPayoutSar",
        "escrowHeldSar",
        "orderCount",
        "completedCount",
        "commissionRate",
      ].join(","),
    );
    const t = data.totals;
    lines.push(
      [
        data.period,
        data.rangeStart,
        data.rangeEnd,
        t.grossSalesSar,
        t.commissionSar,
        t.vatCollectedSar,
        t.netPayoutSar,
        t.escrowHeldSar,
        t.orderCount,
        t.completedCount,
        t.commissionRate,
      ].join(","),
    );
    lines.push("");
    lines.push(["date", "grossSalesSar", "commissionSar", "ordersCount"].join(","));
    for (const row of data.daily) {
      lines.push(
        [row.date, row.grossSalesSar, row.commissionSar, row.ordersCount].join(","),
      );
    }
    lines.push("");
    lines.push(
      [
        "label",
        "start",
        "end",
        "grossSalesSar",
        "commissionSar",
        "vatCollectedSar",
        "netPayoutSar",
        "escrowHeldSar",
        "orderCount",
        "completedCount",
      ].join(","),
    );
    for (const row of data.rollups) {
      lines.push(
        [
          row.label,
          row.start,
          row.end,
          row.grossSalesSar,
          row.commissionSar,
          row.vatCollectedSar,
          row.netPayoutSar,
          row.escrowHeldSar,
          row.orderCount,
          row.completedCount,
        ].join(","),
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `accounting-${data.period}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <span className="text-xs text-muted-foreground">
          {t({ ar: "جارٍ التحميل…", en: "Loading…" })}
        </span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <h2 className="text-sm font-semibold">
          {t({ ar: "فترات المحاسبة", en: "Accounting Periods" })}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {t({ ar: "تعذر تحميل البيانات", en: "Unable to load data" })}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">
              {t({ ar: "فترات المحاسبة", en: "Accounting Periods" })}
            </h2>
            <span className="text-xs text-muted-foreground">
              {formatDateRange(data.rangeStart, data.rangeEnd, locale)}
            </span>
          </div>
          <Select
            onValueChange={(value) => setPeriod(value as PeriodId)}
            defaultValue={period}
          >
            <SelectTrigger className="w-32">
              <SelectValue>{PERIOD_LABELS[period][locale]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p} value={p}>
                  {PERIOD_LABELS[p][locale]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button size="sm" onClick={exportCsv}>
              {t({ ar: "تصدير CSV", en: "Export CSV" })}
            </Button>
            <Button size="sm" variant="outline" onClick={handlePrint}>
              {t({ ar: "طباعة", en: "Print" })}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: t({ ar: "المبيعات الإجمالية", en: "Gross sales" }),
            value: formatSarExact(data.totals.grossSalesSar, locale),
          },
          {
            label: t({ ar: "عمولة المنصة", en: "Commission" }),
            value: formatSarExact(data.totals.commissionSar, locale),
          },
          {
            label: t({ ar: "ضريبة القيمة المضافة المحصلة", en: "VAT collected" }),
            value: formatSarExact(data.totals.vatCollectedSar, locale),
          },
          {
            label: t({ ar: "صافي المستحق للمتاجر", en: "Net payout" }),
            value: formatSarExact(data.totals.netPayoutSar, locale),
          },
        ].map((card) => (
          <Card key={card.label} className="gap-2 border-border/70 py-4">
            <CardContent className="flex flex-col gap-1 px-4">
              <span className="text-xs font-medium text-muted-foreground">
                {card.label}
              </span>
              <span className="text-xl font-bold tracking-tight">{card.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">
            {t({ ar: "الإيرادات اليومية", en: "Daily breakdown" })}
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t({ ar: "التاريخ", en: "Date" })}</TableHead>
                <TableHead className="text-end">{t({ ar: "المبيعات", en: "Sales" })}</TableHead>
                <TableHead className="text-end">{t({ ar: "العمولة", en: "Commission" })}</TableHead>
                <TableHead className="text-end">{t({ ar: "الطلبات", en: "Orders" })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.daily.map((row) => (
                <TableRow key={row.date}>
                  <TableCell className="whitespace-nowrap font-mono text-xs">
                    {row.date}
                  </TableCell>
                  <TableCell className="text-end font-mono text-xs">
                    {formatSarExact(row.grossSalesSar, locale)}
                  </TableCell>
                  <TableCell className="text-end font-mono text-xs">
                    {formatSarExact(row.commissionSar, locale)}
                  </TableCell>
                  <TableCell className="text-end font-mono text-xs">
                    {formatNumber(row.ordersCount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">
            {t({ ar: "الإستحقاق والترحيل", en: "Accrual and payout" })}
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t({ ar: "البند", en: "Item" })}</TableHead>
                <TableHead className="text-end">{t({ ar: "المبلغ", en: "Amount" })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-sm">{t({ ar: "محصّل نقداً", en: "Cash collected" })}</TableCell>
                <TableCell className="text-end font-mono text-xs">
                  {formatSarExact(data.accrual.cashCollectedSar, locale)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-sm">{t({ ar: "مبيعات آجلة", en: "Credit sales" })}</TableCell>
                <TableCell className="text-end font-mono text-xs">
                  {formatSarExact(data.accrual.creditSalesSar, locale)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-sm">{t({ ar: "إيرادات مؤجلة", en: "Deferred revenue" })}</TableCell>
                <TableCell className="text-end font-mono text-xs">
                  {formatSarExact(data.accrual.deferredRevenueSar, locale)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-sm">{t({ ar: "إيرادات محققة", en: "Earned revenue" })}</TableCell>
                <TableCell className="text-end font-mono text-xs">
                  {formatSarExact(data.accrual.earnedRevenueSar, locale)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-sm">{t({ ar: "مبلغ الإيداع المحجوز", en: "Escrow held" })}</TableCell>
                <TableCell className="text-end font-mono text-xs">
                  {formatSarExact(data.totals.escrowHeldSar, locale)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {data.rollups.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">
            {t({ ar: "ترحيلات حسب الشهر", en: "Monthly rollups" })}
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t({ ar: "الفترة", en: "Period" })}</TableHead>
                <TableHead className="text-end">{t({ ar: "المبيعات", en: "Sales" })}</TableHead>
                <TableHead className="text-end">{t({ ar: "العمولة", en: "Commission" })}</TableHead>
                <TableHead className="text-end">{t({ ar: "ضريبة", en: "VAT" })}</TableHead>
                <TableHead className="text-end">{t({ ar: "صافي", en: "Net" })}</TableHead>
                <TableHead className="text-end">{t({ ar: "الطلبات", en: "Orders" })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rollups.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="whitespace-nowrap font-mono text-xs">
                    {row.label}
                  </TableCell>
                  <TableCell className="text-end font-mono text-xs">
                    {formatSarExact(row.grossSalesSar, locale)}
                  </TableCell>
                  <TableCell className="text-end font-mono text-xs">
                    {formatSarExact(row.commissionSar, locale)}
                  </TableCell>
                  <TableCell className="text-end font-mono text-xs">
                    {formatSarExact(row.vatCollectedSar, locale)}
                  </TableCell>
                  <TableCell className="text-end font-mono text-xs">
                    {formatSarExact(row.netPayoutSar, locale)}
                  </TableCell>
                  <TableCell className="text-end font-mono text-xs">
                    {formatNumber(row.orderCount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AccrualAdjustments />
    </div>
  );
}
