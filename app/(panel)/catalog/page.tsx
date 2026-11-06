"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  FolderNav,
  type CatalogFolderId,
} from "@/components/catalog/folder-nav";
import { BrandsTable } from "@/components/catalog/brands";
import { CarsTable } from "@/components/catalog/cars";
import { CategoriesTable } from "@/components/catalog/categories";
import { useCatalog } from "@/hooks/use-catalog";
import { useLocale } from "@/hooks/use-locale";
import {
  getFolderServerSnapshot,
  getFolderSnapshot,
  setFolder,
  subscribeFolder,
} from "@/lib/catalog-folder";
import { reloadCatalog } from "@/lib/catalog-store";

export default function CatalogPage() {
  const { t } = useLocale();
  const catalog = useCatalog();
  const folder = React.useSyncExternalStore(
    subscribeFolder,
    getFolderSnapshot,
    getFolderServerSnapshot,
  );

  const loadingLabels: Record<CatalogFolderId, { ar: string; en: string }> = {
    brands: { ar: "جارٍ تحميل العلامات...", en: "Loading brands..." },
    cars: { ar: "جارٍ تحميل السيارات...", en: "Loading cars..." },
    categories: { ar: "جارٍ تحميل الأقسام...", en: "Loading categories..." },
  };

  const renderFolder = () => {
    if (catalog.status === "ready") {
      return (
        <>
          <div className="flex items-center justify-end gap-1.5">
            <span
              className={`size-1.5 rounded-full ${
                catalog.connection === "connected"
                  ? "bg-primary"
                  : "bg-muted-foreground"
              }`}
              aria-hidden="true"
            />
            <span className="text-xs text-muted-foreground">
              {catalog.connection === "connected"
                ? t({ ar: "مباشر", en: "Live" })
                : t({ ar: "جارٍ الاتصال", en: "Connecting" })}
            </span>
          </div>

          {folder === "brands" ? <BrandsTable brands={catalog.brands} /> : null}
          {folder === "cars" ? (
            <CarsTable cars={catalog.cars} brands={catalog.brands} />
          ) : null}
          {folder === "categories" ? (
            <CategoriesTable categories={catalog.categories} />
          ) : null}
        </>
      );
    }
    if (catalog.status === "error") {
      return (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-destructive">{catalog.error}</p>
          <Button variant="outline" size="sm" onClick={() => void reloadCatalog()}>
            {t({ ar: "إعادة المحاولة", en: "Retry" })}
          </Button>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
        <Spinner className="size-4" />
        <span className="text-sm">{t(loadingLabels[folder])}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start">
      <FolderNav
        active={folder}
        counts={{
          brands: catalog.brands.length,
          cars: catalog.cars.length,
          categories: catalog.categories.length,
        }}
        onSelect={setFolder}
      />

      <Card className="min-w-0 flex-1 py-4">
        <CardContent className="flex flex-col gap-4">
          {renderFolder()}
        </CardContent>
      </Card>
    </div>
  );
}
