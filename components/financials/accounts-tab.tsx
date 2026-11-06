"use client";

import * as React from "react";
import {
  Building2,
  CreditCard,
  Landmark,
  Pencil,
  Plus,
  Star,
  Trash2,
  Wallet,
  type LucideIcon,
} from "lucide-react";
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
import { ConfirmDeleteDialog } from "@/components/financials/confirm-delete-dialog";

export type AccountType = "bank_account" | "corporate_card" | "digital_wallet" | "online_banking";

export type StripeConnectionStatus = "connected" | "pending" | "disconnected";

export const ACCOUNT_TYPE_LABELS: Record<AccountType, { ar: string; en: string }> = {
  bank_account: { ar: "حساب بنكي", en: "Bank account" },
  corporate_card: { ar: "بطاقة شركة", en: "Corporate card" },
  digital_wallet: { ar: "محفظة رقمية", en: "Digital wallet" },
  online_banking: { ar: "بوابة بنكية إلكترونية", en: "Online banking portal" },
};

export const STRIPE_STATUS_LABELS: Record<StripeConnectionStatus, { ar: string; en: string }> = {
  connected: { ar: "متصل بـ Stripe", en: "Stripe connected" },
  pending: { ar: "بانتظار الربط", en: "Pending verification" },
  disconnected: { ar: "غير متصل", en: "Disconnected" },
};

export type PaymentAccount = {
  id: string;
  type: AccountType;
  name: { ar: string; en: string };
  holder: { ar: string; en: string };
  reference: string;
  status: StripeConnectionStatus;
  isDefault: boolean;
  updatedAt: string;
};

const ACCOUNT_TYPES: AccountType[] = [
  "bank_account",
  "corporate_card",
  "digital_wallet",
  "online_banking",
];

const accountIcon: Record<AccountType, LucideIcon> = {
  bank_account: Landmark,
  corporate_card: CreditCard,
  digital_wallet: Wallet,
  online_banking: Building2,
};

type Draft = {
  type: AccountType;
  name: string;
  holder: string;
  reference: string;
  status: StripeConnectionStatus;
};

const emptyDraft: Draft = {
  type: "bank_account",
  name: "",
  holder: "",
  reference: "",
  status: "connected",
};

function maskReference(type: AccountType, reference: string): string {
  if (type === "bank_account") {
    if (reference.length < 8) return reference;
    return `${reference.slice(0, 4)}••••${reference.slice(-4)}`;
  }
  if (reference.length <= 4) return reference;
  return `••••${reference.slice(-4)}`;
}

