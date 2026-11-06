"use client";

import * as React from "react";
import Link from "next/link";
import { Ban, Check, Download, Loader, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { formatNumber, formatSarExact } from "@/lib/format";

export type StoreDetail = {
  id: string;
  code: string;
  name: string;
  crNumber: string;
  status: string;
  city: string;
  ordersCount: number;
  createdAt: string;
  members: Array<{ id: string; email: string; fullName: string; role: string }>;
  documents: Array<{
    id: string;
    docType: string;
    fileName: string;
    contentType: string;
    status: string;
    uploadedAt: string;
    verifiedAt: string | null;
  }>;
  counts: {
    ordersCount: number;
    completedOrders: number;
    activeOrders: number;
    salesSar: number;
  };
};

const STORE_STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  pending_approval: { ar: "بانتظار اعتماد السجل", en: "Pending CR Approval" },
  verified: { ar: "موثّق", en: "Verified" },
  suspended: { ar: "موقوف", en: "Suspended" },
};

const DOC_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  cr: { ar: "السجل التجاري", en: "Commercial Registration" },
  vat: { ar: "شهادة ضريبة القيمة المضافة", en: "VAT Certificate" },
  iqama: { ar: "بطاقة هوية / إقامة المالك", en: "Owner National ID / Iqama" },
};

const statusIcon: Record<string, React.ReactNode> = {
  verified: <Check className="size-3" aria-hidden="true" />,
  pending_approval: null,
  suspended: <Ban className="size-3" aria-hidden="true" />,
};

