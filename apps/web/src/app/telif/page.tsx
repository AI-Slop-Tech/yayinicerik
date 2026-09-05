import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Telif bildirimi ve kaldırma talebi",
  description: "KNGL Dublaj kataloğundaki içeriklerin kaynağı ve hak sahipleri için kaldırma talebi prosedürü.",
};

export default function CopyrightPage() {
  return (
    <LegalPage title="Telif bildirimi ve kaldırma talebi" updated="5 Eylül 2026">
      <h2>Kataloğu nasıl oluşturuyoruz?</h2>
      <p>
        Katalogdaki her sahne için kaynağını ve hangi hakla kullanıldığını kayıt altına alırız. Sahneler dört kaynaktan gelir:
        telifi dolmuş (kamu malı) eserler, Creative Commons lisanslı eserler, hak sahibinden izin aldığımız eserler ve kendi
        ürettiğimiz içerikler. Kaynağı belirlenmemiş hiçbir sahne yayına alınmaz. Kamu malı ve Creative Commons sahnelerde eser
        sahibi ve arşiv kaydı, sahnenin kendi sayfasında açıkça gösterilir.
      </p>

      <h2>Hak sahibiyseniz</h2>
      <p>
        Bir içeriğin izinsiz kullanıldığını düşünüyorsanız <a href="mailto:telif@kngldublaj.com">telif@kngldublaj.com</a> adresine
        yazın. Bildiriminizde şunlar yer alırsa süreç hızlanır:
      </p>
      <ul>
        <li>Söz konusu sahnenin adı ve bağlantısı</li>
        <li>Hak sahibi olduğunuzu gösteren bilgi ya da belge</li>
        <li>İletişim bilgileriniz</li>
        <li>Talebiniz: içeriğin kaldırılması mı, atıf eklenmesi mi, yoksa lisans görüşmesi mi</li>
      </ul>

      <h2>Ne yaparız?</h2>
      <p>
        Bildiriminizi aldığımızda içeriği <strong>en geç 3 iş günü içinde yayından kaldırırız</strong> ve incelemeye alırız.
        İnceleme sonucunu 5 iş günü içinde size yazılı olarak bildiririz. Talebiniz haklıysa içerik kataloğun tamamından silinir;
        o sahneyle üretilmiş kullanıcı videoları da erişime kapatılır. Kaldırma işlemi için bildiriminizin haklılığını önceden
        ispat etmenizi beklemeyiz; önce kaldırır, sonra değerlendiririz.
      </p>
      <p>
        Lisans görüşmesine açığız. Sahnelerinizin oyunda yer almasını isterseniz koşulları birlikte belirleyebiliriz.
      </p>

      <h2>Kullanıcıların ürettiği videolar</h2>
      <p>
        Oyuncuların kaydettiği sesler ve bunlardan üretilen videolar oyunculara aittir. Bu içeriklerle ilgili bir şikâyetiniz varsa
        aynı adrese yazabilirsiniz; aynı süreç işler. Kullanım şartlarımıza aykırı içerikler ayrıca resen kaldırılır.
      </p>

      <h2>İtiraz</h2>
      <p>
        İçeriğiniz yanlışlıkla kaldırıldıysa aynı adrese itiraz edebilirsiniz. İtirazınızı 5 iş günü içinde değerlendirir,
        haklı bulursak içeriği geri yükleriz.
      </p>

      <p>
        Kataloğa eklenmesini istediğiniz bir sahne varsa <Link href="/sahne-oner">sahne öner</Link> sayfasını kullanabilirsiniz.
      </p>
    </LegalPage>
  );
}
