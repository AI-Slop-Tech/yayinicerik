import type { Metadata } from "next";
import { PricingCards } from "@/components/pricing";

export const metadata: Metadata = {
  title: "Fiyatlandırma",
  description: "Ücretsiz oyna ya da KNGL VIP ile öncelikli render, 1080p ve filigransız video.",
};

export default function PricingPage() {
  return (
    <div className="container-x py-12">
      <p className="eyebrow mb-2">Fiyatlandırma</p>
      <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Ücretsiz ve VIP</h1>
      <p className="mt-3 max-w-xl text-ink-soft">
        Ücretsiz plan oynamak için yeterli. VIP, render kuyruğunun önüne geçer ve videoları filigransız 1080p teslim eder.
      </p>
      <div className="mt-10">
        <PricingCards />
      </div>
      <div className="card mt-8 p-6 text-sm text-ink-soft">
        <p>
          <strong className="text-ink">Ödeme:</strong> VIP üyelik 30 gün geçerlidir ve otomatik yenilenmez. Ödeme altyapısı hesap
          sayfasından etkinleştirilir; faturalar e-posta ile gönderilir. Sorularınız için{" "}
          <a href="mailto:destek@kngldublaj.com" className="text-ink underline underline-offset-2">
            destek@kngldublaj.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
