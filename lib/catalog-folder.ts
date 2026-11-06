import type { CatalogFolderId } from "@/components/catalog/folder-nav";

const STORAGE_KEY = "catalog.folder";
const VALID_FOLDERS: CatalogFolderId[] = ["brands", "cars", "categories"];
const listeners = new Set<() => void>();

function readFolder(): CatalogFolderId {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved && VALID_FOLDERS.includes(saved as CatalogFolderId)) {
    return saved as CatalogFolderId;
  }
  return "brands";
}

export function getFolderSnapshot(): CatalogFolderId {
  if (typeof window === "undefined") return "brands";
  return readFolder();
}

export function getFolderServerSnapshot(): CatalogFolderId {
  return "brands";
}

export function subscribeFolder(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setFolder(folder: CatalogFolderId): void {
  window.localStorage.setItem(STORAGE_KEY, folder);
  for (const listener of listeners) listener();
}
