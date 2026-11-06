"use client";

import * as React from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/hooks/use-locale";
import { api } from "@/lib/api";
import { formatSarExact } from "@/lib/format";

type AccrualAdjustment = {
  id: string;
  storeId: string;
  storeCode: string;
  storeName: string;
  orderId: string | null;
  referenceCode: string;
  type: string;
  amountSar: number;
  status: string;
  notes: string;
  createdAt: string;
  appliedAt: string | null;
};

type StoreOption = { id: string; name: string; code: string };

const ADJUSTMENT_TYPES: { id: string; label: { ar: string; en: string } }[] = [
  {
    id: "deferred_revenue",
    label: { ar: "إيرادات مؤجلة", en: "Deferred Revenue" },
  },
  {
    id: "accrued_expense",
    label: { ar: "مصروفات مستحقة", en: "Accrued Expense" },
  },
  {
    id: "inventory_writeoff",
    label: { ar: "إهلاك مخزون", en: "Inventory Write-off" },
  },
];

const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  pending: { ar: "معلق", en: "Pending" },
  applied: { ar: "مطبق", en: "Applied" },
  reversed: { ar: "مُعكس", en: "Reversed" },
};

const STATUS_TONES: Record<string, string> = {
  pending: "border-amber/40 bg-amber/10 text-amber",
  applied: "border-green/40 bg-green/10 text-green",
  reversed: "border-border bg-muted text-muted-foreground",
};

