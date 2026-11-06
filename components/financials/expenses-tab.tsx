"use client";

import * as React from "react";
import { Pencil, Plus, Receipt, Trash2 } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocale } from "@/hooks/use-locale";
import { formatDate, formatSarExact } from "@/lib/format";
import { ConfirmDeleteDialog } from "@/components/financials/confirm-delete-dialog";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
  type ExpenseEntry,
  ExpenseBreakdown,
} from "@/components/financials/expense-breakdown";

type Draft = {
  date: string;
  category: ExpenseCategory;
  amount: string;
  description: string;
  vendor: string;
};

const emptyDraft = (today: string): Draft => ({
  date: today,
  category: "operations",
  amount: "",
  description: "",
  vendor: "",
});

export function ExpensesTab({
  expenses,
  onChange,
}: {
  expenses: ExpenseEntry[];
  onChange: (next: ExpenseEntry[]) => void;
}) {
  const { t, locale } = useLocale();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<Draft>(() => emptyDraft("2026-10-30"));
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = React.useState<ExpenseEntry | null>(null);

  const totalSar = expenses.reduce((sum, expense) => sum + expense.amountSar, 0);

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft("2026-10-30"));
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (expense: ExpenseEntry) => {
    setEditingId(expense.id);
    setDraft({
      date: expense.date,
      category: expense.category,
      amount: String(expense.amountSar),
      description: expense.description[locale],
      vendor: expense.vendor[locale],
    });
    setErrors({});
    setDialogOpen(true);
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const amount = Number(draft.amount);
    if (!draft.date) {
      next.date = t({ ar: "التاريخ مطلوب", en: "Date is required" });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      next.amount = t({ ar: "أدخل مبلغاً أكبر من صفر", en: "Enter an amount above zero" });
    }
    if (draft.description.trim().length < 3) {
      next.description = t({
        ar: "أضف وصفاً لا يقل عن 3 أحرف",
        en: "Add a description of at least 3 characters",
      });
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = () => {
    if (!validate()) return;
    const amountSar = Math.round(Number(draft.amount));
    if (editingId) {
      onChange(
        expenses.map((expense) =>
          expense.id === editingId
            ? {
                ...expense,
                date: draft.date,
                category: draft.category,
                amountSar,
                description: { ar: draft.description, en: draft.description },
                vendor: { ar: draft.vendor || draft.description, en: draft.vendor || draft.description },
              }
            : expense,
        ),
      );
    } else {
      onChange([
        {
          id: `EX-${Math.floor(2211 + expenses.length)}`,
          date: draft.date,
          category: draft.category,
          amountSar,
          description: { ar: draft.description, en: draft.description },
          vendor: { ar: draft.vendor || draft.description, en: draft.vendor || draft.description },
        },
        ...expenses,
      ]);
    }
    setDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 xl:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Receipt className="size-4 text-primary" strokeWidth={2} aria-hidden="true" />
              <h2 className="text-sm font-semibold">
                {t({ ar: "سجل المصروفات", en: "Expenses ledger" })}
              </h2>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {t({ ar: "الإجمالي", en: "Total" })} {formatSarExact(totalSar, locale)}
            </Badge>
            <Button size="sm" className="ms-auto h-7 gap-1 text-xs" onClick={openCreate}>
              <Plus className="size-3" strokeWidth={2.5} aria-hidden="true" />
              {t({ ar: "إضافة مصروف", en: "Add expense" })}
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t({ ar: "التاريخ", en: "Date" })}</TableHead>
                <TableHead>{t({ ar: "البند", en: "Category" })}</TableHead>
                <TableHead>{t({ ar: "الوصف", en: "Description" })}</TableHead>
                <TableHead>{t({ ar: "المورّد", en: "Vendor" })}</TableHead>
                <TableHead className="text-end">{t({ ar: "المبلغ", en: "Amount" })}</TableHead>
                <TableHead className="text-end">{t({ ar: "إجراءات", en: "Actions" })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                    {formatDate(expense.date, locale)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-border bg-muted text-xs text-primary"
                    >
                      {EXPENSE_CATEGORY_LABELS[expense.category][locale]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-56 truncate text-sm">
                    {expense.description[locale]}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {expense.vendor[locale]}
                  </TableCell>
                  <TableCell className="text-end font-mono text-xs font-medium">
                    {formatSarExact(expense.amountSar, locale)}
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => openEdit(expense)}
                        aria-label={t({ ar: "تعديل المصروف", en: "Edit expense" })}
                      >
                        <Pencil className="size-3.5" strokeWidth={2} aria-hidden="true" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => setDeleteTarget(expense)}
                        aria-label={t({ ar: "حذف المصروف", en: "Delete expense" })}
                      >
                        <Trash2 className="size-3.5" strokeWidth={2} aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <ExpenseBreakdown expenses={expenses} />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? t({ ar: "تعديل مصروف", en: "Edit expense" })
                : t({ ar: "إضافة مصروف جديد", en: "New expense" })}
            </DialogTitle>
            <DialogDescription>
              {t({
                ar: "تُسجَّل المصروفات بالريال السعودي وتُستخدم في تقارير الربحية",
                en: "Expenses are recorded in Saudi Riyals and feed the profitability reports",
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <label className="grid gap-1.5 text-xs font-medium">
              {t({ ar: "التاريخ", en: "Date" })}
              <Input
                type="date"
                value={draft.date}
                onChange={(event) => setDraft((prev) => ({ ...prev, date: event.target.value }))}
                aria-invalid={Boolean(errors.date)}
              />
              {errors.date ? <span className="text-destructive">{errors.date}</span> : null}
            </label>

            <label className="grid gap-1.5 text-xs font-medium">
              {t({ ar: "البند", en: "Category" })}
              <Select
                value={draft.category}
                onValueChange={(value) =>
                  setDraft((prev) => ({ ...prev, category: value as ExpenseCategory }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {EXPENSE_CATEGORY_LABELS[category][locale]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="grid gap-1.5 text-xs font-medium">
              {t({ ar: "المبلغ (ر.س)", en: "Amount (SAR)" })}
              <Input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                placeholder="0"
                value={draft.amount}
                onChange={(event) => setDraft((prev) => ({ ...prev, amount: event.target.value }))}
                aria-invalid={Boolean(errors.amount)}
              />
              {errors.amount ? <span className="text-destructive">{errors.amount}</span> : null}
            </label>

            <label className="grid gap-1.5 text-xs font-medium">
              {t({ ar: "الوصف", en: "Description" })}
              <Input
                value={draft.description}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, description: event.target.value }))}
                aria-invalid={Boolean(errors.description)}
              />
              {errors.description ? (
                <span className="text-destructive">{errors.description}</span>
              ) : null}
            </label>

            <label className="grid gap-1.5 text-xs font-medium">
              {t({ ar: "المورّد", en: "Vendor" })}
              <Input
                value={draft.vendor}
                onChange={(event) => setDraft((prev) => ({ ...prev, vendor: event.target.value }))}
                placeholder={t({ ar: "اختياري", en: "Optional" })}
              />
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              {t({ ar: "إلغاء", en: "Cancel" })}
            </Button>
            <Button size="sm" onClick={save}>
              {editingId
                ? t({ ar: "حفظ التعديل", en: "Save changes" })
                : t({ ar: "إضافة المصروف", en: "Add expense" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t({ ar: "حذف المصروف؟", en: "Delete this expense?" })}
        description={
          deleteTarget
            ? t({
                ar: `سيُحذف ${deleteTarget.id} بقيمة ${formatSarExact(deleteTarget.amountSar, "ar")} ر.س من السجل.`,
                en: `Entry ${deleteTarget.id} worth SAR ${deleteTarget.amountSar.toLocaleString("en-US")} will be removed from the ledger.`,
              })
            : ""
        }
        confirmLabel={t({ ar: "حذف", en: "Delete" })}
        cancelLabel={t({ ar: "إلغاء", en: "Cancel" })}
        onConfirm={() => {
          if (deleteTarget) {
            onChange(expenses.filter((expense) => expense.id !== deleteTarget.id));
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}