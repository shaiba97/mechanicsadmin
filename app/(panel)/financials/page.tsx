"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountsTab } from "@/components/financials/accounts-tab";
import { CommissionsTab } from "@/components/financials/commissions-tab";
import { ExpensesTab } from "@/components/financials/expenses-tab";
import { OverviewTab } from "@/components/financials/overview-tab";
import { PayoutsTab } from "@/components/financials/payouts-tab";
import { ZatcaTab } from "@/components/financials/zatca-tab";
import { AccountingTab } from "@/components/financials/accounting-tab";
import { FinancialsStoresTab } from "@/components/financials/stores-tab";
import { PlatformAccountTab } from "@/components/financials/platform-account-tab";
import type { FinancialSummary } from "@/components/financials/financial-summary-cards";
import type { VatSummary } from "@/components/financials/zatca-vat-summary";
import type {
  PaymentAccount,
} from "@/components/financials/accounts-tab";
import type {
  PayoutRequest,
} from "@/components/financials/payouts-tab";
import type {
  ExpenseEntry,
} from "@/components/financials/expense-breakdown";
import { useLocale } from "@/hooks/use-locale";
import { api } from "@/lib/api";

type TabId =
  | "overview"
  | "expenses"
  | "accounts"
  | "payouts"
  | "commissions"
  | "accounting"
  | "platform"
  | "stores"
  | "zatca";

type PayoutsPayload = {
  summary: FinancialSummary;
  vat: VatSummary;
  rows: Array<{
    id: string;
    storeId: string;
    storeCode: string;
    storeName: string;
    city: string;
    salesSar: number;
    commissionSar: number;
    netSar: number;
    ordersCount: number;
    payoutStatus: string;
    status: string;
  }>;
};

export default function FinancialsPage() {
  const { t } = useLocale();
  const [tab, setTab] = React.useState<TabId>("overview");

  const [payouts, setPayouts] = React.useState<PayoutsPayload | null>(null);
  const [expenses, setExpenses] = React.useState<ExpenseEntry[]>([]);
  const [accounts, setAccounts] = React.useState<PaymentAccount[]>([]);
  const [requests, setRequests] = React.useState<PayoutRequest[]>([]);

  React.useEffect(() => {
    const load = async () => {
      try {
    const [payoutsData, expensesData, accountsData, requestsData] =
      await Promise.all([
        api.get<PayoutsPayload>("/api/admin/financials/payouts"),
        api.get<ExpenseEntry[]>("/api/admin/financials/expenses"),
        api.get<PaymentAccount[]>("/api/admin/financials/payment-accounts"),
        api.get<PayoutRequest[]>("/api/admin/financials/payout-requests"),
      ]);
        setPayouts(payoutsData);
        setExpenses(expensesData);
        setAccounts(accountsData);
        setRequests(requestsData);
      } catch {
        setPayouts(null);
        setExpenses([]);
        setAccounts([]);
        setRequests([]);
      }
    };
    load();
  }, []);

  const summary: FinancialSummary = React.useMemo(() => {
    if (!payouts) {
      return {
        totalGmvSar: 0,
        commissionSar: 0,
        pendingPayoutSar: 0,
        completedPayoutSar: 0,
        blendedTakeRate: 0,
      };
    }
    return payouts.summary;
  }, [payouts]);

  const vat: VatSummary = React.useMemo(() => {
    if (!payouts) {
      return { storeSalesVatSar: 0, platformFeeVatSar: 0 };
    }
    return payouts.vat;
  }, [payouts]);

  const rows = (payouts?.rows ?? []).map((row) => ({
    entry: {
      id: row.storeId,
      storeId: row.storeId,
      salesSar: row.salesSar,
      status: row.payoutStatus,
    },
    store: {
      id: row.storeId,
      name: { ar: row.storeName, en: row.storeName },
      city: { ar: row.city, en: row.city },
    },
    commissionSar: row.commissionSar,
    netSar: row.netSar,
  }));

  const tabs: { id: TabId; label: { ar: string; en: string } }[] = [
    { id: "overview", label: { ar: "نظرة عامة", en: "Overview" } },
    { id: "expenses", label: { ar: "المصروفات", en: "Expenses" } },
    { id: "accounts", label: { ar: "الحسابات البنكية", en: "Accounts & Gateways" } },
    { id: "platform", label: { ar: "إعدادات المنصة", en: "Platform Config" } },
    { id: "payouts", label: { ar: "التحويلات المالية", en: "Payouts" } },
    { id: "commissions", label: { ar: "العمولات", en: "Commissions" } },
    { id: "accounting", label: { ar: "فترات المحاسبة", en: "Accounting Periods" } },
    { id: "stores", label: { ar: "أرباح المتاجر", en: "Store Income" } },
    { id: "zatca", label: { ar: "الفاتورة الإلكترونية", en: "ZATCA E-Invoicing" } },
  ];

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as TabId)}
      className="gap-4"
    >
      <TabsList className="w-full justify-start overflow-x-auto">
        {tabs.map((item) => (
          <TabsTrigger key={item.id} value={item.id} className="flex-none">
            {t(item.label)}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="overview">
        <OverviewTab summary={summary} vat={vat} expenses={expenses} />
      </TabsContent>

      <TabsContent value="expenses">
        <ExpensesTab expenses={expenses} onChange={setExpenses} />
      </TabsContent>

      <TabsContent value="accounts">
        <AccountsTab accounts={accounts} onChange={setAccounts} />
      </TabsContent>

      <TabsContent value="platform">
        <PlatformAccountTab />
      </TabsContent>

      <TabsContent value="payouts">
        <PayoutsTab
          requests={requests}
          rows={rows}
          adminAuthRequired
        />
      </TabsContent>

      <TabsContent value="commissions">
        <CommissionsTab />
      </TabsContent>

      <TabsContent value="accounting">
        <AccountingTab />
      </TabsContent>

      <TabsContent value="stores">
        <FinancialsStoresTab rows={payouts?.rows ?? []} />
      </TabsContent>

      <TabsContent value="zatca">
        <ZatcaTab />
      </TabsContent>
    </Tabs>
  );
}
