"use client";

import * as React from "react";
import { History, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
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
import { formatDate } from "@/lib/format";

export function CommissionsTab() {
  const { t, locale } = useLocale();
  const [rate, setRate] = React.useState(0.1);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [draftPct, setDraftPct] = React.useState("10");
  const [error, setError] = React.useState<string | null>(null);
  const [log, setLog] = React.useState<Array<{
    id: string;
    at: string;
    toPct: number;
    updatedBy: string;
  }>>([]);

  React.useEffect(() => {
    const load = async () => {
      try {
        const [{ rate }, logData] = await Promise.all([
          api.get<{ rate: number; ratePercent: number }>(
            "/api/admin/commission-rate",
          ),
          api.get<Array<{ id: string; at: string; toPct: number; updatedBy: string }>>(
            "/api/admin/financials/commission-rate-log",
          ),
        ]);
        setRate(rate);
        setDraftPct(String(Math.round(rate * 100)));
        setLog(logData);
      } catch {
        setRate(0.1);
        setDraftPct("10");
        setLog([]);
      }
    };
    load();
  }, []);

  const openEdit = () => {
    setDraftPct(String(Math.round(rate * 100)));
    setError(null);
    setDialogOpen(true);
  };

  const save = async () => {
    const pct = Number(draftPct);
    if (!Number.isFinite(pct)) {
      setError(t({ ar: "أدخل نسبة رقمية", en: "Enter a numeric rate" }));
      return;
    }
    if (pct < 0 || pct > 100) {
      setError(t({ ar: "النسبة يجب أن تكون بين 0% و100%", en: "Rate must be between 0% and 100%" }));
      return;
    }
    try {
      const updated = await api.patch<{ rate: number; ratePercent: number; updatedBy: string }>(
        "/api/admin/commission-rate/update",
        { rate: pct },
      );
      setRate(updated.rate);
      setLog([
        {
          id: `RL-${Date.now()}`,
          at: new Date().toISOString().slice(0, 10),
          toPct: updated.ratePercent,
          updatedBy: updated.updatedBy || "",
        },
        ...log,
      ]);
      setDialogOpen(false);
    } catch {
      setError(t({ ar: "فشل تحديث النسبة", en: "Failed to update rate" }));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            {t({ ar: "نسبة العمولة الموحدة", en: "Unified Commission Rate" })}
          </h2>
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/10 font-mono text-xs text-primary"
          >
            {t({ ar: "تطبق على جميع الفئات والمتاجر", en: "Applies to all categories and stores" })}
          </Badge>
        </div>

        <div className="flex flex-col gap-3 rounded-md border bg-muted/40 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">
              {t({ ar: "نسبة العمولة (النسبة المئوية)", en: "Commission rate (percentage)" })}
            </span>
            <span className="font-mono font-medium">{Math.round(rate * 100)}%</span>
          </div>
          <Slider
            min={0}
            max={100}
            step={0.5}
            value={[Math.round(rate * 100)]}
            onValueChange={(value) => {
              const v = Array.isArray(value) ? value[0] : value;
              setDraftPct(String(v));
            }}
            aria-label={t({ ar: "نسبة العمولة", en: "Commission rate" })}
          />
        </div>

        <Button size="sm" variant="outline" className="mt-4 h-7 w-fit gap-1 text-xs" onClick={openEdit}>
          <Pencil className="size-3" strokeWidth={2.5} aria-hidden="true" />
          {t({ ar: "تعديل النسبة", en: "Edit rate" })}
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <History className="size-4 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
          <h2 className="text-sm font-semibold">
            {t({ ar: "سجل تغييرات النسبة", en: "Rate change history" })}
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t({ ar: "التاريخ", en: "Date" })}</TableHead>
              <TableHead className="text-end">{t({ ar: "إلى", en: "To" })}</TableHead>
              <TableHead>{t({ ar: "تم التحديث بواسطة", en: "Updated by" })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {log.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                  {t({ ar: "لا يوجد سجل", en: "No history" })}
                </TableCell>
              </TableRow>
            ) : (
              log.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                    {formatDate(entry.at, locale)}
                  </TableCell>
                  <TableCell className="text-end font-mono text-xs font-medium text-primary">
                    {entry.toPct}%
                  </TableCell>
                  <TableCell className="max-w-64 truncate text-xs text-muted-foreground">
                    {entry.updatedBy || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t({ ar: "تعديل نسبة العمولة", en: "Edit commission rate" })}</DialogTitle>
            <DialogDescription>
              {t({
                ar: "تُطبق النسبة على جميع المبيعات لكل المتاجر والفئات",
                en: "The rate applies to all sales for all stores and categories",
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <label className="grid gap-1.5 text-xs font-medium">
              {t({ ar: "النسبة (%)", en: "Rate (%)" })}
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={draftPct}
                onChange={(event) => setDraftPct(event.target.value)}
                aria-invalid={Boolean(error)}
              />
              {error ? <span className="text-destructive">{error}</span> : null}
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              {t({ ar: "إلغاء", en: "Cancel" })}
            </Button>
            <Button size="sm" onClick={save}>
              {t({ ar: "حفظ النسبة", en: "Save rate" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
