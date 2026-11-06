"use client";

import * as React from "react";
import { Check, Clock, Loader, RefreshCcw, Send, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLocale } from "@/hooks/use-locale";
import { api } from "@/lib/api";
import { formatDate, formatSarExact } from "@/lib/format";
import { toast } from "@/components/ui/toast";

const PAYOUT_REQUEST_STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  pending_review: { ar: "بانتظار المراجعة", en: "Pending review" },
  processing: { ar: "جارٍ التحويل", en: "Processing" },
  paid: { ar: "مدفوع", en: "Paid" },
  failed: { ar: "فشل التحويل", en: "Failed" },
};

export type PayoutRequestStatus = "pending_review" | "processing" | "paid" | "failed";

export type PayoutRequest = {
  id: string;
  storeId: string;
  storeName: { ar: string; en: string };
  amountSar: number;
  stripeTransferId: string | null;
  requestedAt: string;
  status: PayoutRequestStatus;
};

export type PayoutRow = {
  entry: { id: string; storeId: string; salesSar: number; status: string };
  store: { id: string; name: { ar: string; en: string }; city: { ar: string; en: string } };
  commissionSar: number;
  netSar: number;
};

export type EscrowTransaction = {
  id: string;
  orderId: string;
  referenceCode: string;
  storeId: string;
  storeCode: string;
  storeName: string;
  customerName: string;
  customerPhone: string;
  totalSar: number;
  commissionSar: number;
  netPayoutSar: number;
  payoutStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  payoutDueAt: string | null;
};

const requestStatusIcon: Record<PayoutRequestStatus, React.ReactNode> = {
  pending_review: <Clock className="size-3" strokeWidth={2} aria-hidden="true" />,
  processing: <Loader className="size-3 animate-pulse" strokeWidth={2} aria-hidden="true" />,
  paid: <Check className="size-3" strokeWidth={2.5} aria-hidden="true" />,
  failed: <RefreshCcw className="size-3" strokeWidth={2} aria-hidden="true" />,
};

function EscrowRow({ tx }: { tx: EscrowTransaction }) {
  const { locale } = useLocale();
  return (
    <TableRow key={tx.id}>
      <TableCell className="whitespace-nowrap font-mono text-xs">
        {tx.referenceCode}
      </TableCell>
      <TableCell className="text-sm">{tx.storeName}</TableCell>
      <TableCell className="text-sm">{tx.customerName}</TableCell>
      <TableCell className="text-end font-mono text-xs">
        {formatSarExact(tx.totalSar, locale)}
      </TableCell>
      <TableCell className="text-end font-mono text-xs text-muted-foreground">
        −{formatSarExact(tx.commissionSar, locale)}
      </TableCell>
      <TableCell className="text-end font-mono text-xs font-medium">
        {formatSarExact(tx.netPayoutSar, locale)}
      </TableCell>
      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
        {formatDate(tx.payoutDueAt || tx.createdAt, locale)}
      </TableCell>
    </TableRow>
  );
}

