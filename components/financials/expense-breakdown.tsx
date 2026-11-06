"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/hooks/use-locale";
import { formatPercent, formatSarExact } from "@/lib/format";

export type ExpenseCategory = "infrastructure" | "marketing" | "operations" | "compliance";

export type ExpenseEntry = {
  id: string;
  date: string;
  category: ExpenseCategory;
  amountSar: number;
  description: { ar: string; en: string };
  vendor: { ar: string; en: string };
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, { ar: string; en: string }> = {
  infrastructure: { ar: "البنية التحتية", en: "Infrastructure" },
  marketing: { ar: "التسويق", en: "Marketing" },
  operations: { ar: "العمليات", en: "Operations" },
  compliance: { ar: "الامتثال والضريبة", en: "Legal / ZATCA" },
};

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "infrastructure",
  "marketing",
  "operations",
  "compliance",
];

export function ExpenseBreakdown({
  expenses,
  title,
  description,
}: {
  expenses: ExpenseEntry[];
  title?: { ar: string; en: string };
  description?: { ar: string; en: string };
}) {
  const { t, locale } = useLocale();

  const totals = EXPENSE_CATEGORIES.map((category) => ({
    category,
    amountSar: expenses
      .filter((expense) => expense.category === category)
      .reduce((sum, expense) => sum + expense.amountSar, 0),
  }));
  const totalSar = totals.reduce((sum, row) => sum + row.amountSar, 0);
  const maxAmount = Math.max(...totals.map((row) => row.amountSar), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {title ? t(title) : t({ ar: "ملخص المصروفات", en: "Expenses summary" })}
        </CardTitle>
        <CardDescription>
          {description
            ? t(description)
            : t({
                ar: "توزيع المصروفات التشغيلية حسب البند",
                en: "Operating expense distribution by category",
              })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">
            {t({ ar: "إجمالي المصروفات", en: "Total expenses" })}
          </span>
          <span className="font-mono text-lg font-semibold">
            {formatSarExact(totalSar, locale)}
          </span>
        </div>
        <ul className="flex flex-col gap-2.5">
          {totals.map((row) => {
            const share = totalSar === 0 ? 0 : row.amountSar / totalSar;
            return (
              <li key={row.category} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="font-medium">{EXPENSE_CATEGORY_LABELS[row.category][locale]}</span>
                  <span className="font-mono text-muted-foreground">
                    {formatSarExact(row.amountSar, locale)}
                    <span className="ms-1.5">{formatPercent(share)}</span>
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.round((row.amountSar / maxAmount) * 100)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}