"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLocale } from "@/hooks/use-locale";
import { api } from "@/lib/api";
import { formatDateTime, formatNumber, formatPhone, formatSarExact } from "@/lib/format";
import { ksaCityName } from "@/lib/ksa";
import { toast } from "@/components/ui/toast";

type CustomerStatus = "active" | "suspended";

type Customer = {
  id: string;
  name: { ar: string; en: string };
  phone: string;
  region: string;
  ordersCount: number;
  lifetimeGmvSar: number;
  lastOrderAt: string;
  createdAt: string;
  isActive: boolean;
  status: CustomerStatus;
};

const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, { ar: string; en: string }> = {
  active: { ar: "نشيط", en: "Active" },
  suspended: { ar: "موقوف", en: "Suspended" },
};

export default function CustomersPage() {
  const { t, locale } = useLocale();
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [suspendTarget, setSuspendTarget] = React.useState<{ id: string; active: boolean } | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.get<Customer[]>("/api/admin/customers");
        setCustomers(data);
      } catch {
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleStatus = async (id: string, active: boolean) => {
    try {
      await api.patch(`/api/admin/customers/${id}/status`, {
        status: active ? "active" : "suspended",
      });
      setCustomers((current) =>
        current.map((c) =>
          c.id === id ? { ...c, isActive: active, status: active ? "active" : "suspended" } : c,
        ),
      );
    } catch {
      toast.add({
        title: t({ ar: "فشل تحديث الحالة", en: "Failed to update status" }),
        type: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/admin/customers/${deleteTarget}`);
      setCustomers((current) => current.filter((c) => c.id !== deleteTarget));
    } catch {
      toast.add({
        title: t({ ar: "فشل الحذف", en: "Failed to delete" }),
        type: "destructive",
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <Card>
      <CardHeader>
        <CardTitle>{t({ ar: "العملاء", en: "Customers" })}</CardTitle>
        <CardDescription>
          {t({
            ar: "أعلى العملاء إنفاقاً عبر مناطق المملكة",
            en: "Top customers by spend across KSA regions",
          })}
        </CardDescription>
      </CardHeader>
      {loading ? (
        <CardContent className="flex items-center justify-center py-10">
          <span className="text-xs text-muted-foreground">
            {t({ ar: "جارٍ التحميل…", en: "Loading…" })}
          </span>
        </CardContent>
      ) : (
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t({ ar: "العميل", en: "Customer" })}</TableHead>
                <TableHead className="text-center">{t({ ar: "الجوال", en: "Phone" })}</TableHead>
                <TableHead>{t({ ar: "المنطقة", en: "Region" })}</TableHead>
                <TableHead className="text-end">{t({ ar: "الطلبات", en: "Orders" })}</TableHead>
                <TableHead className="text-end">{t({ ar: "إجمالي الإنفاق", en: "Lifetime GMV" })}</TableHead>
                <TableHead>{t({ ar: "آخر طلب", en: "Last order" })}</TableHead>
                <TableHead className="text-center">{t({ ar: "الحالة", en: "Status" })}</TableHead>
                <TableHead className="text-end">{t({ ar: "إجراءات", en: "Actions" })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="text-sm font-medium">
                    {customer.name[locale]}
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap font-mono text-xs text-muted-foreground">
                    {formatPhone(customer.phone) || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {ksaCityName(customer.region, locale)}
                  </TableCell>
                  <TableCell className="text-end font-mono text-xs">
                    {formatNumber(customer.ordersCount)}
                  </TableCell>
                  <TableCell className="text-end font-mono text-xs">
                    {formatSarExact(customer.lifetimeGmvSar, locale)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {customer.lastOrderAt ? formatDateTime(customer.lastOrderAt) : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={`gap-1 text-xs ${customer.status === "active" ? "border-green/40 bg-green/10 text-green" : "border-amber/40 bg-amber/10 text-amber"}`}
                    >
                      {CUSTOMER_STATUS_LABELS[customer.status]?.[locale] ?? customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 text-xs"
                        onClick={() =>
                          setSuspendTarget({ id: customer.id, active: !customer.isActive })
                        }
                      >
                        {customer.isActive ? (
                          <>
                            <span className="text-xs">{t({ ar: "إيقاف", en: "Suspend" })}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-xs">{t({ ar: "تفعيل", en: "Activate" })}</span>
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 gap-1 text-xs"
                        onClick={() => setDeleteTarget(customer.id)}
                      >
                        <span className="text-xs">{t({ ar: "حذف", en: "Delete" })}</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {customers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    {t({ ar: "لا توجد عملاء", en: "No customers found" })}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>

    <AlertDialog
      open={suspendTarget !== null}
      onOpenChange={(open) => {
        if (!open) setSuspendTarget(null);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {suspendTarget?.active
              ? t({ ar: "تفعيل العميل؟", en: "Activate customer?" })
              : t({ ar: "إيقاف العميل؟", en: "Suspend customer?" })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {suspendTarget?.active
              ? t({
                  ar: "سيتم تفعيل هذا العميل وتمكينه من إجراء الطلبات.",
                  en: "This customer will be activated and can place orders.",
                })
              : t({
                  ar: "سيتم إيقاف هذا العميل عن استخدام المنصة مؤقتاً.",
                  en: "This customer will be temporarily suspended from using the platform.",
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
                toggleStatus(suspendTarget.id, suspendTarget.active);
              }
              setSuspendTarget(null);
            }}
          >
            {suspendTarget?.active
              ? t({ ar: "تأكيد التفعيل", en: "Confirm activation" })
              : t({ ar: "تأكيد الإيقاف", en: "Confirm suspension" })}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog
      open={deleteTarget !== null}
      onOpenChange={(open) => {
        if (!open) setDeleteTarget(null);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t({ ar: "حذف العميل؟", en: "Delete customer?" })}</AlertDialogTitle>
          <AlertDialogDescription>
            {t({
              ar: "سيتم حذف هذا العميل وبياناته نهائياً ولا يمكن التراجع.",
              en: "This customer and their data will be permanently deleted and cannot be undone.",
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            {t({ ar: "إلغاء", en: "Cancel" })}
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            {t({ ar: "تأكيد الحذف", en: "Confirm delete" })}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
