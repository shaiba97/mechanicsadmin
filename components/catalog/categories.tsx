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
import { ConfirmDeleteDialog } from "@/components/financials/confirm-delete-dialog";
import { BilingualNameFields } from "@/components/catalog/bilingual-fields";
import { useLocale } from "@/hooks/use-locale";
import type { Category } from "@/lib/catalog-store";
import {
  createCategory,
  deleteCategory,
  toErrorMessage,
  updateCategory,
} from "@/lib/catalog-store";

type Draft = { nameAr: string; nameEn: string };

const emptyDraft: Draft = { nameAr: "", nameEn: "" };

export function CategoriesTable({
  categories,
}: {
  categories: Category[];
}) {
  const { t } = useLocale();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<Draft>(emptyDraft);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Category | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditingId(category.id);
    setDraft({ nameAr: category.name.ar, nameEn: category.name.en });
    setErrors({});
    setDialogOpen(true);
  };

  const save = async () => {
    if (saving) return;
    const next: Record<string, string> = {};
    if (draft.nameAr.trim().length < 2) {
      next.nameAr = t({ ar: "أدخل الاسم بالعربية", en: "Enter Arabic name" });
    }
    if (draft.nameEn.trim().length < 2) {
      next.nameEn = t({ ar: "أدخل الاسم بالإنجليزية", en: "Enter English name" });
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload = {
      name: { ar: draft.nameAr.trim(), en: draft.nameEn.trim() },
    };

    setSaving(true);
    try {
      if (editingId) {
        const existing = categories.find((category) => category.id === editingId);
        await updateCategory(editingId, {
          ...payload,
          active: existing ? existing.active : true,
        });
      } else {
        await createCategory({ ...payload, active: true });
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
      await deleteCategory(target.id);
    } catch (error) {
      setErrors({ form: toErrorMessage(error) });
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-semibold">
          {t({ ar: "الأقسام", en: "Categories" })}
        </h2>
        <Badge variant="outline" className="font-mono text-xs">
          {categories.length}
        </Badge>
        <div className="ms-auto">
          <Button size="sm" className="h-7 gap-1 text-xs" onClick={openCreate}>
            <Plus className="size-3" strokeWidth={2.5} aria-hidden="true" />
            {t({ ar: "إضافة قسم", en: "Add category" })}
          </Button>
        </div>
      </div>

      {!dialogOpen && errors.form ? (
        <p className="text-xs text-destructive">{errors.form}</p>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t({ ar: "القسم بالعربية", en: "Category (Arabic)" })}</TableHead>
            <TableHead>{t({ ar: "القسم بالإنجليزية", en: "Category (English)" })}</TableHead>
            <TableHead>{t({ ar: "الحالة", en: "Status" })}</TableHead>
            <TableHead className="text-end">{t({ ar: "إجراءات", en: "Actions" })}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell className="text-sm font-medium">{category.name.ar}</TableCell>
              <TableCell className="text-sm" dir="ltr">
                {category.name.en}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    category.active
                      ? "border-primary/40 bg-primary/10 text-xs text-primary"
                      : "border-border bg-muted text-xs text-muted-foreground"
                  }
                >
                  {category.active
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
                    onClick={() => openEdit(category)}
                    aria-label={t({ ar: "تعديل القسم", en: "Edit category" })}
                  >
                    <Pencil className="size-3.5" strokeWidth={2} aria-hidden="true" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    onClick={() => {
                      setErrors({});
                      setDeleteTarget(category);
                    }}
                    aria-label={t({ ar: "حذف القسم", en: "Delete category" })}
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
                ? t({ ar: "تعديل القسم", en: "Edit category" })
                : t({ ar: "إضافة قسم", en: "Add category" })}
            </DialogTitle>
            <DialogDescription>
              {t({
                ar: "الأقسام تُستخدم لتنظيم قطع الغيار في الكتالوج",
                en: "Categories organize spare parts in the catalog",
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <BilingualNameFields
              arLabel={t({ ar: "اسم القسم بالعربية", en: "Category Arabic Name" })}
              enLabel={t({ ar: "اسم القسم بالإنجليزية", en: "Category English Name" })}
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
                : t({ ar: "إضافة القسم", en: "Add category" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t({ ar: "حذف القسم؟", en: "Delete category?" })}
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
