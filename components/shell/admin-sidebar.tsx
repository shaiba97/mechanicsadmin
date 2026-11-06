"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  Package,
  ShoppingBag,
  Store,
  Truck,
  UserCircle,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Bilingual } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { api } from "@/lib/api";

type NavItem = {
  href: string;
  label: Bilingual;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: { ar: "لوحة التحكم", en: "Dashboard" }, icon: BarChart3 },
  { href: "/stores", label: { ar: "المتاجر", en: "Stores" }, icon: Store },
  { href: "/customers", label: { ar: "العملاء", en: "Customers" }, icon: Users },
  { href: "/orders", label: { ar: "الطلبات", en: "Orders" }, icon: Boxes },
  { href: "/catalog", label: { ar: "الكتالوج", en: "Catalog" }, icon: Package },
  { href: "/products", label: { ar: "المخزون - قطع الغيار", en: "Parts Inventories" }, icon: ShoppingBag },
  { href: "/delivery", label: { ar: "التوصيل", en: "Delivery" }, icon: Truck },
  { href: "/financials", label: { ar: "المالية", en: "Financials" }, icon: Wallet },
  { href: "/profile", label: { ar: "الملف الشخصي", en: "Profile" }, icon: UserCircle },
];

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t, dir, locale } = useLocale();
  const pathname = usePathname();
  const [storesActive, setStoresActive] = React.useState(0);

  React.useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get<{ storesActive: number }>("/api/admin/dashboard/kpi");
        setStoresActive(data.storesActive);
      } catch {
        setStoresActive(0);
      }
    };
    load();
  }, []);

  return (
    <Sidebar
      side={dir === "rtl" ? "right" : "left"}
      collapsible="icon"
      className="bg-[linear-gradient(160deg,oklch(0.45_0.125_24)_0%,oklch(0.34_0.09_22)_48%,oklch(0.40_0.11_23)_100%)]"
      {...props}
    >
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <span className="flex size-7 items-center justify-center rounded-md bg-foreground text-primary-foreground">
            <Boxes className="size-4" strokeWidth={2} aria-hidden="true" />
          </span>
          <div className="grid leading-none">
            <span className="text-sm font-semibold">Mechanics</span>
            <span className="text-xs text-muted-foreground">
              {t({ ar: "لوحة الإدارة", en: "Admin Panel" })}
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t({ ar: "العمليات", en: "Operations" })}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.label[locale]}
                      render={
                        <Link href={item.href} aria-current={active ? "page" : undefined}>
                          <item.icon className="size-4" strokeWidth={2} aria-hidden="true" />
                          <span>{item.label[locale]}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <div className="flex items-center justify-between px-3 py-2 text-[11px] text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
        <span>{t({ ar: "المتاجر النشطة", en: "Active stores" })}</span>
        <span className="font-mono font-medium text-sidebar-foreground">{storesActive}</span>
      </div>
      <SidebarRail />
    </Sidebar>
  );
}