export function AccountsTab({
  accounts,
  onChange,
}: {
  accounts: PaymentAccount[];
  onChange: (next: PaymentAccount[]) => void;
}) {
  const { t, locale } = useLocale();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<Draft>(emptyDraft);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = React.useState<PaymentAccount | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (account: PaymentAccount) => {
    setEditingId(account.id);
    setDraft({
      type: account.type,
      name: account.name[locale],
      holder: account.holder[locale],
      reference: account.reference,
      status: account.status,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const save = () => {
    const next: Record<string, string> = {};
    if (draft.name.trim().length < 3) {
      next.name = t({ ar: "أدخل اسماً واضحاً", en: "Enter a descriptive name" });
    }
    if (draft.holder.trim().length < 3) {
      next.holder = t({ ar: "أدخل اسم صاحب الحساب", en: "Enter the account holder" });
    }
    if (draft.reference.trim().length < 4) {
      next.reference = t({
        ar: "أدخل الآيبان أو آخر أربعة أرقام",
        en: "Enter the IBAN or last four digits",
      });
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const reference = draft.reference.trim();
    if (editingId) {
      onChange(
        accounts.map((account) =>
          account.id === editingId
            ? {
                ...account,
                type: draft.type,
                name: { ar: draft.name, en: draft.name },
                holder: { ar: draft.holder, en: draft.holder },
                reference,
                status: draft.status,
                updatedAt: "2026-10-30",
              }
            : account,
        ),
      );
    } else {
      onChange([
        ...accounts,
        {
          id: `ACC-${106 + accounts.length}`,
          type: draft.type,
          name: { ar: draft.name, en: draft.name },
          holder: { ar: draft.holder, en: draft.holder },
          reference,
          status: draft.status,
          isDefault: accounts.length === 0,
          updatedAt: "2026-10-30",
        },
      ]);
    }
    setDialogOpen(false);
  };

  const setDefault = (accountId: string) => {
    onChange(
      accounts.map((account) => ({ ...account, isDefault: account.id === accountId })),
    );
  };

  const connectedCount = accounts.filter((account) => account.status === "connected").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Landmark className="size-4" strokeWidth={2} aria-hidden="true" />
          </span>
          <div className="grid gap-0.5">
            <span className="text-sm font-semibold">
              {t({ ar: "ربط Stripe للمدفوعات", en: "Stripe payment connection" })}
            </span>
            <span className="text-xs text-muted-foreground">
              {t({
                ar: "تحويلات فورية إلى الحسابات البنكية السعودية وربط مصادر التمويل",
                en: "Instant transfers to KSA bank accounts and funding source links",
              })}
            </span>
          </div>
        </div>
        <Badge
          variant="outline"
          className="ms-auto gap-1 border-primary/40 bg-primary/10 text-xs text-primary"
        >
          <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
          {t({ ar: "متصل", en: "Connected" })} · {connectedCount}/{accounts.length}
        </Badge>
        <Button size="sm" className="h-7 gap-1 text-xs" onClick={openCreate}>
          <Plus className="size-3" strokeWidth={2.5} aria-hidden="true" />
          {t({ ar: "إضافة مصدر تمويل", en: "Add funding source" })}
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t({ ar: "المصدر", en: "Source" })}</TableHead>
              <TableHead>{t({ ar: "النوع", en: "Type" })}</TableHead>
              <TableHead>{t({ ar: "صاحب الحساب", en: "Account holder" })}</TableHead>
              <TableHead>{t({ ar: "الآيبان / المرجع", en: "IBAN / reference" })}</TableHead>
              <TableHead>{t({ ar: "حالة Stripe", en: "Stripe status" })}</TableHead>
              <TableHead>{t({ ar: "الترwiegend", en: "Routing" })}</TableHead>
              <TableHead className="text-end">{t({ ar: "إجراءات", en: "Actions" })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => {
              const Icon = accountIcon[account.type];
              return (
                <TableRow key={account.id}>
                  <TableCell>
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Icon className="size-3.5 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
                      {account.name[locale]}
                    </span>
                    <span className="block font-mono text-[11px] text-muted-foreground">
                      {account.id}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {ACCOUNT_TYPE_LABELS[account.type][locale]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {account.holder[locale]}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-[11px]">
                    {maskReference(account.type, account.reference)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        account.status === "connected"
                          ? "border-primary/40 bg-primary/10 text-xs text-primary"
                          : "border-border bg-muted text-xs text-muted-foreground"
                      }
                    >
                      {STRIPE_STATUS_LABELS[account.status][locale]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {account.isDefault ? (
                      <Badge className="gap-1 text-xs">
                        <Star className="size-3 fill-current" strokeWidth={2} aria-hidden="true" />
                        {t({ ar: "افتراضي", en: "Default" })}
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[11px]"
                        onClick={() => setDefault(account.id)}
                      >
                        {t({ ar: "اجعله افتراضياً", en: "Make default" })}
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => openEdit(account)}
                        aria-label={t({ ar: "تعديل المصدر", en: "Edit source" })}
                      >
                        <Pencil className="size-3.5" strokeWidth={2} aria-hidden="true" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => setDeleteTarget(account)}
                        aria-label={t({ ar: "حذف المصدر", en: "Delete source" })}
                      >
                        <Trash2 className="size-3.5" strokeWidth={2} aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? t({ ar: "تعديل مصدر التمويل", en: "Edit funding source" })
                : t({ ar: "إضافة مصدر تمويل", en: "Add funding source" })}
            </DialogTitle>
            <DialogDescription>
              {t({
                ar: "تُربط الحسابات مع Stripe للتحويلات الآلية إلى المتاجر",
                en: "Accounts are linked with Stripe for automated merchant transfers",
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <label className="grid gap-1.5 text-xs font-medium">
              {t({ ar: "النوع", en: "Type" })}
              <Select
                value={draft.type}
                onValueChange={(value) =>
                  setDraft((prev) => ({ ...prev, type: value as AccountType }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {ACCOUNT_TYPE_LABELS[type][locale]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="grid gap-1.5 text-xs font-medium">
              {t({ ar: "الاسم", en: "Name" })}
              <Input
                value={draft.name}
                onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name ? <span className="text-destructive">{errors.name}</span> : null}
            </label>

            <label className="grid gap-1.5 text-xs font-medium">
              {t({ ar: "صاحب الحساب", en: "Account holder" })}
              <Input
                value={draft.holder}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, holder: event.target.value }))}
                aria-invalid={Boolean(errors.holder)}
              />
              {errors.holder ? <span className="text-destructive">{errors.holder}</span> : null}
            </label>

            <label className="grid gap-1.5 text-xs font-medium">
              {t({ ar: "الآيبان أو آخر أربعة أرقام", en: "IBAN or last four digits" })}
              <Input
                value={draft.reference}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, reference: event.target.value }))}
                aria-invalid={Boolean(errors.reference)}
                dir="ltr"
              />
              {errors.reference ? (
                <span className="text-destructive">{errors.reference}</span>
              ) : null}
            </label>

            <label className="grid gap-1.5 text-xs font-medium">
              {t({ ar: "حالة الربط", en: "Connection status" })}
              <Select
                value={draft.status}
                onValueChange={(value) =>
                  setDraft((prev) => ({ ...prev, status: value as StripeConnectionStatus }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STRIPE_STATUS_LABELS) as StripeConnectionStatus[]).map((status) => (
                    <SelectItem key={status} value={status}>
                      {STRIPE_STATUS_LABELS[status][locale]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              {t({ ar: "إلغاء", en: "Cancel" })}
            </Button>
            <Button size="sm" onClick={save}>
              {editingId
                ? t({ ar: "حفظ التعديل", en: "Save changes" })
                : t({ ar: "إضافة المصدر", en: "Add source" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t({ ar: "حذف مصدر التمويل؟", en: "Delete this funding source?" })}
        description={
          deleteTarget
            ? t({
                ar: `سيُحذف ${deleteTarget.name[locale]} من قائمة مصادر التحويل.`,
                en: `${deleteTarget.name.en} will be removed from the payout routing list.`,
              })
            : ""
        }
        confirmLabel={t({ ar: "حذف", en: "Delete" })}
        cancelLabel={t({ ar: "إلغاء", en: "Cancel" })}
        onConfirm={() => {
          if (deleteTarget) {
            onChange(accounts.filter((account) => account.id !== deleteTarget.id));
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}