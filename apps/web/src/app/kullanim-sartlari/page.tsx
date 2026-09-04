import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Kullanım şartları" };

export default function TermsPage() {
  return (
    <LegalPage title="Kullanım şartları" updated="1 Eylül 2026">
      <h2>Hizmet</h2>
      <p>
        KNGL Dublaj, kullanıcıların kataloğumuzdaki sahneleri seslendirip ortak bir video üretmesini sağlayan bir eğlence platformudur.
        Hizmeti kullanarak bu şartları kabul etmiş olursun.
      </p>
      <h2>İçerik kuralları</h2>
      <p>
        Nefret söylemi, taciz, tehdit ya da yasa dışı içerik barındıran kayıtlar kaldırılır ve hesap askıya alınabilir. Ürettiğin
        videoların sorumluluğu sana aittir.
      </p>
      <h2>Lisans</h2>
      <p>
        Kaydettiğin seslerin hakları sende kalır; final videoyu üretmek, saklamak ve senin izninle öne çıkarmak için bize sınırlı bir
        kullanım hakkı vermiş olursun.
      </p>
      <h2>VIP üyelik</h2>
      <p>
        VIP üyelik 30 gün geçerlidir, otomatik yenilenmez. Kullanılmamış süre için iade yapılmaz; hizmet kaynaklı kesintilerde süre uzatılır.
      </p>
    </LegalPage>
  );
}