export function StoreDetailsContent({ detail }: { detail: StoreDetail }) {
  const { t, locale } = useLocale();
  const [suspendTarget, setSuspendTarget] = React.useState<string | null>(null);
  const [docViewUrl, setDocViewUrl] = React.useState<string | null>(null);
  const [docViewName, setDocViewName] = React.useState("");
  const [docViewOpen, setDocViewOpen] = React.useState(false);
  const [docViewLoading, setDocViewLoading] = React.useState(false);

  const applyStatus = async (status: string) => {
    try {
      await fetch(`/api/admin/stores/${detail.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setSuspendTarget(null);
      window.location.reload();
    } catch {
      toast.add({
        title: t({ ar: "فشل تحديث الحالة", en: "Failed to update status" }),
        type: "destructive",
      });
    }
  };

  const viewDocument = async (docId: string, fileName: string) => {
    setDocViewLoading(true);
    setDocViewName(fileName);
    setDocViewOpen(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/admin/documents/${docId}/view`);
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDocViewUrl(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err ?? "");
      setDocViewUrl(null);
      toast.add({
        title: t({ ar: "خطأ", en: "Error" }),
        description: message || t({ ar: "فشل تحميل المستند", en: "Failed to load document" }),
        type: "error",
      });
    } finally {
      setDocViewLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/stores" className="text-xs text-muted-foreground hover:text-foreground">
            ← {t({ ar: "العودة إلى قائمة المتاجر", en: "Back to stores list" })}
          </Link>
          <h1 className="text-sm font-semibold">
            {detail.name}
          </h1>
        </div>
        <Badge variant="outline" className={`gap-1 text-xs ${detail.status === "verified" ? "border-green/40 bg-green/10 text-green" : detail.status === "suspended" ? "border-amber/40 bg-amber/10 text-amber" : "border-border bg-muted text-foreground"}`}>
          {statusIcon[detail.status]}
          {STORE_STATUS_LABELS[detail.status]?.[locale] ?? detail.status}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              {t({ ar: "اسم المتجر", en: "Store Name" })}
            </span>
            <span className="text-sm font-medium">{detail.name}</span>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              {t({ ar: "رمز المتجر", en: "Store Code" })}
            </span>
            <span className="text-sm font-mono">{detail.code}</span>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              {t({ ar: "السجل التجاري", en: "CR Number" })}
            </span>
            <span className="text-sm font-mono">{detail.crNumber || "—"}</span>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              {t({ ar: "المدينة", en: "City" })}
            </span>
            <span className="text-sm">{detail.city || "—"}</span>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              {t({ ar: "تاريخ الإنشاء", en: "Created At" })}
            </span>
            <span className="text-sm font-mono">
              {new Date(detail.createdAt).toLocaleDateString(locale)}
            </span>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              {t({ ar: "إجمالي الطلبات", en: "Total Orders" })}
            </span>
            <span className="text-sm font-mono">
              {formatNumber(detail.counts.ordersCount)}
            </span>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              {t({ ar: "مبيعات مكتملة", en: "Completed Sales" })}
            </span>
            <span className="text-sm font-mono text-foreground">
              {formatSarExact(detail.counts.salesSar, locale)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">
              {t({ ar: "أعضاء المتجر", en: "Store Members" })}
            </h2>
            <Badge variant="outline" className="font-mono text-xs">
              {detail.members.length}
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <Table className="text-xs min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>{t({ ar: "البريد الإلكتروني", en: "Email" })}</TableHead>
                  <TableHead>{t({ ar: "الاسم الكامل", en: "Full Name" })}</TableHead>
                  <TableHead>{t({ ar: "الدور", en: "Role" })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.members.length > 0 ? (
                  detail.members.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.email}</TableCell>
                      <TableCell>{m.fullName}</TableCell>
                      <TableCell className="text-muted-foreground">{m.role}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                      {t({ ar: "لا يوجد أعضاء", en: "No members" })}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">
              {t({ ar: "المستندات للمراجعة", en: "Documents for Review" })}
            </h2>
            <Badge variant="outline" className="font-mono text-xs">
              {detail.documents.length}
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <Table className="text-xs min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>{t({ ar: "نوع المستند", en: "Document Type" })}</TableHead>
                  <TableHead>{t({ ar: "الحالة", en: "Status" })}</TableHead>
                  <TableHead>{t({ ar: "تاريخ الرفع", en: "Uploaded" })}</TableHead>
                  <TableHead className="text-end">{t({ ar: "إجراء", en: "Action" })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.documents.length > 0 ? (
                  detail.documents.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="text-muted-foreground">
                        {DOC_TYPE_LABELS[d.docType]?.[locale] ?? d.docType}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {d.status === "verified"
                            ? t({ ar: "معتمد", en: "Verified" })
                            : d.status === "rejected"
                              ? t({ ar: "مرفوض", en: "Rejected" })
                              : t({ ar: "تم الرفع", en: "Uploaded" })}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(d.uploadedAt).toLocaleDateString(locale)}
                      </TableCell>
                      <TableCell className="text-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs"
                          onClick={() => viewDocument(d.id, d.fileName)}
                        >
                          <Download className="size-3" strokeWidth={2} aria-hidden="true" />
                          {t({ ar: "عرض", en: "View" })}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                      {t({ ar: "لا توجد مستندات", en: "No documents" })}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h2 className="text-sm font-semibold mb-3">
            {t({ ar: "إجراءات الإدارة", en: "Admin Actions" })}
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            {detail.status === "pending_approval" && (
              <Button
                size="sm"
                variant="default"
                className="w-full sm:w-auto"
                onClick={() => applyStatus("verified")}
              >
                <Check className="size-3.5" aria-hidden="true" />
                {t({ ar: "اعتماد المتجر", en: "Approve Store" })}
              </Button>
            )}
            {detail.status === "verified" && (
              <Button
                size="sm"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setSuspendTarget(detail.id)}
              >
                <Ban className="size-3.5" aria-hidden="true" />
                {t({ ar: "إيقاف المتجر", en: "Suspend Store" })}
              </Button>
            )}
            {detail.status === "suspended" && (
              <Button
                size="sm"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => applyStatus("verified")}
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                {t({ ar: "استعادة المتجر", en: "Restore Store" })}
              </Button>
            )}
          </div>
        </div>
      </div>

      <AlertDialog
        open={suspendTarget !== null}
        onOpenChange={(open) => {
          if (!open) setSuspendTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t({ ar: "إيقاف المتجر؟", en: "Suspend store?" })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t({
                ar: "سيتم إيقاف هذا المتجر عن استقبال الطلبات فوراً.",
                en: "This store will be suspended from receiving orders immediately.",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setSuspendTarget(null)}>
              {t({ ar: "إلغاء", en: "Cancel" })}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (suspendTarget) {
                  applyStatus("suspended");
                }
                setSuspendTarget(null);
              }}
            >
              {t({ ar: "تأكيد الإيقاف", en: "Confirm suspension" })}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={docViewOpen} onOpenChange={setDocViewOpen}>
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader>
            <DialogTitle>{docViewName}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col h-[600px] w-full">
            {docViewLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader className="size-6 animate-spin" />
              </div>
            ) : docViewUrl ? (
              <div className="relative w-full h-full">
                {(() => {
                  const name = docViewName || "";
                  if (name.toLowerCase().endsWith(".pdf")) {
                    return (
                      <iframe src={docViewUrl} className="w-full h-full border-0" title={name} />
                    );
                  }
                  if (name.toLowerCase().match(/\.(png|jpe?g|gif|webp|bmp|svg)$/)) {
                    return (
                      <img src={docViewUrl} alt={name} className="w-full h-full object-contain" />
                    );
                  }
                  return (
                    <embed src={docViewUrl} type="" className="w-full h-full border-0" />
                  );
                })()}
                <div className="absolute top-2 right-2 z-10">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = docViewUrl;
                      link.download = docViewName || "document";
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    <Download className="size-3.5" strokeWidth={2} aria-hidden="true" />
                    {t({ ar: "تحميل", en: "Download" })}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                {t({ ar: "تعذر عرض المستند", en: "Unable to display document" })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDocViewOpen(false)}>
              {t({ ar: "إغلاق", en: "Close" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
