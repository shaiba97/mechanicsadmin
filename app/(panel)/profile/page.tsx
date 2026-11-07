"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  Loader,
  LogOut,
  Save,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useLocale } from "@/hooks/use-locale";
import { api } from "@/lib/api";

type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  role: string | { ar: string; en: string };
  storeId: string | null;
  authProvider: string;
  avatarUrl: string | null;
  isActive: boolean;
  city: string;
  street: string;
  createdAt: string;
  updatedAt?: string;
};

type FormErrors = {
  fullName?: string;
  email?: string;
  phone?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
};

function formatDate(iso: string | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
}

export default function ProfilePage() {
  const { t, locale } = useLocale();
  const router = useRouter();

  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [changingPassword, setChangingPassword] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const [errors, setErrors] = React.useState<FormErrors>({});
  const [success, setSuccess] = React.useState("");

  // Load profile on mount
  React.useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const token = getAccessToken();
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "https://mechanicsbackend.onrender.com"}/api/admin/profile`, {
          headers,
        });
        if (!response.ok) {
          if (response.status === 401) {
            setErrors({ general: t({ ar: "جلسة منتهية الصلاحية، يرجى تسجيل الدخول مرة أخرى", en: "Session expired, please sign in again." }) });
          } else {
            setErrors({ general: t({ ar: "فشل تحميل الملف الشخصي", en: "Failed to load profile" }) });
          }
          return;
        }
        const data = await response.json();
        setProfile(data.user || data);
        setName(data.user?.fullName || data.fullName || "");
        setEmail(data.user?.email || data.email || "");
        setPhone(data.user?.phone || data.phone || "");
      } catch {
        setErrors({ general: t({ ar: "فشل تحميل الملف الشخصي", en: "Failed to load profile" }) });
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      const token = getAccessToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "https://mechanicsbackend.onrender.com"}/auth/me`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          fullName: name.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setErrors({ general: errorData.error?.message || t({ ar: "فشل حفظ التغييرات", en: "Failed to save changes" }) });
        return;
      }
      const updated = await response.json();
      setProfile(updated.user || updated);
      setSuccess(t({ ar: "تم حفظ التغييرات بنجاح", en: "Changes saved successfully" }));
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setErrors({ general: t({ ar: "فشل حفظ التغييرات", en: "Failed to save changes" }) });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setChangingPassword(true);
    try {
      const token = getAccessToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "https://mechanicsbackend.onrender.com"}/auth/change-password`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error?.message || errorData.message || t({ ar: "فشل تحديث كلمة المرور", en: "Failed to update password" });
        if (errorData.error?.details?.currentPassword) {
          setErrors({ currentPassword: errorData.error.details.currentPassword });
        } else if (errorData.error?.details?.newPassword) {
          setErrors({ newPassword: errorData.error.details.newPassword });
        } else if (errorData.error?.details?.confirmPassword) {
          setErrors({ confirmPassword: errorData.error.details.confirmPassword });
        } else {
          setErrors({ general: message });
        }
        return;
      }
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPassword("");
      setSuccess(t({ ar: "تم تحديث كلمة المرور بنجاح", en: "Password updated successfully" }));
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setErrors({ general: t({ ar: "فشل تحديث كلمة المرور", en: "Failed to update password" }) });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingOut(true);
    try {
      const refreshToken = getRefreshToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const token = getAccessToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "https://mechanicsbackend.onrender.com"}/auth/logout`, {
        method: "POST",
        headers,
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Ignore errors on logout - we still want to clear local state
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <span className="text-xs text-muted-foreground">{t({ ar: "جارٍ التحميل…", en: "Loading…" })}</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <span className="text-sm text-destructive">{errors.general || t({ ar: "فشل تحميل الملف الشخصي", en: "Failed to load profile" })}</span>
            <Button size="sm" className="mt-4" onClick={() => router.push("/login")}>
              {t({ ar: "تسجيل الدخول", en: "Sign In" })}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = profile.fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase() || "?";

  const roleLabel =
    typeof profile.role === "string"
      ? { ar: profile.role, en: profile.role }
      : profile.role;
  const roleText = roleLabel?.ar || roleLabel?.en
    ? t(roleLabel)
    : t({ ar: "مدير النظام", en: "System Administrator" });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <span className="text-xl font-semibold">{initials}</span>
        </div>
        <h1 className="text-2xl font-bold">{profile.fullName}</h1>
        <Badge variant="outline" className="gap-1 text-xs">
          <Shield className="size-3.5" strokeWidth={2} aria-hidden="true" />
          {t({ ar: "الحساب مؤمن", en: "Account Secured" })}
        </Badge>
      </div>

      <Separator />

      {/* Personal Data View */}
      <Card>
        <CardHeader>
          <CardTitle>{t({ ar: "البيانات الشخصية", en: "Personal Data" })}</CardTitle>
          <CardDescription>
            {t({ ar: "معلومات حسابك في لوحة الإدارة", en: "Your admin panel account details" })}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label className="text-xs font-medium text-muted-foreground">
                {t({ ar: "الاسم الكامل", en: "Full Name" })}
              </Label>
              <span className="text-sm font-medium">{profile.fullName}</span>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs font-medium text-muted-foreground">
                {t({ ar: "البريد الإلكتروني", en: "Email Address" })}
              </Label>
              <span className="text-sm font-mono text-foreground" dir="ltr">{profile.email}</span>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs font-medium text-muted-foreground">
                {t({ ar: "الدور", en: "Role" })}
              </Label>
              <Badge variant="outline" className="gap-1 text-xs">
                <span className="size-3 rounded-full bg-primary text-primary-foreground">
                  <span className="text-[8px]">{profile.fullName.charAt(0).toUpperCase()}</span>
                </span>
                {roleText}
              </Badge>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs font-medium text-muted-foreground">
                {t({ ar: "تاريخ الإنشاء", en: "Account Created" })}
              </Label>
              <span className="text-sm font-mono text-muted-foreground">
                {profile.createdAt ? formatDate(profile.createdAt) : "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs font-medium text-muted-foreground">
                {t({ ar: "الحالة", en: "Status" })}
              </Label>
              <Badge variant={profile.isActive ? "default" : "outline"} className="gap-1 text-xs">
                {profile.isActive === undefined
                  ? "—"
                  : profile.isActive
                    ? t({ ar: "مؤهل", en: "Active" })
                    : t({ ar: "غير مؤهل", en: "Inactive" })}
              </Badge>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs font-medium text-muted-foreground">
                {t({ ar: "آخر نشاط", en: "Last Active" })}
              </Label>
              <span className="text-sm font-mono text-muted-foreground">
{profile.updatedAt ? formatDate(profile.updatedAt) : "—"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t({ ar: "إعدادات الحساب", en: "Account Settings" })}</CardTitle>
          <CardDescription>
            {t({ ar: "تحديث بيانات حسابك الشخصية", en: "Update your account details" })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fullName" className="text-xs font-medium">
                  {t({ ar: "الاسم الكامل", en: "Full Name" })}
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={!!errors.fullName}
                  aria-describedby={errors.fullName ? "fullName-error" : undefined}
                />
                {errors.fullName && (
                  <p id="fullName-error" className="text-[11px] text-destructive">
                    {errors.fullName}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-xs font-medium">
                  {t({ ar: "البريد الإلكتروني", en: "Email Address" })}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-[11px] text-destructive">
                    {errors.email}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone" className="text-xs font-medium">
                {t({ ar: "رقم الجوال", en: "Phone Number" })}
              </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
            </div>
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="w-full sm:w-auto"
              >
                {saving ? (
                  <span className="flex items-center gap-1.5">
                    <Loader className="size-3.5" strokeWidth={2} aria-hidden="true" />
                    <span>{t({ ar: "جارٍ الحفظ…", en: "Saving…" })}</span>
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Save className="size-3.5" aria-hidden="true" />
                    {t({ ar: "حفظ التغييرات", en: "Save Changes" })}
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle>{t({ ar: "تغيير كلمة المرور", en: "Change Password" })}</CardTitle>
          <CardDescription>
            {t({ ar: "تحديث كلمة المرور الخاصة بك", en: "Update your account password" })}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="grid gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="currentPassword" className="text-xs font-medium">
                {t({ ar: "كلمة المرور الحالية", en: "Current Password" })}
              </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  aria-invalid={!!errors.currentPassword}
                />
                {errors.currentPassword && (
                  <p id="currentPassword-error" className="text-[11px] text-destructive">
                    {errors.currentPassword}
                  </p>
                )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newPassword" className="text-xs font-medium">
                {t({ ar: "كلمة المرور الجديدة", en: "New Password" })}
              </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  aria-invalid={!!errors.newPassword}
                />
                {errors.newPassword && (
                  <p id="newPassword-error" className="text-[11px] text-destructive">
                    {errors.newPassword}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  {t({ ar: "يجب أن تكون 8 أحرف على الأقل، تحتوي على رقم ورمز واحد على الأقل", en: "At least 8 characters, including one number and one symbol" })}
                </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-medium">
                {t({ ar: "تأكيد كلمة المرور", en: "Confirm Password" })}
              </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  aria-invalid={!!errors.confirmPassword}
                />
                {errors.confirmPassword && (
                  <p id="confirmPassword-error" className="text-[11px] text-destructive">
                    {errors.confirmPassword}
                  </p>
                )}
            </div>
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                size="sm"
                disabled={changingPassword}
                className="w-full sm:w-auto"
              >
                {changingPassword ? (
                  <span className="flex items-center gap-1.5">
                    <Loader className="size-3.5" strokeWidth={2} aria-hidden="true" />
                    <span>{t({ ar: "جارٍ التحديث…", en: "Updating…" })}</span>
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <KeyRound className="size-3.5" aria-hidden="true" />
                    {t({ ar: "تحديث كلمة المرور", en: "Update Password" })}
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card>
        <CardHeader>
          <CardTitle>{t({ ar: "إدارة الجلسة", en: "Session Management" })}</CardTitle>
          <CardDescription>
            {t({ ar: "تسجيل الخروج من جميع الأجهزة", en: "Sign out of all devices" })}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t({ ar: "تسجيل الخروج من جميع الأجهزة وإلغاء جميع الجلسات النشطة", en: "Sign out from all devices and revoke all active sessions" })}
          </span>
          <Button
            size="sm"
            variant="destructive"
            onClick={(e) => {
              e.preventDefault();
              handleLogout(e);
            }}
            disabled={loggingOut}
            className="w-full sm:w-auto"
          >
{loggingOut ? (
                  <span className="flex items-center gap-1.5">
                    <Loader className="size-3.5" strokeWidth={2} aria-hidden="true" />
                    <span>{t({ ar: "جارٍ تسجيل الخروج…", en: "Signing out…" })}</span>
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <LogOut className="size-3.5" aria-hidden="true" />
                    {t({ ar: "تسجيل الخروج", en: "Sign Out" })}
                  </div>
                )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
