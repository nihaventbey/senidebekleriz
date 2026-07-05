export const TURKEY_REGIONS = [
  "Marmara",
  "Ege",
  "İç Anadolu",
  "Karadeniz",
  "Akdeniz",
  "Güneydoğu Anadolu",
  "Doğu Anadolu",
] as const;

export type TurkeyRegion = (typeof TURKEY_REGIONS)[number];
