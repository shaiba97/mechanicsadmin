"use client";

import { KpiCards } from "@/components/dashboard/kpi-cards";
import { OrderStream } from "@/components/dashboard/order-stream";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <KpiCards />
      <OrderStream />
    </div>
  );
}
