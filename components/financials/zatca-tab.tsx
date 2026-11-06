"use client";

import * as React from "react";
import { FileCheck2, FileClock, FileWarning } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocale } from "@/hooks/use-locale";
import { formatSarExact } from "@/lib/format";
import { api } from "@/lib/api";

type ZatcaStatus = "cleared" | "notified" | "rejected";

type ZatcaInvoice = {
  id: string;
  orderRef: string;
  storeName: { ar: string; en: string };
  fatoora: string;
  totalSar: number;
  status: ZatcaStatus;
};

const statusIcon: Record<ZatcaStatus, React.ReactNode> = {
  cleared: <FileCheck2 className="size-3" aria-hidden="true" />,
  notified: <FileClock className="size-3" aria-hidden="true" />,
  rejected: <FileWarning className="size-3" aria-hidden="true" />,
};

const ZATCA_STATUS_LABELS: Record<ZatcaStatus, { ar: string; en: string }> = {
  cleared: { ar: "معتمدة", en: "Cleared" },
  notified: { ar: "مُبلّغة", en: "Notified" },
  rejected: { ar: "مرفوضة", en: "Rejected" },
};

export function ZatcaTab() {
  const { t, locale } = useLocale();
  const [invoices, setInvoices] = React.useState<ZatcaInvoice[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get<ZatcaInvoice[]>("/api/admin/zatca-invoices");
        setInvoices(data);
      } catch {
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <FileCheck2 className="size-4" strokeWidth={2} aria-hidden="true" />
            </span>
            <div className="grid gap-0.5">
              <span className="text-sm font-semibold">
                {t({ ar: "الفاتورة الإلكترونية ZATCA", en: "ZATCA E-Invoicing" })}
              </span>
              <span className="text-xs text-muted-foreground">
                {t({
                  ar: "حالة اعتماد الفواتير عبر منصة فاتورة — المرحلة الثانية",
                  en: "Fatoora platform integration status — Phase 2 invoices",
                })}
              </span>
            </div>
          </div>
          <div className="ms-auto flex gap-2">
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-xs text-primary">
              <FileCheck2 className="size-3" aria-hidden="true" /> {0} {t({ ar: "معتمدة", en: "Cleared" })}
            </Badge>
            <Badge variant="outline" className="text-xs text-muted-foreground">
              <FileClock className="size-3" aria-hidden="true" /> {0} {t({ ar: "مُبلّغة", en: "Notified" })}
            </Badge>
            <Badge variant="outline" className="text-xs text-muted-foreground">
              <FileWarning className="size-3" aria-hidden="true" /> {0} {t({ ar: "مرفوضة", en: "Rejected" })}
            </Badge>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t({ ar: "سجل الفواتير", en: "Invoice registry" })}</CardTitle>
            <CardDescription>
              {t({
                ar: "كل فواتير المرحلة الثانية وحالة رفعها لمنصة فاتورة",
                en: "All Phase 2 invoices and their Fatoora clearance status",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-10">
            <span className="text-xs text-muted-foreground">{t({ ar: "جارٍ التحميل…", en: "Loading…" })}</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cleared = invoices.filter((i) => i.status === "cleared").length;
  const notified = invoices.filter((i) => i.status === "notified").length;
  const rejected = invoices.filter((i) => i.status === "rejected").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <FileCheck2 className="size-4" strokeWidth={2} aria-hidden="true" />
          </span>
          <div className="grid gap-0.5">
            <span className="text-sm font-semibold">
              {t({ ar: "الفاتورة الإلكترونية ZATCA", en: "ZATCA E-Invoicing" })}
            </span>
            <span className="text-xs text-muted-foreground">
              {t({
                ar: "حالة اعتماد الفواتير عبر منصة فاتورة — المرحلة الثانية",
                en: "Fatoora platform integration status — Phase 2 invoices",
              })}
            </span>
          </div>
        </div>
        <div className="ms-auto flex gap-2">
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-xs text-primary">
            <FileCheck2 className="size-3" aria-hidden="true" /> {cleared} {t({ ar: "معتمدة", en: "Cleared" })}
          </Badge>
          <Badge variant="outline" className="text-xs text-muted-foreground">
            <FileClock className="size-3" aria-hidden="true" /> {notified} {t({ ar: "مُبلّغة", en: "Notified" })}
          </Badge>
          <Badge variant="outline" className="text-xs text-muted-foreground">
            <FileWarning className="size-3" aria-hidden="true" /> {rejected} {t({ ar: "مرفوضة", en: "Rejected" })}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t({ ar: "سجل الفواتير", en: "Invoice registry" })}</CardTitle>
          <CardDescription>
            {t({
              ar: "كل فواتير المرحلة الثانية وحالة رفعها لمنصة فاتورة",
              en: "All Phase 2 invoices and their Fatoora clearance status",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t({ ar: "الفاتورة", en: "Invoice" })}</TableHead>
                <TableHead>{t({ ar: "الطلب", en: "Order" })}</TableHead>
                <TableHead>{t({ ar: "المتجر", en: "Store" })}</TableHead>
                <TableHead>{t({ ar: "رقم فاتورة", en: "Fatoora #" })}</TableHead>
                <TableHead className="text-end">{t({ ar: "الإجمالي", en: "Total" })}</TableHead>
                <TableHead>{t({ ar: "الحالة", en: "Status" })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="whitespace-nowrap font-mono text-xs">{invoice.id}</TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                    {invoice.orderRef}
                  </TableCell>
                  <TableCell className="text-sm">{invoice.storeName[locale]}</TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                    {invoice.fatoora}
                  </TableCell>
                  <TableCell className="text-end font-mono text-xs">
                    {formatSarExact(invoice.totalSar, locale)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1 text-xs">
                      {statusIcon[invoice.status]}
                      {ZATCA_STATUS_LABELS[invoice.status][locale]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}