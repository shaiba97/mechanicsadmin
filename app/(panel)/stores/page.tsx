"use client";

import * as React from "react";
import { Ban, Check, Loader, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/hooks/use-locale";
import { formatNumber } from "@/lib/format";
import { api } from "@/lib/api";
import Link from "next/link";

type StoreStatus = "pending_approval" | "verified" | "suspended";

const STORE_STATUS_LABELS: Record<StoreStatus, { ar: string; en: string }> = {
  pending_approval: { ar: "بانتظار اعتماد السجل", en: "Pending CR Approval" },
  verified: { ar: "موثّق", en: "Verified" },
  suspended: { ar: "موقوف", en: "Suspended" },
};

const statusIcon: Record<StoreStatus, React.ReactNode> = {
  verified: <Check className="size-3" aria-hidden="true" />,
  pending_approval: null,
  suspended: <Ban className="size-3" aria-hidden="true" />,
};

type Store = {
  id: string;
  code: string;
  name: string;
  crNumber: string;
  status: StoreStatus;
  isVerified: boolean;
  city: string;
  ordersCount: number;
  createdAt: string;
};

export default function StoresPage() {
  const { t, locale } = useLocale();
  const [query, setQuery] = React.useState("");
  const [stores, setStores] = React.useState<Store[]>([]);
  const [loading, setLoading] = React.useState(false);

  const fetchStores = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Store[]>(`/api/admin/stores?q=${encodeURIComponent(query)}`);
      setStores(res);
    } catch {
      setStores([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  React.useEffect(() => {
    const timer = setTimeout(fetchStores, 150);
    return () => clearTimeout(timer);
  }, [query, fetchStores]);

  return (
    <Card className="py-4">
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="relative min-w-56 flex-1 sm:max-w-72">
            <Search
              className="absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={2}
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t({ ar: "بحث بالاسم أو رقم السجل أو رمز المتجر", en: "Search by name, CR number, or store code" })}
              className="ps-9"
            />
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {formatNumber(stores.length)}
          </Badge>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader className="size-4 animate-spin" />
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t({ ar: "المتجر", en: "Store" })}</TableHead>
              <TableHead>{t({ ar: "السجل التجاري", en: "CR Number" })}</TableHead>
              <TableHead className="text-center">{t({ ar: "المدينة", en: "City" })}</TableHead>
              <TableHead className="text-end">{t({ ar: "الطلبات", en: "Orders" })}</TableHead>
              <TableHead className="text-center">{t({ ar: "الحالة", en: "Status" })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores.map((store) => {
              const label =
                STORE_STATUS_LABELS[store.status as StoreStatus]?.[locale] ?? store.status;
              return (
                <TableRow key={store.id}>
                  <TableCell>
                    <Link href={`/stores/${store.id}`} className="flex flex-col gap-0.5">
                      <span className="block text-sm font-medium">{store.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {store.code}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs">
                    {store.crNumber || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {store.city || "—"}
                  </TableCell>
                  <TableCell className="text-end font-mono text-xs">
                    {formatNumber(store.ordersCount)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="gap-1 text-xs">
                      {statusIcon[store.status as StoreStatus]}
                      {label}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
            {stores.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  {t({ ar: "لا توجد متاجر", en: "No stores found" })}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
