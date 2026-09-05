-- Sahne başına lisans kaydı: içeriğin nereden geldiği ve hangi izinle kullanıldığı.
ALTER TABLE scenes
  ADD COLUMN IF NOT EXISTS license_type   varchar(32) NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS license_source text,
  ADD COLUMN IF NOT EXISTS license_holder text,
  ADD COLUMN IF NOT EXISTS license_note   text;

-- Lisans bilgisi eksik sahneleri hızlı listelemek için.
CREATE INDEX IF NOT EXISTS scenes_license_unknown_idx ON scenes (created_at DESC) WHERE license_type = 'unknown';

-- Kataloğa seed ile gelen 18 sahne özgün senaryolardır (metin hakları site sahibine aittir).
UPDATE scenes SET license_type = 'own', license_holder = 'KNGL Dublaj'
WHERE license_type = 'unknown' AND slug IN (
  'kahvaltida-son-simit','asansorde-yanlis-kat','marsa-ilk-adim','kedi-dedektif-kayip-balik',
  'yarim-kalan-evlilik-teklifi','muhtesem-utu-reklami','mac-sonu-basin-toplantisi','uzay-gemisinde-kahve-molasi',
  'ejderha-ve-muhasebeci','trafikte-felsefe','kralin-son-fermani','robot-anne-yemek-yapiyor',
  'gece-vardiyasi-market','kirmizi-hali-roportaji','korsan-kaptanin-deniz-tutmasi','sinav-kagidi-karisti',
  'bankada-sira-numarasi-999','sihirbazin-ciragi-yanlis-buyu'
);
