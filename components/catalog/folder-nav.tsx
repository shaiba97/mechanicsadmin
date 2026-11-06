"use client";

import * as React from "react";
import { Building2, Car, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/use-locale";

export type CatalogFolderId = "brands" | "cars" | "categories";

type FolderDef = {
  id: CatalogFolderId;
  icon: React.ElementType;
  name: { ar: string; en: string };
};

const FOLDERS: FolderDef[] = [
  {
    id: "brands",
    icon: Building2,
    name: { ar: "العلامات التجارية", en: "Brands" },
  },
  {
    id: "cars",
    icon: Car,
    name: { ar: "السيارات", en: "Cars" },
  },
  {
    id: "categories",
    icon: Layers,
    name: { ar: "الأقسام", en: "Categories" },
  },
];

export function FolderNav({
  active,
  counts,
  onSelect,
}: {
  active: CatalogFolderId;
  counts: Record<CatalogFolderId, number>;
  onSelect: (id: CatalogFolderId) => void;
}) {
  const { t, locale } = useLocale();

  return (
    <nav
      aria-label={t({ ar: "مجلدات الكتالوج", en: "Catalog folders" })}
      className="flex flex-col gap-1.5 md:sticky md:top-4 md:w-52 md:shrink-0"
    >
      {FOLDERS.map((folder) => {
        const Icon = folder.icon;
        const isActive = folder.id === active;

        return (
          <button
            key={folder.id}
            type="button"
            onClick={() => onSelect(folder.id)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              isActive
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon
              className={cn("size-4 shrink-0", isActive ? "text-primary" : undefined)}
              strokeWidth={2}
              aria-hidden="true"
            />
            <span className="truncate">{folder.name[locale]}</span>
            <Badge
              variant="outline"
              className={cn(
                "ms-auto font-mono text-xs",
                isActive
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-muted text-muted-foreground",
              )}
            >
              {counts[folder.id]}
            </Badge>
          </button>
        );
      })}
    </nav>
  );
}
