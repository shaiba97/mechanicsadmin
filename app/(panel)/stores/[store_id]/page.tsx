import { notFound } from "next/navigation";
import { StoreDetailsContent, type StoreDetail } from "./store-details-content";
import { API_URL } from "@/lib/api";

async function fetchStore(storeId: string): Promise<StoreDetail | null> {
  const res = await fetch(`${API_URL}/api/admin/stores/${storeId}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function StoreDetailsPage({
  params,
}: {
  params: Promise<{ store_id: string }>;
}) {
  const { store_id } = await params;
  const detail = await fetchStore(store_id);

  if (!detail) {
    notFound();
  }

  return <StoreDetailsContent detail={detail} />;
}
