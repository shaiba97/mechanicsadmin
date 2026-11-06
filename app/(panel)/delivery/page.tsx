"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocale } from "@/hooks/use-locale";
import { DeliveryOverviewTab } from "@/components/delivery/overview-tab";
import { PricingTab } from "@/components/delivery/pricing-tab";

type TabId = "overview" | "pricing";

export default function DeliveryPage() {
  const { t } = useLocale();
  const [tab, setTab] = React.useState<TabId>("overview");

  const tabs: { id: TabId; label: { ar: string; en: string } }[] = [
    { id: "overview", label: { ar: "نظرة عامة", en: "Overview" } },
    { id: "pricing", label: { ar: "التسعير حسب المدينة", en: "City Pricing" } },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t({ ar: "التوصيل", en: "Delivery" })}</CardTitle>
        <CardDescription>
          {t({
            ar: "متابعة طلبات التوصيل المباشرة وإدارة رسوم التوصيل لكل متجر ومدينة",
            en: "Track live delivery orders and manage per-store, per-city delivery fees",
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={(value) => setTab(value as TabId)} className="gap-4">
          <TabsList className="w-full justify-start overflow-x-auto">
            {tabs.map((item) => (
              <TabsTrigger key={item.id} value={item.id} className="flex-none">
                {t(item.label)}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview">
            <DeliveryOverviewTab />
          </TabsContent>

          <TabsContent value="pricing">
            <PricingTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
