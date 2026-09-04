import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { BRAND } from "@kngl/shared";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getIdentity } from "@/lib/auth";
import { env } from "@/lib/env";
import "./globals.css";

/* Yazı tipleri repoya gömülü (OFL lisanslı): derleme sırasında internet gerekmez. */
const sans = localFont({
  src: [
    { path: "../fonts/manrope-latin.woff2", weight: "200 800", style: "normal" },
    { path: "../fonts/manrope-latin-ext.woff2", weight: "200 800", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});
const display = localFont({
  src: [
    { path: "../fonts/bricolage-latin.woff2", weight: "200 800", style: "normal" },
    { path: "../fonts/bricolage-latin-ext.woff2", weight: "200 800", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env().NEXT_PUBLIC_SITE_URL),
  title: {
    default: `${BRAND.name} — Ekibinle sahne seslendirme oyunu`,
    template: `%s · ${BRAND.name}`,
  },
  description:
    "Ekibini topla, kısa bir sahnede rolleri paylaşın, herkes kendi repliğini kaydetsin; ortaya tek bir prömiyer videosu çıksın. Tarayıcıda, ücretsiz.",
  applicationName: BRAND.name,
  keywords: ["dublaj oyunu", "online dublaj", "arkadaşlarla oyun", "seslendirme", "sahne dublajı", "KNGL"],
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: BRAND.name,
    title: `${BRAND.name} — Rolünü çek, sesini ver, prömiyeri birlikte izle.`,
    description: "Ekip oyunu: kısa bir sahne, paylaşılan roller, tek bir final video.",
    
  },
  twitter: { card: "summary_large_image", title: BRAND.name,  },
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#f7f3ec",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const identity = await getIdentity().catch(() => null);
  return (
    <html lang="tr" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-dvh flex flex-col">
        <Header identity={identity ? { nickname: identity.nickname, isGuest: identity.isGuest, isVip: identity.isVip } : null} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
