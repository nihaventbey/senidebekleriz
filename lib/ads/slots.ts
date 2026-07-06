/** Sitede AdBanner slot prop'ları ile birebir eşleşen pozisyon anahtarları */
export const AD_SLOT_OPTIONS = [
  { position: "home-hero-bottom", label: "Ana sayfa — hero altı" },
  { position: "home-footer-top", label: "Ana sayfa — footer üstü" },
  { position: "cities-top", label: "Şehirler listesi — üst" },
  { position: "cities-bottom", label: "Şehirler listesi — alt" },
  { position: "city-content-top", label: "Şehir detay — üst" },
  { position: "city-list-inline", label: "Şehir detay — liste arası" },
  { position: "categories-top", label: "Kategoriler listesi — üst" },
  { position: "categories-bottom", label: "Kategoriler listesi — alt" },
  { position: "category-content-top", label: "Kategori detay — üst" },
  { position: "category-list-inline", label: "Kategori detay — liste arası" },
  { position: "place-top", label: "Mekan detay — üst" },
  { position: "place-content-inline", label: "Mekan detay — içerik içi" },
  { position: "place-sidebar", label: "Mekan detay — kenar çubuğu" },
  { position: "event-detail-bottom", label: "Etkinlik detay — alt" },
  { position: "article-content-top", label: "Yazı detay — üst" },
  { position: "article-content-bottom", label: "Yazı detay — alt" },
] as const;

export type AdSlotPosition = (typeof AD_SLOT_OPTIONS)[number]["position"];

export function getAdSlotLabel(position: string): string {
  return (
    AD_SLOT_OPTIONS.find((option) => option.position === position)?.label ??
    position
  );
}
