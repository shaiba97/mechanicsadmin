"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocale } from "@/hooks/use-locale";
import { useSocketFeed } from "@/hooks/use-socket";
import { api } from "@/lib/api";
import { formatDateTime, formatSarExact } from "@/lib/format";
import { ksaCityName } from "@/lib/ksa";

type OrderStatus =
  | "pending"
  | "store_preparing"
  | "delivery_assigned"
  | "otp_generated"
  | "completed"
  | "cancelled";

type ApiOrder = {
  id: string;
  referenceCode: string;
  customerName: { ar: string; en: string };
  customerPhone: string;
  vin: string;
  parts: Array<{ ar: string; en: string }>;
  region: string;
  storeId: string;
  storeName: { ar: string; en: string };
  storeCode: string;
  status: OrderStatus;
  paymentStatus: string;
  paymentMethod: string;
  totalSar: number;
  receivedAt: string;
};

const ORDER_STATUS_LABELS: Record<OrderStatus, { ar: string; en: string }> = {
  pending: { ar: "قيد الانتظار", en: "Pending" },
  store_preparing: { ar: "المتجر يحضّر", en: "Store Preparing" },
  delivery_assigned: { ar: "تم تعيين التوصيل", en: "Delivery Assigned" },
  otp_generated: { ar: "تم إنشاء رمز OTP", en: "OTP Generated" },
  completed: { ar: "مكتمل", en: "Completed" },
  cancelled: { ar: "ملغى", en: "Cancelled" },
};

type OrderFilter = "all" | OrderStatus;

export default function OrdersPage() {
  const { t, locale } = useLocale();
  const { status } = useSocketFeed();
  const [filter, setFilter] = React.useState<OrderFilter>("all");
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

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle>{t({ ar: "الطلبات", en: "Orders" })}</CardTitle>
          <Badge variant="outline" className="text-[11px]">
            {status === "connected"
              ? t({ ar: "مباشر", en: "Live" })
              : t({ ar: "غير متصل", en: "Offline" })}
          </Badge>
          <Tabs
            value={filter}
            onValueChange={(value) => setFilter(value as OrderFilter)}
            className="ms-auto"
          >
            <TabsList>
              <TabsTrigger value="all">{t({ ar: "الكل", en: "All" })}</TabsTrigger>
              <TabsTrigger value="pending">{t({ ar: "قيد الانتظار", en: "Pending" })}</TabsTrigger>
              <TabsTrigger value="store_preparing">
                {t({ ar: "المتجر يحضّر", en: "Store Preparing" })}
              </TabsTrigger>
              <TabsTrigger value="delivery_assigned">
                {t({ ar: "تم تعيين التوصيل", en: "Delivery Assigned" })}
              </TabsTrigger>
              <TabsTrigger value="otp_generated">
                {t({ ar: "تم إنشاء رمز OTP", en: "OTP Generated" })}
              </TabsTrigger>
              <TabsTrigger value="completed">{t({ ar: "مكتمل", en: "Completed" })}</TabsTrigger>
              <TabsTrigger value="cancelled">{t({ ar: "ملغى", en: "Cancelled" })}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <CardDescription>
          {t({
            ar: "سجل الطلبات عبر مناطق المملكة مع رموز الطلبات وأرقام الجوال وبطاقات المركبات",
            en: "Order log across KSA regions with order codes, phone numbers, and vehicle VINs",
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground" role="status">
            {t({ ar: "جارٍ التحميل…", en: "Loading…" })}
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground" role="status">
            {t({ ar: "لا توجد طلبات مطابقة", en: "No matching orders" })}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t({ ar: "الطلب", en: "Order" })}</TableHead>
                <TableHead>{t({ ar: "العميل", en: "Customer" })}</TableHead>
                <TableHead>VIN</TableHead>
                <TableHead>{t({ ar: "المنطقة", en: "Region" })}</TableHead>
                <TableHead>{t({ ar: "المتجر", en: "Store" })}</TableHead>
                <TableHead>{t({ ar: "الاستلام", en: "Received" })}</TableHead>
                <TableHead className="text-end">{t({ ar: "الإجمالي", en: "Total" })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="whitespace-nowrap">
                    <span className="font-mono text-xs">{order.referenceCode}</span>
                    <Badge variant="outline" className="ms-2 gap-1 text-[11px]">
                      {ORDER_STATUS_LABELS[order.status][locale]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {order.customerName[locale]}
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap font-mono text-xs text-muted-foreground">
                    <Kbd className="font-mono text-[11px]">{order.vin || "—"}</Kbd>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {ksaCityName(order.region, locale)}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {order.storeName[locale]}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDateTime(order.receivedAt)}
                  </TableCell>
                  <TableCell className="text-end font-mono text-xs">
                    {formatSarExact(order.totalSar, locale)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
