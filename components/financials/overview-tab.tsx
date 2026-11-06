"use client";

import * as React from "react";
import {
  FinancialSummaryCards,
  type FinancialSummary,
} from "@/components/financials/financial-summary-cards";
import { ExpenseBreakdown } from "@/components/financials/expense-breakdown";
import type { ExpenseEntry } from "@/components/financials/expense-breakdown";
import { ZatcaVatSummary, type VatSummary } from "@/components/financials/zatca-vat-summary";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocale } from "@/hooks/use-locale";
import { api } from "@/lib/api";
import { formatDateTime, formatSarExact } from "@/lib/format";

type Transaction = {
  id: string;
  orderId: string;
  referenceCode: string;
  storeId: string;
  storeCode: string;
  storeName: string;
  customerName: { ar: string; en: string };
  customerPhone: string;
  totalSar: number;
  commissionSar: number;
  netPayoutSar: number;
  commissionRate: number;
  payoutStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  gatewayTransactionId: string;
  createdAt: string;
  paidAt: string | null;
  payoutDueAt: string | null;
};

type FlashMetrics = {
  grossInflowSar: number;
  commissionEarnedSar: number;
  escrowHeldSar: number;
  fulfilledOrders: number;
  activeDispatches: number;
  inventoryWarnings: number;
};

const GATEWAY_LABELS: Record<string, { ar: string; en: string }> = {
  cod: { ar: "دفع عند الاستلام", en: "Cash on Delivery" },
  moyasar: { ar: "مoyerassar (مدى/سترايب)", en: "Moyasar (Mada/Stripe)" },
};

const PAYOUT_STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  held: { ar: "محجوز", en: "Held" },
  ready_for_payout: { ar: "جاهز للترحيل", en: "Ready for Payout" },
  processing: { ar: "جارٍ المعالجة", en: "Processing" },
  paid: { ar: "مدفوع", en: "Paid" },
  failed: { ar: "فشل", en: "Failed" },
};

const PAYOUT_TONES: Record<string, string> = {
  held: "border-amber/40 bg-amber/10 text-amber",
  ready_for_payout: "border-blue/40 bg-blue/10 text-blue",
  processing: "border-border bg-muted text-foreground",
  paid: "border-green/40 bg-green/10 text-green",
  failed: "border-destructive bg-destructive/10 text-destructive",
};

function riyadhDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" });
}

function isToday(iso: string, today: string): boolean {
  return riyadhDate(iso) === today;
}

function gatewayLabel(method: string, locale: "ar" | "en"): string {
  return GATEWAY_LABELS[method]?.[locale] ?? method;
}

