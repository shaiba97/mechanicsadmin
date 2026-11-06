"use client";

import { useSyncExternalStore } from "react";

import {
  getCatalogState,
  getServerCatalogState,
  subscribeCatalog,
} from "@/lib/catalog-store";

export function useCatalog() {
  return useSyncExternalStore(
    subscribeCatalog,
    getCatalogState,
    getServerCatalogState,
  );
}
