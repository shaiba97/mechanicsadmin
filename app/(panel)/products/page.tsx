"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocale } from "@/hooks/use-locale";
import { formatNumber, formatSarExact } from "@/lib/format";
import { api } from "@/lib/api";

type InventoryItem = {
  id: string;
  sku: string;
  name: { ar: string; en: string };
  brandId: string;
  brandName: { ar: string; en: string } | null;
  categoryId: string;
  categoryName: { ar: string; en: string } | null;
  priceSar: number;
  stockQty: number;
  isActive: boolean;
};

type StatusFilter = "all" | "active" | "low_stock" | "out_of_stock";

const statusTone: Record<StatusFilter, string> = {
  all: "border-primary/40 bg-primary/10 text-primary",
  active: "border-primary/40 bg-primary/10 text-primary",
  low_stock: "border-border bg-muted text-foreground",
  out_of_stock: "border-border bg-muted text-muted-foreground",
};

export default function PartsInventoriesPage() {
  const { t, locale } = useLocale();
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [items, setItems] = React.useState<InventoryItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  const fetchItems = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<InventoryItem[]>(
        `/api/admin/inventory?q=${encodeURIComponent(query)}`
      );
      setItems(res);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  React.useEffect(() => {
    const timer = setTimeout(fetchItems, 150);
    return () => clearTimeout(timer);
  }, [query, fetchItems]);

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (category !== "all" && item.categoryId !== category) return false;
      if (needle) {
        const haystack = `${item.sku} ${item.name.ar} ${item.name.en}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [items, query, category]);

  const productState = (item: InventoryItem): StatusFilter => {
    if (item.stockQty <= 0) return "out_of_stock";
    if (item.stockQty <= 10) return "low_stock";
    return "active";
  };

  const categories = React.useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{ id: string; name: string }> = [];
    for (const item of items) {
      if (item.categoryId && !seen.has(item.categoryId)) {
        seen.add(item.categoryId);
        list.push({ id: item.categoryId, name: item.categoryName?.[locale] ?? item.categoryId });
      }
    }
    return list;
  }, [items]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t({ ar: "المخزون - قطع الغيار", en: "Parts Inventories" })}</CardTitle>
        <CardDescription>
          {t({
            ar: "عرض جميع قطع الغيار في المخزون مع المستويات والأسعار",
            en: "Browse all spare parts inventory with stock levels and prices",
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-56 flex-1 sm:max-w-72">
            <Search
              className="absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={2}
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t({
                ar: "بحث بالاسم أو رقم القطعة",
                en: "Search by name or SKU",
              })}
              className="ps-9"
            />
          </div>

          <Select value={category} onValueChange={(value) => setCategory(value ?? "all")}>
            <SelectTrigger size="sm" className="min-w-40">
              <SelectValue placeholder={t({ ar: "التصنيف", en: "Category" })} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t({ ar: "كل التصنيفات", en: "All categories" })}
              </SelectItem>
              {categories.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={(value) => setStatus((value ?? "all") as StatusFilter)}>
            <SelectTrigger size="sm" className="min-w-40">
              <SelectValue placeholder={t({ ar: "الحالة", en: "Status" })} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t({ ar: "كل الحالات", en: "All statuses" })}</SelectItem>
              <SelectItem value="active">{t({ ar: "نشط", en: "Active" })}</SelectItem>
              <SelectItem value="low_stock">{t({ ar: "مخزون منخفض", en: "Low stock" })}</SelectItem>
              <SelectItem value="out_of_stock">{t({ ar: "نفد المخزون", en: "Out of stock" })}</SelectItem>
            </SelectContent>
          </Select>

          <Badge variant="outline" className="font-mono text-xs">
            {formatNumber(filtered.length)} / {formatNumber(items.length)}
          </Badge>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-4">
            <span className="text-xs text-muted-foreground">{t({ ar: "جاري التحميل...", en: "Loading..." })}</span>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t({ ar: "رقم القطعة", en: "SKU" })}</TableHead>
              <TableHead>{t({ ar: "القطعة", en: "Part" })}</TableHead>
              <TableHead>{t({ ar: "العلامة التجارية", en: "Brand" })}</TableHead>
              <TableHead>{t({ ar: "التصنيف", en: "Category" })}</TableHead>
              <TableHead className="text-end">{t({ ar: "السعر", en: "Price" })}</TableHead>
              <TableHead className="text-end">{t({ ar: "المخزون", en: "Stock" })}</TableHead>
              <TableHead>{t({ ar: "الحالة", en: "Status" })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered
              .filter((item) => {
                if (status === "all") return true;
                const state = productState(item);
                return state === status;
              })
              .map((item) => {
                const state = productState(item);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap font-mono text-xs">
                      {item.sku}
                    </TableCell>
                    <TableCell>
                      <span className="block text-sm font-medium">
                        {item.name[locale]}
                      </span>
                      <span className="block font-mono text-[11px] text-muted-foreground">
                        {item.name[locale] === item.name.ar ? item.name.en : item.name.ar}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.brandName?.[locale] ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.categoryName?.[locale] ?? "—"}
                    </TableCell>
                    <TableCell className="text-end font-mono text-xs">
                      {formatSarExact(item.priceSar, locale)}
                    </TableCell>
                    <TableCell className="text-end font-mono text-xs">
                      {formatNumber(item.stockQty)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${statusTone[state]}`}>
                        {state === "active"
                          ? t({ ar: "نشط", en: "Active" })
                          : state === "low_stock"
                            ? t({ ar: "مخزون منخفض", en: "Low stock" })
                            : t({ ar: "نفد المخزون", en: "Out of stock" })}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  {t({ ar: "لا توجد قطع غيار مطابقة", en: "No matching parts" })}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
