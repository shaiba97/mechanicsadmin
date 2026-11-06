"use client";

import * as React from "react";
import { CircleCheck, CircleDashed, CornerDownRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatNumber, formatPhone, formatSarExact } from "@/lib/format";
import { ksaCityName } from "@/lib/ksa";

type ApiOrder = {
  id: string;
  referenceCode: string;
  customerName: { ar: string; en: string };
  customerPhone: string;
  vin: string;
  parts: Array<{ ar: string; en: string }>;
  region: string;
  storeId: string;
  status: string;
  totalSar: number;
  receivedAt: string;
};

const statusIcon: Record<string, React.ReactNode> = {
  pending: <CircleDashed className="size-3" aria-hidden="true" />,
  store_preparing: <CornerDownRight className="size-3" aria-hidden="true" />,
  delivery_assigned: <CornerDownRight className="size-3" aria-hidden="true" />,
  otp_generated: <CornerDownRight className="size-3" aria-hidden="true" />,
  completed: <CircleCheck className="size-3" aria-hidden="true" />,
  cancelled: <CircleDashed className="size-3" aria-hidden="true" />,
};

function OrderRow({ order }: { order: ApiOrder }) {
  const { locale } = useLocale();

  return (
    <TableRow>
      <TableCell className="whitespace-nowrap">
        <span className="font-mono text-xs">{order.referenceCode}</span>
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm">
        {order.customerName[locale]}
      </TableCell>
      <TableCell className="whitespace-nowrap font-mono text-[11px] text-muted-foreground">
        {formatPhone(order.customerPhone) || "—"}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Kbd className="font-mono text-[11px]">{order.vin}</Kbd>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {order.parts.map((part) => part[locale]).join(" · ")}
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm">
        {ksaCityName(order.region, locale)}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Badge variant="outline" className="gap-1 text-xs">
          {statusIcon[order.status]}
          {order.status}
        </Badge>
      </TableCell>
      <TableCell className="text-end font-mono text-xs">
        {formatSarExact(order.totalSar, locale)}
      </TableCell>
    </TableRow>
  );
}

export function OrderStream() {
  const { t } = useLocale();
  const [orders, setOrders] = React.useState<ApiOrder[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get<ApiOrder[]>("/api/admin/orders");
        setOrders(data);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>{t({ ar: "تدفق الطلبات المباشر", en: "Live Order Stream" })}</CardTitle>
          <Badge variant="outline" className="gap-1.5 text-[11px]">
            {formatNumber(orders.length)}{" "}
            {t({ ar: "أحدث الطلبات", en: "latest orders" })}
          </Badge>
        </div>
        <CardDescription>
          {t({
            ar: "طلبات العملاء لحظة بلحظة مع أرقام VIN وتعيين المتاجر عبر مناطق المملكة",
            en: "Real-time customer orders with VINs and store assignment across KSA regions",
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground" role="status">
            {t({ ar: "جارٍ التحميل…", en: "Loading…" })}
          </p>
        ) : orders.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground" role="status">
            {t({
              ar: "في انتظار أوّل طلب مباشر…",
              en: "Waiting for the first live order…",
            })}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t({ ar: "الطلب", en: "Order" })}</TableHead>
                <TableHead>{t({ ar: "العميل", en: "Customer" })}</TableHead>
                <TableHead className="text-center">{t({ ar: "الجوال", en: "Phone" })}</TableHead>
                <TableHead>VIN</TableHead>
                <TableHead>{t({ ar: "قطع الغيار", en: "Parts" })}</TableHead>
                <TableHead>{t({ ar: "المنطقة", en: "Region" })}</TableHead>
                <TableHead>{t({ ar: "الحالة", en: "Status" })}</TableHead>
                <TableHead className="text-end">{t({ ar: "الإجمالي", en: "Total" })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}