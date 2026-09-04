import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Telif bildirimi" };

export default function CopyrightPage() {
  return (
    <LegalPage title="Telif bildirimi" updated="1 Eylül 2026">
      <p>
        Katalogdaki sahneler yalnızca kullanım hakkına sahip olduğumuz içeriklerden üretilir. Ürettiğimiz her video KNGL Dublaj imzası taşır.
      </p>
      <h2>Hak sahipleri için</h2>
      <p>
        Bir içeriğin izinsiz kullanıldığını düşünüyorsan <a href="mailto:telif@kngldublaj.com">telif@kngldublaj.com</a> adresine hak sahipliğini
        gösteren belgeyle birlikte başvur. Başvurular 5 iş günü içinde değerlendirilir; haklı bulunan içerik kataloğun tamamından kaldırılır.
      </p>
    </LegalPage>
  );
}