export function AccrualAdjustments() {
  const { t, locale } = useLocale();
  const [adjustments, setAdjustments] = React.useState<AccrualAdjustment[]>([]);
  const [stores, setStores] = React.useState<StoreOption[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [saving, setSaving] = React.useState<Set<string>>(new Set());

  const [draftStore, setDraftStore] = React.useState("");
  const [draftType, setDraftType] = React.useState(ADJUSTMENT_TYPES[0].id);
  const [draftAmount, setDraftAmount] = React.useState("");
  const [draftNotes, setDraftNotes] = React.useState("");

  React.useEffect(() => {
    const load = async () => {
      try {
        const [adjData, storeData] = await Promise.all([
          api.get<AccrualAdjustment[]>("/api/admin/financials/accruals"),
          api.get<StoreOption[]>(
            "/api/admin/stores",
          ),
        ]);
        setAdjustments(adjData);
        setStores(
          (storeData as Array<{ id: string; name: string; code: string }>).map(
            (s) => ({ id: s.id, name: s.name, code: s.code }),
          ),
        );
      } catch {
        setAdjustments([]);
        setStores([]);
      }
    };
    load();
  }, []);

  const totalPending = adjustments
    .filter((a) => a.status === "pending")
    .reduce((sum, a) => sum + a.amountSar, 0);

  const handleCreate = async () => {
    const amount = Number(draftAmount);
    if (!draftStore || !Number.isFinite(amount) || amount <= 0) {
      toast.add({
        title: t({ ar: "بيانات غير صالحة", en: "Invalid data" }),
        description: t({
          ar: "اختر متجراً وأدخل مبلغاً أكبر من صفر",
          en: "Select a store and enter an amount greater than zero",
        }),
        type: "destructive",
      });
      return;
    }
    setSaving((prev) => new Set([...prev, "create"]));
    try {
      await api.post<AccrualAdjustment>("/api/admin/financials/accruals", {
        storeId: draftStore,
        type: draftType,
        amountSar: amount,
        notes: draftNotes,
      });
      setDialogOpen(false);
      setDraftStore("");
      setDraftAmount("");
      setDraftNotes("");
      const adjData = await api.get<AccrualAdjustment[]>(
        "/api/admin/financials/accruals",
      );
      setAdjustments(adjData);
    } catch {
      toast.add({
        title: t({ ar: "فشل الإنشاء", en: "Failed to create" }),
        type: "destructive",
      });
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete("create");
        return next;
      });
    }
  };

  const handleStatusChange = async (id: string, nextStatus: string) => {
    setSaving((prev) => new Set([...prev, id]));
    try {
      await api.patch<AccrualAdjustment>(
        `/api/admin/financials/accruals/${id}`,
        { status: nextStatus },
      );
      setAdjustments((current) =>
        current.map((a) =>
          a.id === id ? { ...a, status: nextStatus } : a,
        ),
      );
    } catch {
      toast.add({
        title: t({ ar: "فشل تحديث الحالة", en: "Failed to update status" }),
        type: "destructive",
      });
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        t({ ar: "هل أنت متأكد من الحذف؟", en: "Are you sure you want to delete?" }),
      )
    ) {
      return;
    }
    setSaving((prev) => new Set([...prev, id]));
    try {
      await api.delete(`/api/admin/financials/accruals/${id}`);
      setAdjustments((current) => current.filter((a) => a.id !== id));
    } catch {
      toast.add({
        title: t({ ar: "فشل الحذف", en: "Failed to delete" }),
        type: "destructive",
      });
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const typeLabel = (id: string) =>
    ADJUSTMENT_TYPES.find((t) => t.id === id)?.label[locale] ?? id;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">
            {t({ ar: "تسويات الاستحقاق", en: "Accrual Adjustments" })}
          </h2>
          <Badge variant="outline" className="font-mono text-xs">
            {adjustments.length}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">
          {t({
            ar: "مجموع المعلق",
            en: "Pending total",
          })}: {formatSarExact(totalPending, locale)}
        </span>
        <Button
          size="sm"
          onClick={() => {
            setDraftStore("");
            setDraftType(ADJUSTMENT_TYPES[0].id);
            setDraftAmount("");
            setDraftNotes("");
            setDialogOpen(true);
          }}
        >
          {t({ ar: "إضافة تسوية", en: "Add adjustment" })}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t({ ar: "النوع", en: "Type" })}</TableHead>
            <TableHead className="text-end">{t({ ar: "المبلغ", en: "Amount" })}</TableHead>
            <TableHead className="text-center">{t({ ar: "الحالة", en: "Status" })}</TableHead>
            <TableHead>{t({ ar: "المتجر", en: "Store" })}</TableHead>
            <TableHead>{t({ ar: "ملاحظات", en: "Notes" })}</TableHead>
            <TableHead className="text-end">{t({ ar: "إجراء", en: "Action" })}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {adjustments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                {t({ ar: "لا توجد تسويات", en: "No adjustments" })}
              </TableCell>
            </TableRow>
          ) : (
            adjustments.map((adj) => (
              <TableRow key={adj.id}>
                <TableCell className="text-xs font-medium">
                  {typeLabel(adj.type)}
                </TableCell>
                <TableCell className="text-end font-mono text-xs">
                  {formatSarExact(adj.amountSar, locale)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant="outline"
                    onClick={() =>
                      handleStatusChange(
                        adj.id,
                        adj.status === "pending" ? "applied" : "pending",
                      )
                    }
                    className={`cursor-pointer text-xs ${STATUS_TONES[adj.status] ?? ""}`}
                  >
                    {STATUS_LABELS[adj.status]?.[locale] ?? adj.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {adj.storeName} ({adj.storeCode})
                </TableCell>
                <TableCell className="text-xs text-muted-foreground truncate max-w-32" title={adj.notes}>
                  {adj.notes || "—"}
                </TableCell>
                <TableCell className="text-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 text-xs"
                    disabled={saving.has(adj.id)}
                    onClick={() => handleDelete(adj.id)}
                  >
                    {t({ ar: "حذف", en: "Delete" })}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t({ ar: "إضافة تسوية استحقاق", en: "Add accrual adjustment" })}</DialogTitle>
            <DialogDescription>
              {t({
                ar: "سجل تعديلاً استحقاقياً لمتجر (إيراد مؤجل، مصروف مستحق، أو إهلاك مخزون).",
                en: "Record an accrual adjustment for a store (deferred revenue, accrued expense, or inventory write-off).",
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">
                  {t({ ar: "المتجر", en: "Store" })}
                </label>
                <Select
                  value={draftStore}
                  onValueChange={(value) => setDraftStore(value ?? "")}
                  disabled={saving.has("create")}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="اختر متجر…" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">
                  {t({ ar: "النوع", en: "Type" })}
                </label>
                <Select
                  value={draftType}
                  onValueChange={(value) => setDraftType(value ?? draftType)}
                  disabled={saving.has("create")}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue>{typeLabel(draftType)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ADJUSTMENT_TYPES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label[locale]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">
                {t({ ar: "المبلغ (ر.س)", en: "Amount (SAR)" })}
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={draftAmount}
                onChange={(e) => setDraftAmount(e.target.value)}
                disabled={saving.has("create")}
                placeholder="0.00"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">
                {t({ ar: "ملاحظات", en: "Notes" })}
              </label>
              <Input
                value={draftNotes}
                onChange={(e) => setDraftNotes(e.target.value)}
                disabled={saving.has("create")}
                placeholder={t({ ar: "مثال: دفعة مقدمة لأجزاء لم تُشحن بعد", en: "e.g. Prepayment for parts not yet shipped" })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              {t({ ar: "إلغاء", en: "Cancel" })}
            </Button>
            <Button size="sm" disabled={saving.has("create")} onClick={handleCreate}>
              {t({ ar: "إنشاء", en: "Create" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
