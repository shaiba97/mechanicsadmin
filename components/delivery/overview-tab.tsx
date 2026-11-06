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
import { api } from "@/lib/api";
import { formatDateTime, formatSarExact } from "@/lib/format";

type DeliveryOverviewRow = {
  id: string;
  referenceCode: string;
  storeName: string;
  storeCode: string;
  customerName: string;
  customerPhone: string;
  city: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  totalSar: number;
  createdAt: string;
};

type DeliveryOverviewTotals = {
  total: number;
  inFlight: number;
  completed: number;
  cancelled: number;
  cod: number;
};

export function DeliveryOverviewTab() {
  const { t, locale } = useLocale();
  const [data, setData] = React.useState<{
    days: number;
    totals: DeliveryOverviewTotals;
    rows: DeliveryOverviewRow[];
  } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        const result = await api.get<{
          days: number;
          totals: DeliveryOverviewTotals;
          rows: DeliveryOverviewRow[];
        }>("/api/admin/delivery/overview?days=7");
        setData(result);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statusTone: Record<string, string> = {
    pending: "border-primary/40 bg-primary/10 text-primary",
    store_preparing: "border-border bg-muted text-foreground",
    delivery_assigned: "border-border bg-muted text-foreground",
    otp_generated: "border-border bg-muted text-foreground",
    completed: "border-green/40 bg-green/10 text-green",
    cancelled: "border-destructive bg-destructive/10 text-destructive",
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
          {t({ ar: "نظرة عامة على التوصيل", en: "Delivery overview" })}
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
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold">
            {t({ ar: "الإحصائيات", en: "Totals" })}
          </h3>
          <Badge variant="outline" className="font-mono text-xs">
            {data.totals.total} {t({ ar: "طلب", en: "orders" })}
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            {data.totals.inFlight} {t({ ar: "قيد التنفيذ", en: "in flight" })}
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            {data.totals.completed} {t({ ar: "مكتمل", en: "completed" })}
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            {data.totals.cancelled} {t({ ar: "ملغى", en: "cancelled" })}
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            {data.totals.cod} {t({ ar: "دفع عند الاستلام", en: "COD" })}
          </Badge>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-semibold">
            {t({ ar: "آخر الطلبات", en: "Recent orders" })}
          </h3>
          <Badge variant="outline" className="font-mono text-xs">
            {data.rows.length}
          </Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t({ ar: "الطلب", en: "Order" })}</TableHead>
              <TableHead>{t({ ar: "المتجر", en: "Store" })}</TableHead>
              <TableHead>{t({ ar: "العميل", en: "Customer" })}</TableHead>
              <TableHead className="text-xs">{t({ ar: "المدينة", en: "City" })}</TableHead>
              <TableHead className="text-center">{t({ ar: "الحالة", en: "Status" })}</TableHead>
              <TableHead className="text-xs text-muted-foreground">
                {t({ ar: "الدفع", en: "Payment" })}
              </TableHead>
              <TableHead className="text-end">{t({ ar: "الإجمالي", en: "Total" })}</TableHead>
              <TableHead>{t({ ar: "التاريخ", en: "Created" })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap font-mono text-xs">
                  {row.referenceCode}
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {row.storeName}
                </TableCell>
                <TableCell className="text-sm">
                  {row.customerName}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {row.city || "—"}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={`text-xs ${statusTone[row.status] ?? ""}`}>
                    {row.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {row.paymentMethod} · {row.paymentStatus}
                </TableCell>
                <TableCell className="text-end font-mono text-xs">
                  {formatSarExact(row.totalSar, locale)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {formatDateTime(row.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
