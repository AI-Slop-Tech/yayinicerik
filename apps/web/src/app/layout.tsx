import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { BRAND } from "@kngl/shared";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getIdentity } from "@/lib/auth";
import { env } from "@/lib/env";
import "./globals.css";

const sans = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-sans", display: "swap" });
const display = Space_Grotesk({ subsets: ["latin", "latin-ext"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(env().NEXT_PUBLIC_SITE_URL),
  title: {
    default: `${BRAND.name} — Arkadaşlarınla Online Dublaj Oyunu`,
    template: `%s · ${BRAND.name}`,
  },
  description:
    "Bir oda kur, kodu paylaş, karakterini al, repliklerini kaydet. Herkesin sesi tek bir videoda birleşsin. Ücretsiz, tarayıcıda, kurulumsuz.",
  applicationName: BRAND.name,
  keywords: ["dublaj oyunu", "online dublaj", "arkadaşlarla oyun", "seslendirme", "sahne dublajı", "KNGL"],
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: BRAND.name,
    title: `${BRAND.name} — Sahneyi seslendir. Arkadaşlarınla.`,
    description: "Karakterini al, repliklerini kaydet, final videoyu birlikte izle.",
    
  },
  twitter: { card: "summary_large_image", title: BRAND.name,  },
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#090b11",
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
