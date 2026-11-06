"use client";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ConfirmDeleteDialog } from "@/components/financials/confirm-delete-dialog";
import { BilingualNameFields } from "@/components/catalog/bilingual-fields";
import { useLocale } from "@/hooks/use-locale";
import type { Brand } from "@/lib/catalog-store";
import {
  createBrand,
  deleteBrand,
  toErrorMessage,
  updateBrand,
} from "@/lib/catalog-store";

type Draft = { code: string; nameAr: string; nameEn: string; logoUrl: string };

const emptyDraft: Draft = { code: "", nameAr: "", nameEn: "", logoUrl: "" };

export function BrandsTable({ brands }: { brands: Brand[] }) {
  const { t, locale } = useLocale();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<Draft>(emptyDraft);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Brand | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (brand: Brand) => {
    setEditingId(brand.id);
    setDraft({
      code: brand.code,
      nameAr: brand.name.ar,
      nameEn: brand.name.en,
      logoUrl: brand.logoUrl,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const save = async () => {
    if (saving) return;
    const next: Record<string, string> = {};
    if (draft.code.trim().length < 2) {
      next.code = t({ ar: "أدخل رمز العلامة", en: "Enter brand code" });
    }
    if (draft.nameAr.trim().length < 2) {
      next.nameAr = t({ ar: "أدخل الاسم بالعربية", en: "Enter Arabic name" });
    }
    if (draft.nameEn.trim().length < 2) {
      next.nameEn = t({ ar: "أدخل الاسم بالإنجليزية", en: "Enter English name" });
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload = {
      code: draft.code.trim().toUpperCase(),
      name: { ar: draft.nameAr.trim(), en: draft.nameEn.trim() },
      logoUrl: draft.logoUrl.trim(),
    };

    setSaving(true);
    try {
      if (editingId) {
        const existing = brands.find((brand) => brand.id === editingId);
        await updateBrand(editingId, {
          ...payload,
          active: existing ? existing.active : true,
        });
      } else {
        await createBrand({ ...payload, active: true });
      }
      setDialogOpen(false);
    } catch (error) {
      setErrors({ form: toErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await deleteBrand(target.id);
    } catch (error) {
      setErrors({ form: toErrorMessage(error) });
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-semibold">
          {t({ ar: "العلامات التجارية", en: "Brands" })}
        </h2>
        <Badge variant="outline" className="font-mono text-xs">
          {brands.length}
        </Badge>
        <div className="ms-auto">
          <Button size="sm" className="h-7 gap-1 text-xs" onClick={openCreate}>
            <Plus className="size-3" strokeWidth={2.5} aria-hidden="true" />
            {t({ ar: "إضافة علامة", en: "Add brand" })}
          </Button>
        </div>
      </div>

      {!dialogOpen && errors.form ? (
        <p className="text-xs text-destructive">{errors.form}</p>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t({ ar: "الشعار", en: "Logo" })}</TableHead>
            <TableHead>{t({ ar: "الرمز", en: "Code" })}</TableHead>
            <TableHead>{t({ ar: "الاسم بالعربية", en: "Arabic Name" })}</TableHead>
            <TableHead>{t({ ar: "الاسم بالإنجليزية", en: "English Name" })}</TableHead>
            <TableHead>{t({ ar: "الحالة", en: "Status" })}</TableHead>
            <TableHead className="text-end">{t({ ar: "إجراءات", en: "Actions" })}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {brands.map((brand) => (
            <TableRow key={brand.id}>
              <TableCell>
                {brand.logoUrl ? (
                  <img
                    src={brand.logoUrl}
                    alt={brand.name[locale]}
                    className="size-7 rounded-md object-contain"
                  />
                ) : (
                  <span className="flex size-7 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                    {brand.name.en.charAt(0)}
                  </span>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap font-mono text-xs">
                {brand.code}
              </TableCell>
              <TableCell className="text-sm">{brand.name.ar}</TableCell>
              <TableCell className="text-sm" dir="ltr">
                {brand.name.en}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    brand.active
                      ? "border-primary/40 bg-primary/10 text-xs text-primary"
                      : "border-border bg-muted text-xs text-muted-foreground"
                  }
                >
                  {brand.active
                    ? t({ ar: "نشط", en: "Active" })
                    : t({ ar: "معطّل", en: "Inactive" })}
                </Badge>
              </TableCell>
              <TableCell className="text-end">
                <div className="flex justify-end gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    onClick={() => openEdit(brand)}
                    aria-label={t({ ar: "تعديل العلامة", en: "Edit brand" })}
                  >
                    <Pencil className="size-3.5" strokeWidth={2} aria-hidden="true" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    onClick={() => {
                      setErrors({});
                      setDeleteTarget(brand);
                    }}
                    aria-label={t({ ar: "حذف العلامة", en: "Delete brand" })}
                  >
                    <Trash2 className="size-3.5" strokeWidth={2} aria-hidden="true" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? t({ ar: "تعديل العلامة التجارية", en: "Edit brand" })
                : t({ ar: "إضافة علامة تجارية", en: "Add brand" })}
            </DialogTitle>
            <DialogDescription>
              {t({
                ar: "العلامات التجارية تُستخدم لربط السيارات وقطع الغيار",
                en: "Brands are linked to cars and spare parts",
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <label className="grid gap-1.5 text-xs font-medium">
              {t({ ar: "الشعار (رابط الصورة)", en: "Logo (image URL)" })}
              <Input
                type="url"
                value={draft.logoUrl}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, logoUrl: event.target.value }))
                }
                placeholder={t({
                  ar: "https://example.com/logo.png",
                  en: "https://example.com/logo.png",
                })}
                dir="ltr"
              />
            </label>
            <label className="grid gap-1.5 text-xs font-medium">
              {t({ ar: "رمز العلامة", en: "Brand code" })}
              <Input
                value={draft.code}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, code: event.target.value }))
                }
                placeholder={t({ ar: "TOYOTA", en: "TOYOTA" })}
                dir="ltr"
                aria-invalid={Boolean(errors.code)}
              />
              {errors.code ? <span className="text-destructive">{errors.code}</span> : null}
            </label>
            <BilingualNameFields
              arLabel={t({ ar: "الاسم بالعربية", en: "Arabic Name" })}
              enLabel={t({ ar: "الاسم بالإنجليزية", en: "English Name" })}
              arValue={draft.nameAr}
              enValue={draft.nameEn}
              onArChange={(value) => setDraft((prev) => ({ ...prev, nameAr: value }))}
              onEnChange={(value) => setDraft((prev) => ({ ...prev, nameEn: value }))}
              arError={errors.nameAr}
              enError={errors.nameEn}
            />
            {errors.form ? (
              <p className="text-xs text-destructive">{errors.form}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              {t({ ar: "إلغاء", en: "Cancel" })}
            </Button>
            <Button size="sm" onClick={() => void save()} disabled={saving}>
              {editingId
                ? t({ ar: "حفظ التعديل", en: "Save changes" })
                : t({ ar: "إضافة العلامة", en: "Add brand" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t({ ar: "حذف العلامة التجارية؟", en: "Delete brand?" })}
        description={
          deleteTarget
            ? t({
                ar: `سيتم حذف ${deleteTarget.name.ar} نهائياً.`,
                en: `"${deleteTarget.name.en}" will be permanently deleted.`,
              })
            : ""
        }
        confirmLabel={t({ ar: "حذف", en: "Delete" })}
        cancelLabel={t({ ar: "إلغاء", en: "Cancel" })}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