export function PayoutsTab({
  requests,
  rows,
  adminAuthRequired = false,
}: {
  requests: PayoutRequest[];
  rows: PayoutRow[];
  adminAuthRequired?: boolean;
}) {
  const { t, locale } = useLocale();
  const [subTab, setSubTab] = React.useState("requests");

  const [escrowTransactions, setEscrowTransactions] = React.useState<
    EscrowTransaction[]
  >([]);
  const [escrowLoading, setEscrowLoading] = React.useState(false);

  const pending = requests.filter((request) => request.status !== "paid");
  const completed = requests.filter((request) => request.status === "paid");
  const unpaidRows = rows.filter((row) => row.entry.status !== "transferred");
  const unpaidTotalSar = unpaidRows.reduce((sum, row) => sum + row.netSar, 0);

  const escrowHeldTotal = escrowTransactions.reduce(
    (sum, tx) => sum + tx.netPayoutSar,
    0,
  );

  const requireAuth = () => {
    toast.add({
      title: t({ ar: "يتطلب اعتماد المسؤول", en: "Admin authorization required" }),
      description: t({
        ar: "إجراءات اعتماد وترحيل المدفوعات محجوزة لحساب المسؤول وتفعيل المصادقة",
        en: "Payout approval and transfer are reserved to the admin account once authentication is enabled",
      }),
      type: "destructive",
    });
  };

  const approveRequest = () => {
    if (adminAuthRequired) {
      requireAuth();
      return;
    }
  };

  const transferRequest = () => {
    if (adminAuthRequired) {
      requireAuth();
      return;
    }
  };

  const processPayouts = async () => {
    if (adminAuthRequired) {
      requireAuth();
      return;
    }
    setEscrowLoading(true);
    try {
      await api.post("/api/admin/financials/payouts/process", {});
      toast.add({
        title: t({ ar: "تم البدء بالمعالجة", en: "Payout processing started" }),
        description: t({
          ar: "يتم معالجة المدفوعات المستحقة الآن في الخلفية",
          en: "Processing due payouts in the background",
        }),
      });
      loadEscrowTransactions();
    } catch {
      toast.add({
        title: t({ ar: "فشل المعالجة", en: "Processing failed" }),
        type: "destructive",
      });
    } finally {
      setEscrowLoading(false);
    }
  };

  const loadEscrowTransactions = async () => {
    setEscrowLoading(true);
    try {
      const data = await api.get<EscrowTransaction[]>(
        "/api/admin/financials/transactions?status=held&limit=100",
      );
      setEscrowTransactions(data);
    } catch {
      setEscrowTransactions([]);
    } finally {
      setEscrowLoading(false);
    }
  };

  React.useEffect(() => {
    loadEscrowTransactions();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {adminAuthRequired && (
        <Alert>
          <AlertTitle>
            {t({ ar: "مدفوعات مقيدة", en: "Payouts restricted" })}
          </AlertTitle>
          <AlertDescription>
            {t({
              ar: "أزرار الاعتماد والتحويل معطلة حتى يتم تفعيل مصادقة لوحة الإدارة وحساب المسؤول",
              en: "Approve and transfer buttons are disabled until admin authentication is enabled",
            })}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={subTab} onValueChange={(value) => setSubTab(value as string)}>
        <TabsList>
          <TabsTrigger value="requests">
            {t({ ar: "الطلبات", en: "Requests" })}
          </TabsTrigger>
          <TabsTrigger value="unpaid">
            {t({ ar: "المتاجر غير المسددة", en: "Unpaid stores" })}
          </TabsTrigger>
          <TabsTrigger value="held">
            {t({ ar: "المدفوعات المحجوزة", en: "Escrow Held" })}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="flex flex-col gap-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">
                {t({ ar: "طلبات بانتظار المراجعة", en: "Requests awaiting review" })}
              </h3>
              <Badge variant="outline" className="font-mono text-xs">
                {pending.length}
              </Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t({ ar: "الطلب", en: "Request" })}</TableHead>
                  <TableHead>{t({ ar: "المتجر", en: "Store" })}</TableHead>
                  <TableHead className="text-end">{t({ ar: "المبلغ", en: "Amount" })}</TableHead>
                  <TableHead>{t({ ar: "معرّف Stripe", en: "Stripe transfer ID" })}</TableHead>
                  <TableHead>{t({ ar: "التاريخ", en: "Date" })}</TableHead>
                  <TableHead>{t({ ar: "الحالة", en: "Status" })}</TableHead>
                  <TableHead className="text-end">{t({ ar: "إجراء", en: "Action" })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="whitespace-nowrap font-mono text-xs">
                      {request.id}
                    </TableCell>
                    <TableCell className="text-sm">{request.storeName[locale]}</TableCell>
                    <TableCell className="text-end font-mono text-xs font-medium">
                      {formatSarExact(request.amountSar, locale)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                      {request.stripeTransferId ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                      {formatDate(request.requestedAt, locale)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1 text-xs">
                        {requestStatusIcon[request.status]}
                        {PAYOUT_REQUEST_STATUS_LABELS[request.status][locale]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">
                      {request.status === "pending_review" ? (
                        <Button
                          size="sm"
                          className="h-7 gap-1 text-xs"
                          disabled={adminAuthRequired}
                          onClick={() => approveRequest()}
                        >
                          <Send className="size-3" strokeWidth={2.5} aria-hidden="true" />
                          {t({ ar: "اعتماد وتحويل", en: "Approve & transfer" })}
                        </Button>
                      ) : request.status === "failed" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs"
                          disabled={adminAuthRequired}
                          onClick={() => transferRequest()}
                        >
                          <RefreshCcw className="size-3" strokeWidth={2.5} aria-hidden="true" />
                          {t({ ar: "إعادة المحاولة", en: "Retry" })}
                        </Button>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          {t({ ar: "جارٍ التنفيذ", en: "Processing" })}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">
                {t({ ar: "سجل التحويلات المكتملة", en: "Completed payout history" })}
              </h3>
              <Badge variant="outline" className="font-mono text-xs">
                {completed.length}
              </Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t({ ar: "الطلب", en: "Request" })}</TableHead>
                  <TableHead>{t({ ar: "المتجر", en: "Store" })}</TableHead>
                  <TableHead className="text-end">{t({ ar: "المبلغ", en: "Amount" })}</TableHead>
                  <TableHead>{t({ ar: "معرّف Stripe", en: "Stripe transfer ID" })}</TableHead>
                  <TableHead>{t({ ar: "تاريخ التحويل", en: "Transfer date" })}</TableHead>
                  <TableHead>{t({ ar: "الحالة", en: "Status" })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completed.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="whitespace-nowrap font-mono text-xs">
                      {request.id}
                    </TableCell>
                    <TableCell className="text-sm">{request.storeName[locale]}</TableCell>
                    <TableCell className="text-end font-mono text-xs font-medium">
                      {formatSarExact(request.amountSar, locale)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                      {request.stripeTransferId ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                      {formatDate(request.requestedAt, locale)}
                    </TableCell>
                    <TableCell>
                      <Badge className="gap-1 text-xs">
                        {requestStatusIcon.paid}
                        {PAYOUT_REQUEST_STATUS_LABELS.paid[locale]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="unpaid" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4">
            <Wallet className="size-4 text-primary" strokeWidth={2} aria-hidden="true" />
            <div className="grid gap-0.5">
              <span className="text-sm font-semibold">
                {t({ ar: "أرصدة متراكمة بانتظار التحويل", en: "Accumulated balances awaiting payout" })}
              </span>
              <span className="text-xs text-muted-foreground">
                {t({
                  ar: "صافي المستحق بعد خصم عمولة المنصة",
                  en: "Net payable after platform commission deduction",
                })}
              </span>
            </div>
            <Badge
              variant="outline"
              className="ms-auto border-primary/40 bg-primary/10 font-mono text-xs text-primary"
            >
              {formatSarExact(unpaidTotalSar, locale)}
            </Badge>
            <Button
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={processPayouts}
              disabled={unpaidRows.length === 0 || adminAuthRequired}
            >
              <Send className="size-3" strokeWidth={2.5} aria-hidden="true" />
              {t({ ar: "تحويل المدفوعات المستحقة الآن", en: "Process Due Payouts Now" })}
            </Button>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t({ ar: "المتجر", en: "Store" })}</TableHead>
                  <TableHead>{t({ ar: "المدينة", en: "City" })}</TableHead>
                  <TableHead className="text-end">{t({ ar: "إجمالي المبيعات", en: "Total sales" })}</TableHead>
                  <TableHead className="text-end">{t({ ar: "العمولة", en: "Commission" })}</TableHead>
                  <TableHead className="text-end">{t({ ar: "صافي المستحق", en: "Net payable" })}</TableHead>
                  <TableHead>{t({ ar: "الحالة", en: "Status" })}</TableHead>
                  <TableHead className="text-end">{t({ ar: "إجراء", en: "Action" })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unpaidRows.map((row) => (
                  <TableRow key={row.entry.id}>
                    <TableCell className="text-sm font-medium">
                      {row.store.name[locale]}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.store.city[locale]}
                    </TableCell>
                    <TableCell className="text-end font-mono text-xs">
                      {formatSarExact(row.entry.salesSar, locale)}
                    </TableCell>
                    <TableCell className="text-end font-mono text-xs text-muted-foreground">
                      −{formatSarExact(row.commissionSar, locale)}
                    </TableCell>
                    <TableCell className="text-end font-mono text-xs font-medium">
                      {formatSarExact(row.netSar, locale)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {row.entry.status === "pending"
                          ? t({ ar: "بانتظار الترحيل", en: "Pending" })
                          : t({ ar: "قيد التنفيذ", en: "Processing" })}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">
                      <Button
                        size="sm"
                        variant={
                          row.entry.status === "pending" ? "outline" : "default"
                        }
                        className="h-7 gap-1 text-xs"
                        disabled={adminAuthRequired}
                        onClick={() =>
                          row.entry.status === "pending"
                            ? approveRequest()
                            : transferRequest()
                        }
                      >
                        {row.entry.status === "pending" ? (
                          <>
                            <Check className="size-3" strokeWidth={2.5} aria-hidden="true" />
                            {t({ ar: "اعتماد", en: "Approve" })}
                          </>
                        ) : (
                          <>
                            <Send className="size-3" strokeWidth={2.5} aria-hidden="true" />
                            {t({ ar: "تحويل Stripe", en: "Stripe payout" })}
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="held" className="flex flex-col gap-3">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Wallet className="size-4 text-amber" strokeWidth={2} aria-hidden="true" />
              <div className="grid gap-0.5">
                <span className="text-sm font-semibold">
                  {t({ ar: "المدفوعات المحجوزة", en: "Escrow-Held Payouts" })}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t({
                    ar: "أوامر الدفع المحجوزة لفترة 7 أيام وبدون ترحيل",
                    en: "Payment orders held in 7-day escrow window awaiting payout",
                  })}
                </span>
              </div>
              <Badge
                variant="outline"
                className="ms-auto border-amber/40 bg-amber/10 font-mono text-xs text-amber"
              >
                {formatSarExact(escrowHeldTotal, locale)}
              </Badge>
            </div>
          </div>

          {escrowLoading ? (
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-center py-10">
                <Loader className="size-4 animate-spin" />
                <span className="ml-2 text-xs text-muted-foreground">
                  {t({ ar: "جارٍ التحميل…", en: "Loading…" })}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t({ ar: "الطلب", en: "Order" })}</TableHead>
                    <TableHead>{t({ ar: "المتجر", en: "Store" })}</TableHead>
                    <TableHead>{t({ ar: "العميل", en: "Customer" })}</TableHead>
                    <TableHead className="text-end">{t({ ar: "المبلغ", en: "Amount" })}</TableHead>
                    <TableHead className="text-end">{t({ ar: "العمولة", en: "Commission" })}</TableHead>
                    <TableHead className="text-end">{t({ ar: "صافي المستحق", en: "Net Payout" })}</TableHead>
                    <TableHead className="text-center">{t({ ar: "تاريخ الاستحقاق", en: "Due Date" })}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {escrowTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                        {t({ ar: "لا توجد مدفوعات محجوزة", en: "No escrow-held payouts" })}
                      </TableCell>
                    </TableRow>
                  ) : (
                    escrowTransactions.map((tx) => (
                      <EscrowRow key={tx.id} tx={tx} />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
