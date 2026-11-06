"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/hooks/use-locale";
import { formatNumber, formatPercent, formatSarExact } from "@/lib/format";
import { api } from "@/lib/api";

export type RegionId = "riyadh" | "jeddah" | "dammam" | "makkah" | "madinah" | "khobar";

const SPARK_W = 120;
const SPARK_H = 32;
const SPARK_PAD = 2;

function renderSparkPoints(values: number[], width: number, height: number): { line: string; area: string } {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const step = (width - SPARK_PAD * 2) / (values.length - 1);
  const points = values.map((value, i) => {
    const x = SPARK_PAD + i * step;
    const y = SPARK_PAD + (height - SPARK_PAD * 2) * (1 - (value - min) / span);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = points.join(" ");
  const area = `${SPARK_PAD},${height - SPARK_PAD} ${line} ${width - SPARK_PAD},${height - SPARK_PAD}`;
  return { line, area };
}

function GmvSparkline({ values }: { values: number[] }) {
  const { line, area } = React.useMemo(
    () => renderSparkPoints(values, SPARK_W, SPARK_H),
    [values],
  );
  return (
    <svg
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      className="h-9 w-full text-[oklch(0.48_0.15_22)]"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polygon points={area} fill="currentColor" fillOpacity={0.08} stroke="none" />
      <polyline
        points={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

type KpiData = {
  gmvSar: number;
  gmvTrendWeek: number[];
  commissionSar: number;
  takeRate: number;
  storesVerified: number;
  storesPending: number;
  storesSuspended: number;
  liveOrdersByRegion: Record<string, number>;
  totalOrders: number;
  completedOrders: number;
};

export function KpiCards() {
  const { t, locale } = useLocale();
  const [kpi, setKpi] = React.useState<KpiData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get<KpiData>("/api/admin/dashboard/kpi");
        setKpi(data);
      } catch {
        setKpi(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="gap-1.5 py-4">
            <CardHeader>
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Loading…
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">—</span>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!kpi) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="gap-1.5 py-4">
            <CardHeader>
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Error
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <span className="text-sm text-destructive">—</span>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const liveTotal = (Object.values(kpi.liveOrdersByRegion) as number[]).reduce(
    (sum, count) => sum + count,
    0,
  );

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="gap-1.5 py-4">
        <CardHeader>
          <CardTitle className="text-xs font-medium text-muted-foreground">
            {t({ ar: "إجمالي مبيعات المنصة", en: "Total GMV" })}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <span className="font-mono text-2xl font-semibold tracking-tight">
            {formatSarExact(kpi.gmvSar, locale)}
          </span>
          <GmvSparkline values={kpi.gmvTrendWeek} />
        </CardContent>
      </Card>

      <Card className="gap-1.5 py-4">
        <CardHeader>
          <CardTitle className="text-xs font-medium text-muted-foreground">
            {t({ ar: "عمولة المنصة", en: "Commission Earnings" })}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <span className="font-mono text-2xl font-semibold tracking-tight">
            {formatSarExact(kpi.commissionSar, locale)}
          </span>
          <Badge
            variant="outline"
            className="w-fit border-[oklch(0.45_0.15_22)]/50 bg-[oklch(0.45_0.15_22)]/10 font-mono text-xs text-[oklch(0.45_0.15_22)]"
          >
            {t({ ar: "نسبة العمولة", en: "Take rate" })} {formatPercent(kpi.takeRate)}
          </Badge>
        </CardContent>
      </Card>

      <Card className="gap-1.5 py-4">
        <CardHeader>
          <CardTitle className="text-xs font-medium text-muted-foreground">
            {t({ ar: "المتاجر الموثقة", en: "Verified Stores" })}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <span className="font-mono text-2xl font-semibold tracking-tight">
            {formatNumber(kpi.storesVerified)}
          </span>
          <Badge
            variant="outline"
            className="w-fit gap-1.5 border-border bg-muted text-muted-foreground"
          >
            <span className="font-mono">{formatNumber(kpi.storesPending)}</span>
            <span className="text-muted-foreground">
              {t({ ar: "بانتظار اعتماد السجل التجاري", en: "pending CR approval" })}
            </span>
          </Badge>
        </CardContent>
      </Card>

      <Card className="gap-1.5 py-4">
        <CardHeader>
          <CardTitle className="text-xs font-medium text-muted-foreground">
            {t({ ar: "طلبات نشطة الآن", en: "Live Active Orders" })}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <span className="font-mono text-2xl font-semibold tracking-tight">
            {formatNumber(liveTotal)}
          </span>
          <ul className="flex flex-wrap gap-1.5">
            {(Object.keys(kpi.liveOrdersByRegion) as string[]).map((region) => (
              <li key={region}>
                <Badge
                  variant="outline"
                  className="border-[oklch(0.45_0.15_22)]/50 bg-[oklch(0.45_0.15_22)]/10 gap-1 text-[11px] text-[oklch(0.45_0.15_22)]"
                >
                  {region}
                  <span className="font-mono font-medium text-foreground">
                    {formatNumber(kpi.liveOrdersByRegion[region])}
                  </span>
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}