export function OverviewTab({
  summary,
  vat,
  expenses,
}: {
  summary: FinancialSummary;
  vat: VatSummary;
  expenses: ExpenseEntry[];
}) {
  const { t, locale } = useLocale();
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [inventoryWarnings, setInventoryWarnings] = React.useState(0);
  const today = riyadhDate(new Date().toISOString());
  const [flashOpen, setFlashOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [txData, invData] = await Promise.all([
          api.get<Transaction[]>("/api/admin/financials/transactions?limit=50"),
          api.get<Array<{ quantity: number }>>("/api/admin/inventory"),
        ]);
        setTransactions(txData);
        setInventoryWarnings(
          invData.filter((item) => (item.quantity || 0) <= 5).length,
        );
      } catch {
        setTransactions([]);
        setInventoryWarnings(0);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const todayTx = transactions.filter((tx) => isToday(tx.createdAt, today));
  const flash: FlashMetrics = React.useMemo(() => {
    const grossInflowSar = todayTx.reduce(
      (sum, tx) => sum + tx.totalSar,
      0,
    );
    const commissionEarnedSar = todayTx.reduce(
      (sum, tx) => sum + tx.commissionSar,
      0,
    );
    const escrowHeldSar = todayTx.reduce(
      (sum, tx) => (tx.payoutStatus === "held" ? sum + tx.netPayoutSar : sum),
      0,
    );
    const fulfilledOrders = todayTx.filter((tx) => tx.payoutStatus === "paid")
      .length;
    const activeDispatches = todayTx.filter(
      (tx) =>
        tx.payoutStatus === "ready_for_payout" ||
        tx.payoutStatus === "processing",
    ).length;
    return {
      grossInflowSar,
      commissionEarnedSar,
      escrowHeldSar,
      fulfilledOrders,
      activeDispatches,
      inventoryWarnings,
    };
  }, [todayTx, inventoryWarnings]);

  return (
    <div className="flex flex-col gap-4">
      <FinancialSummaryCards summary={summary} />

      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">
              {t({ ar: "تقرير الفلاش اليومي", en: "Daily Flash Report" })}
            </h2>
            <span className="text-xs text-muted-foreground">
              {today}
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => setFlashOpen(true)}
            className="gap-1 text-xs"
          >
            <span className="font-mono">{t({ ar: "التفاصيل", en: "Details" })}</span>
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              label: t({ ar: "إجمالي التدفق Gross inflow", en: "Total Gross Inflow" }),
              value: formatSarExact(flash.grossInflowSar, locale),
              tone: "text-primary",
            },
            {
              label: t({ ar: "عمولة المنصة Platform commission", en: "Commission Earned" }),
              value: formatSarExact(flash.commissionEarnedSar, locale),
              tone: "text-primary",
            },
            {
              label: t({ ar: "رصيد الإيداع المحجوز Escrow held", en: "Escrow Held" }),
              value: formatSarExact(flash.escrowHeldSar, locale),
              tone: "text-amber",
            },
            {
              label: t({ ar: "طلبات مكتملة Fulfilled", en: "Fulfilled Orders" }),
              value: String(flash.fulfilledOrders),
              tone: "text-green",
            },
            {
              label: t({ ar: "إرسال نشط Active dispatches", en: "Active Dispatches" }),
              value: String(flash.activeDispatches),
              tone: "text-blue",
            },
            {
              label: t({ ar: "تحذيرات المخزون Inventory warnings", en: "Inventory Warnings" }),
              value: String(flash.inventoryWarnings),
              tone: flash.inventoryWarnings > 0 ? "text-destructive" : "text-green",
            },
          ].map((card) => (
            <Card key={card.label} className="gap-2 border-border/70 py-4">
              <CardContent className="flex flex-col gap-1 px-4">
                <span className="text-xs font-medium text-muted-foreground">
                  {card.label}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl font-bold tracking-tight ${card.tone}`}>
                    {card.value}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">
            {t({ ar: "العمليات المباشرة", en: "Live Transactions" })}
          </h2>
          <Badge variant="outline" className="font-mono text-xs">
            {transactions.length}
          </Badge>
        </div>
        {loading || transactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t({ ar: "لا توجد عمليات مالية", en: "No financial transactions" })}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t({ ar: "الطلب", en: "Order" })}</TableHead>
                <TableHead>{t({ ar: "المتجر", en: "Store" })}</TableHead>
                <TableHead>{t({ ar: "العميل", en: "Customer" })}</TableHead>
                <TableHead className="text-end">{t({ ar: "المبلغ", en: "Total" })}</TableHead>
                <TableHead className="text-end">{t({ ar: "العمولة", en: "Commission" })}</TableHead>
                <TableHead className="text-center">{t({ ar: "البوابة", en: "Gateway" })}</TableHead>
                <TableHead className="text-center">{t({ ar: "حالة الترحيل", en: "Payout" })}</TableHead>
                <TableHead>{t({ ar: "التاريخ", en: "Created" })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="whitespace-nowrap font-mono text-xs">
                    {tx.referenceCode}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {tx.storeName}
                  </TableCell>
                  <TableCell className="text-sm">
                    {tx.customerName[locale]}
                  </TableCell>
                  <TableCell className="text-end font-mono text-xs">
                    {formatSarExact(tx.totalSar, locale)}
                  </TableCell>
                  <TableCell className="text-end font-mono text-xs text-muted-foreground">
                    −{formatSarExact(tx.commissionSar, locale)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-[10px]">
                      {gatewayLabel(tx.paymentMethod, locale)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={`text-xs ${PAYOUT_TONES[tx.payoutStatus] ?? ""}`}
                    >
                      {PAYOUT_STATUS_LABELS[tx.payoutStatus]?.[locale] ??
                        tx.payoutStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDateTime(tx.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ExpenseBreakdown
          expenses={expenses}
          title={{ ar: "ملخص المصروفات التشغيلية", en: "Operating expenses summary" }}
          description={{
            ar: "البنية التحتية والتسويق والعمليات والامتثال الضريبي",
            en: "Infrastructure, marketing, operations and tax compliance",
          }}
        />
        <ZatcaVatSummary vat={vat} />
      </div>

      <Dialog open={flashOpen} onOpenChange={setFlashOpen}>
        <DialogContent className="max-w-2xl p-6">
          <DialogHeader>
            <DialogTitle>
              {t({ ar: "تفاصيل تقرير الفلاش اليومي", en: "Daily Flash Report Details" })}
            </DialogTitle>
            <DialogDescription>
              {t({
                ar: "مقاييس العمليات المالية لليوم الحالي حسب منطقة الرياض",
                en: "Financial operation metrics for the current day (Riyadh time)",
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-sm font-semibold mb-3">
                {t({ ar: "التدفقات النقدية", en: "Cash flows" })}
              </h3>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-sm">
                      {t({ ar: "إجمالي التدفق اليومي", en: "Today's gross inflow" })}
                    </TableCell>
                    <TableCell className="text-end font-mono text-xs font-medium">
                      {formatSarExact(flash.grossInflowSar, locale)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-sm">
                      {t({ ar: "عمولة المنصة المحصلة", en: "Commission earned" })}
                    </TableCell>
                    <TableCell className="text-end font-mono text-xs font-medium">
                      {formatSarExact(flash.commissionEarnedSar, locale)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-sm">
                      {t({ ar: "الرصيد المحجوز (انتظار 7 أيام)", en: "Escrow held (7-day window)" })}
                    </TableCell>
                    <TableCell className="text-end font-mono text-xs font-medium">
                      {formatSarExact(flash.escrowHeldSar, locale)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-sm font-semibold mb-3">
                {t({ ar: "الprocess التشغيلية", en: "Operations snapshot" })}
              </h3>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-sm">
                      {t({ ar: "طلبات مكتملة", en: "Fulfilled orders" })}
                    </TableCell>
                    <TableCell className="text-end font-mono text-xs font-medium">
                      {flash.fulfilledOrders}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-sm">
                      {t({ ar: "إرسالات نشطة", en: "Active dispatches" })}
                    </TableCell>
                    <TableCell className="text-end font-mono text-xs font-medium">
                      {flash.activeDispatches}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-sm">
                      {t({ ar: "تنبيهات مخزون منخفضة", en: "Low-stock warnings" })}
                    </TableCell>
                    <TableCell className="text-end font-mono text-xs font-medium">
                      {flash.inventoryWarnings}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setFlashOpen(false)}>
              {t({ ar: "إغلاق", en: "Close" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
