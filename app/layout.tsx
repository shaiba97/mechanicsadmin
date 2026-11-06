import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";

// next/font/google self-hosts fonts with no external network requests.
// Source: node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md
const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Mechanics — لوحة التحكم | Admin Dashboard",
  description:
    "Automotive spare parts marketplace control panel for KSA. لوحة تحكم سوق قطع غيار السيارات في السعودية.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Bilingual default: Arabic. The locale provider updates these attributes
    // at runtime; suppressHydrationWarning covers the stored-locale flip.
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        plexArabic.variable,
        "font-sans",
      )}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
