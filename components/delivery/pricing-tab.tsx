"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/hooks/use-locale";
import { api } from "@/lib/api";
import { formatSarExact } from "@/lib/format";

type MatrixCity = { slug: string; name: { ar: string; en: string }; fee: number };
type MatrixStore = { id: string; name: string; code: string; city: string };

type MatrixData = {
  cities: MatrixCity[];
  stores: MatrixStore[];
  fees: Record<string, Record<string, number>>;
};

export function PricingTab() {
  const { t, locale } = useLocale();
  const [data, setData] = React.useState<MatrixData | null>(null);
  const [edits, setEdits] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState<Set<string>>(new Set());
  const timersRef = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  React.useEffect(() => {
    const load = async () => {
      try {
        const result = await api.get<MatrixData>("/api/admin/delivery/matrix");
        setData(result);
      } catch {
        setData(null);
      }
    };
    load();
    return () => {
      const timers = timersRef.current;
      for (const key of Object.keys(timers)) {
        clearTimeout(timers[key]);
      }
    };
  }, []);

  const cityKey = (storeId: string, city: string) => `${storeId}:${city}`;

  const currentFee = (store: MatrixStore, city: MatrixCity): number | null => {
    const pending = edits[cityKey(store.id, city.slug)];
    if (pending !== undefined && pending !== "") {
      const parsed = Number(pending);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return data?.fees[store.id]?.[city.slug] ?? null;
  };

  const handleChange = (store: MatrixStore, city: MatrixCity, value: string) => {
    setEdits((prev) => ({ ...prev, [cityKey(store.id, city.slug)]: value }));
    const key = cityKey(store.id, city.slug);
    clearTimeout(timersRef.current[key]);
    timersRef.current[key] = setTimeout(() => {
      const parsed = value === "" ? null : Number(value);
      if (
        value !== "" &&
        (parsed === null || !Number.isFinite(parsed) || parsed < 0 || parsed > 9999.99)
      ) {
        toast.add({
          title: t({ ar: "قيمة غير صالحة", en: "Invalid fee" }),
          description: t({
            ar: "أدخل مبلغاً بين 0 و 9999.99",
            en: "Enter an amount between 0 and 9999.99",
          }),
          type: "error",
        });
        return;
      }
      setSaving((prev) => new Set([...prev, key]));
      api
        .patch<{ storeId: string; city: string; feeSar: number | null }>(
          "/api/admin/delivery/fee",
          { storeId: store.id, city: city.slug, feeSar: parsed },
        )
        .then(() => {
          setEdits((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
          setSaving((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        })
        .catch(() => {
          toast.add({
            title: t({ ar: "فشل التحديث", en: "Update failed" }),
            type: "error",
          });
          setSaving((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        });
    }, 600);
  };

  if (!data) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <h2 className="text-sm font-semibold">
          {t({ ar: "مصفوفة أسعار التوصيل", en: "Delivery pricing matrix" })}
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
              {t({ ar: "أسعار التوصيل حسب المتجر والمدينة", en: "Delivery fee per store × city" })}
            </h2>
            <Badge variant="outline" className="font-mono text-xs">
              {data.stores.length} × {data.cities.length}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {t({
              ar: "اترك الحقل فارغاً للرجوع إلى الرسوم الافتراضية للمدينة",
              en: "Leave empty to fall back to the city default fee",
            })}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">{t({ ar: "المتجر", en: "Store" })}</TableHead>
              {data.cities.map((city) => (
                <TableHead key={city.slug} className="w-[110px] text-end">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-medium">{city.name[locale]}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatSarExact(city.fee, locale)}{" "}
                      {t({ ar: "الافتراضي", en: "default" })}
                    </span>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.stores.map((store) => (
              <TableRow key={store.id}>
                <TableCell className="font-medium whitespace-nowrap">
                  <div className="flex flex-col gap-0.5">
                    <span>{store.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{store.code}</span>
                  </div>
                </TableCell>
                {data.cities.map((city) => (
                  <TableCell key={city.slug} className="text-end px-2">
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      max={9999.99}
                      value={edits[cityKey(store.id, city.slug)] ?? ""}
                      placeholder={
                        currentFee(store, city) === null
                          ? formatSarExact(city.fee, locale)
                          : formatSarExact(currentFee(store, city)!, locale)
                      }
                      className="h-7 text-[11px] text-end w-20 border-transparent focus:border-primary focus:ring-0 disabled:bg-transparent sm:w-24"
                      disabled={saving.has(cityKey(store.id, city.slug))}
                      onChange={(event) =>
                        handleChange(store, city, event.target.value)
                      }
                      onBlur={(event) =>
                        handleChange(store, city, event.target.value)
                      }
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
