import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Gizlilik politikası" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Gizlilik politikası" updated="1 Eylül 2026">
      <h2>Hangi verileri topluyoruz?</h2>
      <p>
        Misafir olarak oynarken yalnızca seçtiğin takma ad ve oturum için gerekli teknik bilgiler (IP adresi, tarayıcı türü) işlenir.
        Kayıt olursan e-posta adresin ve şifrenin geri döndürülemez özeti saklanır.
      </p>
      <h2>Ses kayıtları</h2>
      <p>
        Odada kaydettiğin replikler yalnızca final videoyu üretmek için kullanılır. Ham kayıtlar render tamamlandıktan sonra en geç 24 saat içinde
        silinir. Final video, oda sahibi &quot;herkese açık&quot; seçmediyse yalnızca oda üyeleriyle paylaşılır.
      </p>
      <h2>Çerezler</h2>
      <p>
        Oturumu sürdürmek için zorunlu çerezler kullanılır. Reklam ya da üçüncü taraf izleme çerezi kullanmıyoruz.
      </p>
      <h2>Haklarınız</h2>
      <p>
        Verilerine erişme, düzeltme ve silme talebini <a href="mailto:gizlilik@kngldublaj.com">gizlilik@kngldublaj.com</a> adresine iletebilirsin;
        talepler 30 gün içinde sonuçlandırılır.
      </p>
    </LegalPage>
  );
}
