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
import { Input } from "@/components/ui/input";
import { ConfirmDeleteDialog } from "@/components/financials/confirm-delete-dialog";
import { BilingualNameFields } from "@/components/catalog/bilingual-fields";
import { useLocale } from "@/hooks/use-locale";
import type { Brand, Car } from "@/lib/catalog-store";
import {
  createCar,
  deleteCar,
  toErrorMessage,
  updateCar,
} from "@/lib/catalog-store";

type Draft = { modelAr: string; modelEn: string; year: string; brandId: string };

const emptyDraft: Draft = { modelAr: "", modelEn: "", year: "", brandId: "" };

export function CarsTable({
  cars,
  brands,
}: {
  cars: Car[];
  brands: Brand[];
}) {
  const { t, locale } = useLocale();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<Draft>(emptyDraft);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Car | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (car: Car) => {
    setEditingId(car.id);
    setDraft({
      modelAr: car.model.ar,
      modelEn: car.model.en,
      year: String(car.year),
      brandId: car.brandId,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const save = async () => {
    if (saving) return;
    const next: Record<string, string> = {};
    const yearNum = Number(draft.year);
    if (draft.modelAr.trim().length < 2) {
      next.modelAr = t({ ar: "أدخل اسم الموديل بالعربية", en: "Enter Arabic model name" });
    }
    if (draft.modelEn.trim().length < 2) {
      next.modelEn = t({ ar: "أدخل اسم الموديل بالإنجليزية", en: "Enter English model name" });
    }
    if (!Number.isInteger(yearNum) || yearNum < 1980 || yearNum > 2030) {
      next.year = t({ ar: "سنة الصنع بين 1980 و 2030", en: "Year between 1980 and 2030" });
    }
    if (!draft.brandId) {
      next.brandId = t({ ar: "اختر العلامة التجارية", en: "Select a brand" });
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload = {
      model: { ar: draft.modelAr.trim(), en: draft.modelEn.trim() },
      year: yearNum,
      brandId: draft.brandId,
    };

    setSaving(true);
    try {
      if (editingId) {
        const existing = cars.find((car) => car.id === editingId);
        await updateCar(editingId, {
          ...payload,
          active: existing ? existing.active : true,
        });
      } else {
        await createCar({ ...payload, active: true });
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
      await deleteCar(target.id);
    } catch (error) {
      setErrors({ form: toErrorMessage(error) });
    }
  };

  const brandName = (brandId: string) =>
    brands.find((brand) => brand.id === brandId)?.name[locale] ?? "—";

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-semibold">
          {t({ ar: "السيارات", en: "Cars" })}
        </h2>
        <Badge variant="outline" className="font-mono text-xs">
          {cars.length}
        </Badge>
        <div className="ms-auto">
          <Button size="sm" className="h-7 gap-1 text-xs" onClick={openCreate}>
            <Plus className="size-3" strokeWidth={2.5} aria-hidden="true" />
            {t({ ar: "إضافة سيارة", en: "Add car" })}
          </Button>
        </div>
      </div>

      {!dialogOpen && errors.form ? (
        <p className="text-xs text-destructive">{errors.form}</p>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t({ ar: "الموديل بالعربية", en: "Model (Arabic)" })}</TableHead>
            <TableHead>{t({ ar: "الموديل بالإنجليزية", en: "Model (English)" })}</TableHead>
            <TableHead>{t({ ar: "سنة الصنع", en: "Year" })}</TableHead>
            <TableHead>{t({ ar: "العلامة التجارية", en: "Brand" })}</TableHead>
            <TableHead>{t({ ar: "الحالة", en: "Status" })}</TableHead>
            <TableHead className="text-end">{t({ ar: "إجراءات", en: "Actions" })}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cars.map((car) => (
            <TableRow key={car.id}>
              <TableCell className="text-sm">{car.model.ar}</TableCell>
              <TableCell className="text-sm" dir="ltr">
                {car.model.en}
              </TableCell>
              <TableCell className="font-mono text-xs">{car.year}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {brandName(car.brandId)}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    car.active
                      ? "border-primary/40 bg-primary/10 text-xs text-primary"
                      : "border-border bg-muted text-xs text-muted-foreground"
                  }
                >
                  {car.active
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
                    onClick={() => openEdit(car)}
                    aria-label={t({ ar: "تعديل السيارة", en: "Edit car" })}
                  >
                    <Pencil className="size-3.5" strokeWidth={2} aria-hidden="true" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    onClick={() => {
                      setErrors({});
                      setDeleteTarget(car);
                    }}
                    aria-label={t({ ar: "حذف السيارة", en: "Delete car" })}
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
                ? t({ ar: "تعديل السيارة", en: "Edit car" })
                : t({ ar: "إضافة سيارة", en: "Add car" })}
            </DialogTitle>
            <DialogDescription>
              {t({
                ar: "اختر الموديل والعلامة التجارية وسنة الصنع",
                en: "Set the model, brand, and manufacturing year",
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <BilingualNameFields
              arLabel={t({ ar: "اسم الموديل بالعربية", en: "Model Arabic Name" })}
              enLabel={t({ ar: "اسم الموديل بالإنجليزية", en: "Model English Name" })}
              arValue={draft.modelAr}
              enValue={draft.modelEn}
              onArChange={(value) => setDraft((prev) => ({ ...prev, modelAr: value }))}
              onEnChange={(value) => setDraft((prev) => ({ ...prev, modelEn: value }))}
              arError={errors.modelAr}
              enError={errors.modelEn}
            />

            <label className="grid gap-1.5 text-xs font-medium">
              {t({ ar: "سنة الصنع", en: "Manufacturing Year" })}
              <Input
                type="number"
                min={1980}
                max={2030}
                value={draft.year}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, year: event.target.value }))
                }
                placeholder={t({ ar: "2024", en: "2024" })}
                dir="ltr"
                aria-invalid={Boolean(errors.year)}
              />
              {errors.year ? <span className="text-destructive">{errors.year}</span> : null}
            </label>

            <label className="grid gap-1.5 text-xs font-medium">
              {t({ ar: "العلامة التجارية", en: "Brand" })}
              <Select
                value={draft.brandId}
                onValueChange={(value) =>
                  setDraft((prev) => ({ ...prev, brandId: value ?? "" }))
                }
              >
                <SelectTrigger className="w-full" aria-invalid={Boolean(errors.brandId)}>
                  <SelectValue
                    placeholder={t({ ar: "اختر العلامة", en: "Select brand" })}
                  />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name[locale]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.brandId ? (
                <span className="text-destructive">{errors.brandId}</span>
              ) : null}
            </label>

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
                : t({ ar: "إضافة السيارة", en: "Add car" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t({ ar: "حذف السيارة؟", en: "Delete car?" })}
        description={
          deleteTarget
            ? t({
                ar: `سيتم حذف ${deleteTarget.model.ar} نهائياً.`,
                en: `"${deleteTarget.model.en}" will be permanently deleted.`,
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
