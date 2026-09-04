import type { Metadata } from "next";
import { PricingPanel } from "@/components/pricing";

export const metadata: Metadata = {
  title: "KNGL Plus",
  description: "Ücretsiz oyna ya da KNGL Plus ile kuyrukta öncelik, imzasız 1080p ve 10 kişilik ekip.",
};

export default function PricingPage() {
  return (
    <div className="container-x py-12">
      <div className="max-w-2xl">
        <p className="eyebrow mb-2">Üyelik</p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Ücretsiz oyna. İstersen Plus.</h1>
        <p className="mt-3 text-ink-soft leading-relaxed">
          Ücretsiz plan oyunun tamamını içerir: sahneler, kura, kayıt, prömiyer. Plus yalnızca daha hızlı, daha net ve daha kalabalık
          oynamak isteyenler için.
        </p>
      </div>
      <div className="mt-10">
        <PricingPanel />
      </div>
      <div className="card mt-8 p-6 text-sm text-ink-soft">
        <p>
          <strong className="text-ink">Ödeme ve iptal:</strong> Plus aylık yenilenir, hesap sayfasından tek tıkla iptal edilir. Dönem sonuna
          kadar avantajlar devam eder. Sorularınız için{" "}
          <a href="mailto:destek@kngldublaj.com" className="font-medium text-ink underline underline-offset-2">
            destek@kngldublaj.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
