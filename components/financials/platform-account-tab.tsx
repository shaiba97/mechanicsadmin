"use client";

import * as React from "react";
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
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/hooks/use-locale";
import { api } from "@/lib/api";

type PlatformAccount = {
  id: string;
  bankName: string;
  accountHolderName: string;
  iban: string;
  swiftBic: string;
  madaMerchantId: string;
  acquirerApiKey: string;
  acquirerApiSecret: string;
  supportedCardSchemes: string[];
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

const CARD_SCHEMES: { id: string; label: { ar: string; en: string } }[] = [
  { id: "mada", label: { ar: "مدى", en: "Mada" } },
  { id: "stc_pay", label: { ar: "ستcıası", en: "STC Pay" } },
  { id: "visa", label: { ar: "فيزا", en: "Visa" } },
  { id: "mastercard", label: { ar: "ماستر كارد", en: "Mastercard" } },
  { id: "apple_pay", label: { ar: "أبل باي", en: "Apple Pay" } },
];

export function PlatformAccountTab() {
  const { t, locale } = useLocale();
  const [account, setAccount] = React.useState<PlatformAccount | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [draft, setDraft] = React.useState({
    bankName: "",
    accountHolderName: "",
    iban: "",
    swiftBic: "",
    madaMerchantId: "",
    acquirerApiKey: "",
    acquirerApiSecret: "",
    supportedCardSchemes: [] as string[],
    isVerified: false,
  });

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.get<PlatformAccount>(
          "/api/admin/financials/platform-account",
        );
        setAccount(data);
        setDraft({
          bankName: data.bankName,
          accountHolderName: data.accountHolderName,
          iban: data.iban,
          swiftBic: data.swiftBic,
          madaMerchantId: data.madaMerchantId,
          acquirerApiKey: "",
          acquirerApiSecret: "",
          supportedCardSchemes: data.supportedCardSchemes,
          isVerified: data.isVerified,
        });
      } catch {
        setAccount(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const maskValue = (value: string): string => {
    if (!value || value === "***redacted***") return "••••••••";
    if (value.length <= 4) return value;
    return `••••••••${value.slice(-4)}`;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/api/admin/financials/platform-account", {
        bankName: draft.bankName,
        accountHolderName: draft.accountHolderName,
        iban: draft.iban,
        swiftBic: draft.swiftBic,
        madaMerchantId: draft.madaMerchantId,
        acquirerApiKey: draft.acquirerApiKey || undefined,
        acquirerApiSecret: draft.acquirerApiSecret || undefined,
        supportedCardSchemes: draft.supportedCardSchemes,
        isVerified: draft.isVerified,
      });
      setDialogOpen(false);
      toast.add({
        title: t({ ar: "تم الحفظ", en: "Saved" }),
        description: t({
          ar: "تم تحديث بيانات المنصة بنجاح",
          en: "Platform account updated successfully",
        }),
      });
      // Reload to reflect changes
      const data = await api.get<PlatformAccount>(
        "/api/admin/financials/platform-account",
      );
      setAccount(data);
      setDraft((prev) => ({
        ...prev,
        acquirerApiKey: "",
        acquirerApiSecret: "",
      }));
    } catch {
      toast.add({
        title: t({ ar: "فشل الحفظ", en: "Save failed" }),
        type: "destructive",
      });
    } finally {
      setSaving(false);
    }
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

  if (!account) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <h2 className="text-sm font-semibold">
          {t({ ar: "إعدادات المنصة", en: "Platform Configuration" })}
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
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            {t({ ar: "إعدادات المنصة المالية", en: "Platform Financial Configuration" })}
          </h2>
          <Badge variant="outline" className={`gap-1 text-xs ${
            account.isVerified
              ? "border-green/40 bg-green/10 text-green"
              : "border-amber/40 bg-amber/10 text-amber"
          }`}>
            {account.isVerified
              ? t({ ar: "موثّق", en: "Verified" })
              : t({ ar: "غير موثّق", en: "Not Verified" })}
          </Badge>
        </div>
        <Table className="text-xs mt-4">
          <TableBody>
            <TableRow>
              <TableCell className="w-1/3 font-medium text-muted-foreground">
                {t({ ar: "اسم البنك", en: "Bank Name" })}
              </TableCell>
              <TableCell>{account.bankName || "—"}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-muted-foreground">
                {t({ ar: "صاحب الحساب", en: "Account Holder" })}
              </TableCell>
              <TableCell>{account.accountHolderName || "—"}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-muted-foreground">
                {t({ ar: "الآيبان (IBAN)", en: "IBAN" })}
              </TableCell>
              <TableCell className="font-mono whitespace-nowrap text-[11px]">
                {account.iban || "—"}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-muted-foreground">
                {t({ ar: "رمز SWIFT/BIC", en: "SWIFT/BIC" })}
              </TableCell>
              <TableCell className="font-mono whitespace-nowrap text-[11px]">
                {account.swiftBic || "—"}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-muted-foreground">
                {t({ ar: "تجّار مدى", en: "Mada Merchant ID" })}
              </TableCell>
              <TableCell className="font-mono whitespace-nowrap text-[11px]">
                {account.madaMerchantId || "—"}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-muted-foreground">
                {t({ ar: "مفتاح المُقتبس", en: "Acquirer API Key" })}
              </TableCell>
              <TableCell className="font-mono whitespace-nowrap text-[11px]">
                {maskValue(account.acquirerApiKey)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-muted-foreground">
                {t({ ar: "سرّ المُقتبس", en: "Acquirer API Secret" })}
              </TableCell>
              <TableCell className="font-mono whitespace-nowrap text-[11px]">
                {maskValue(account.acquirerApiSecret)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-muted-foreground">
                {t({ ar: "البطاقات المدعومة", en: "Supported Card Schemes" })}
              </TableCell>
              <TableCell className="whitespace-nowrap text-[11px] text-muted-foreground">
                {account.supportedCardSchemes
                  .map((s) => CARD_SCHEMES.find((c) => c.id === s)?.label[locale] || s)
                  .join(", ") || "—"}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setDialogOpen(true)}
        >
          {t({ ar: "تعديل البيانات", en: "Edit Configuration" })}
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t({ ar: "تعديل إعدادات المنصة", en: "Edit Platform Configuration" })}
            </DialogTitle>
            <DialogDescription>
              {t({
                ar: "قم بتحديث بيانات الحساب البنكي للمنصة وبيانات اعتماد بوابة الدفع",
                en: "Update platform bank account details and payment gateway credentials",
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">
                  {t({ ar: "اسم البنك", en: "Bank Name" })}
                </label>
                <Input
                  value={draft.bankName}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, bankName: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">
                  {t({ ar: "صاحب الحساب", en: "Account Holder" })}
                </label>
                <Input
                  value={draft.accountHolderName}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      accountHolderName: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">
                {t({ ar: "الآيبان (IBAN)", en: "IBAN" })}
              </label>
                <Input
                  value={draft.iban}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, iban: e.target.value }))
                  }
                  dir="ltr"
                />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">
                {t({ ar: "رمز SWIFT/BIC", en: "SWIFT/BIC" })}
              </label>
                <Input
                  value={draft.swiftBic}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, swiftBic: e.target.value }))
                  }
                  dir="ltr"
                />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">
                {t({ ar: "تجّار مدى", en: "Mada Merchant ID" })}
              </label>
                <Input
                  value={draft.madaMerchantId}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      madaMerchantId: e.target.value,
                    }))
                  }
                  dir="ltr"
                />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">
                {t({ ar: "مفتاح المُقتبس", en: "Acquirer API Key" })}
              </label>
                <Input
                  type={draft.acquirerApiKey ? "text" : "password"}
                  value={draft.acquirerApiKey}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, acquirerApiKey: e.target.value }))
                  }
                  dir="ltr"
                  placeholder={maskValue(account.acquirerApiKey)}
                />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">
                {t({ ar: "سرّ المُقتبس", en: "Acquirer API Secret" })}
              </label>
                <Input
                  type={draft.acquirerApiSecret ? "text" : "password"}
                  value={draft.acquirerApiSecret}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      acquirerApiSecret: e.target.value,
                    }))
                  }
                  dir="ltr"
                  placeholder={maskValue(account.acquirerApiSecret)}
                />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">
                {t({ ar: "البطاقات المدعومة", en: "Supported Card Schemes" })}
              </label>
              <Select
                multiple
                value={draft.supportedCardSchemes}
                onValueChange={(val) =>
                  setDraft((prev) => ({
                    ...prev,
                    supportedCardSchemes: val as string[],
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر البطاقات…" />
                </SelectTrigger>
                <SelectContent>
                  {CARD_SCHEMES.map((scheme) => (
                    <SelectItem key={scheme.id} value={scheme.id}>
                      {scheme.label[locale]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium">
                <input
                  type="checkbox"
                  checked={draft.isVerified}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, isVerified: e.target.checked }))
                  }
                />
                {t({ ar: "تم التحقق من البيانات", en: "Verified" })}
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              {t({ ar: "إلغاء", en: "Cancel" })}
            </Button>
            <Button size="sm" disabled={saving} onClick={handleSave}>
              {t({ ar: "حفظ التغييرات", en: "Save Changes" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
