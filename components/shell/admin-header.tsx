"use client";

import * as React from "react";
import { Bell, Check, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLocale } from "@/hooks/use-locale";
import { useSocketStatus } from "@/hooks/use-socket";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

type Notification = {
  id: string;
  title: { ar: string; en: string };
  at: string;
  unread: boolean;
};

export function AdminHeader() {
  const { t, locale, dir, setLocale } = useLocale();
  const status = useSocketStatus();
  const [read, setRead] = React.useState<Set<string>>(() => new Set());
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get<Notification[]>("/api/admin/notifications");
        setNotifications(data);
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const unread = notifications.filter((n) => n.unread && !read.has(n.id)).length;

  const statusLabel = t(
    {
      connecting: { ar: "جارٍ الاتصال", en: "Connecting" },
      connected: { ar: "مباشر", en: "Live" },
      reconnecting: { ar: "إعادة الاتصال", en: "Reconnecting" },
      disconnected: { ar: "غير متصل", en: "Offline" },
    }[status],
  );

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-white px-4">
      <SidebarTrigger aria-label={t({ ar: "تبديل الشريط الجانبي", en: "Toggle sidebar" })} />
      <Separator orientation="vertical" className="h-4" />

      <span
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
        aria-live="polite"
      >
        <span
          className={`size-2 rounded-full ${
            status === "connected"
              ? "bg-[oklch(0.45_0.15_22)] animate-pulse"
              : "bg-muted-foreground/40"
          }`}
          aria-hidden="true"
        />
        {statusLabel}
      </span>

      <div className="ms-auto flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
          aria-label={t({ ar: "تبديل اللغة", en: "Switch language" })}
        >
          <Languages className="size-4" strokeWidth={2} aria-hidden="true" />
          <span>{locale === "ar" ? "EN" : "ع"}</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="sm" aria-label={t({ ar: "العملة", en: "Currency" })}>
                SAR
              </Button>
            }
          />
          <DropdownMenuContent align="start">
            <DropdownMenuItem className="justify-between">
              SAR · {t({ ar: "ريال سعودي", en: "Saudi Riyal" })}
              <Check className="size-3.5" aria-hidden="true" />
            </DropdownMenuItem>
            <DropdownMenuItem disabled>USD</DropdownMenuItem>
            <DropdownMenuItem disabled>AED</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                aria-label={t({ ar: "الإشعارات", en: "Notifications" })}
              >
                <Bell className="size-4" strokeWidth={2} aria-hidden="true" />
                {unread > 0 && (
                  <span
                    className="absolute -top-0.5 end-0 size-2 rounded-full bg-[oklch(0.45_0.15_22)]"
                    aria-hidden="true"
                  />
                )}
              </Button>
            }
          />
          <SheetContent side={dir === "rtl" ? "left" : "right"} dir={dir}>
            <SheetHeader>
              <SheetTitle>{t({ ar: "الإشعارات", en: "Notifications" })}</SheetTitle>
              <SheetDescription>
                {t({ ar: "تنبيهات التاجر والعمولة للنظام", en: "Merchant and commission alerts" })}
              </SheetDescription>
            </SheetHeader>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <span className="text-xs text-muted-foreground">{t({ ar: "جارٍ التحميل…", en: "Loading…" })}</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <span className="text-xs text-muted-foreground">{t({ ar: "لا توجد إشعارات", en: "No notifications" })}</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1 overflow-y-auto px-4 pb-6">
                {notifications.map((n) => {
                  const unreadNow = n.unread && !read.has(n.id);
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() =>
                        setRead((prev) => new Set(prev).add(n.id))
                      }
                      className="flex flex-col items-start gap-1 rounded-md border-transparent px-3 py-2 text-start hover:bg-accent aria-[current]:opacity-100"
                    >
                      <span className="flex w-full items-center gap-2 text-sm">
                        {unreadNow && (
                          <span
                            className="size-1.5 shrink-0 rounded-full bg-[oklch(0.45_0.15_22)]"
                            aria-hidden="true"
                          />
                        )}
                        <span className={unreadNow ? "font-medium" : "text-muted-foreground"}>
                          {n.title[locale]}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(n.at)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}