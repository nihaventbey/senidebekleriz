export type ArtistCardSettings = {
  showArtistInfoCards: boolean;
  autoEnrichOnImport: boolean;
};

export const DEFAULT_ARTIST_CARD_SETTINGS: ArtistCardSettings = {
  showArtistInfoCards: true,
  autoEnrichOnImport: true,
};

export function normalizeArtistCardSettings(raw: unknown): ArtistCardSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_ARTIST_CARD_SETTINGS;
  const obj = raw as Record<string, unknown>;

  return {
    showArtistInfoCards:
      typeof obj.showArtistInfoCards === "boolean"
        ? obj.showArtistInfoCards
        : DEFAULT_ARTIST_CARD_SETTINGS.showArtistInfoCards,
    autoEnrichOnImport:
      typeof obj.autoEnrichOnImport === "boolean"
        ? obj.autoEnrichOnImport
        : DEFAULT_ARTIST_CARD_SETTINGS.autoEnrichOnImport,
  };
}
