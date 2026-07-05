import type { LucideIcon } from "lucide-react";
import {
  Landmark,
  LibraryBig,
  Palette,
  TreePine,
} from "lucide-react";

export type CategoryVisual = {
  Icon: LucideIcon;
  accent: string;
  heroBg: string;
};

const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  "tarihi-yer": {
    Icon: Landmark,
    accent: "bg-amber-500/12 text-amber-700 dark:text-amber-400",
    heroBg: "from-amber-500/30 via-amber-600/15 to-amber-900/10",
  },
  muzeler: {
    Icon: LibraryBig,
    accent: "bg-sky-500/12 text-sky-700 dark:text-sky-400",
    heroBg: "from-sky-500/30 via-sky-600/15 to-sky-900/10",
  },
  "sanat-mekanlari": {
    Icon: Palette,
    accent: "bg-violet-500/12 text-violet-700 dark:text-violet-400",
    heroBg: "from-violet-500/30 via-violet-600/15 to-violet-900/10",
  },
  parklar: {
    Icon: TreePine,
    accent: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
    heroBg: "from-emerald-500/30 via-emerald-600/15 to-emerald-900/10",
  },
};

const DEFAULT_VISUAL: CategoryVisual = {
  Icon: Landmark,
  accent: "bg-primary/12 text-primary",
  heroBg: "from-primary/30 via-primary/15 to-primary/5",
};

/** Lucide icon name stored in DB → slug fallback */
const ICON_NAME_TO_SLUG: Record<string, string> = {
  Camera: "muzeler",
  Landmark: "tarihi-yer",
  Palette: "sanat-mekanlari",
  TreePine: "parklar",
  Drama: "sanat-mekanlari",
  LibraryBig: "muzeler",
};

export function getCategoryVisual(slug: string): CategoryVisual {
  return CATEGORY_VISUALS[slug] ?? DEFAULT_VISUAL;
}

export function getCategoryVisualFromIconName(iconName: string): CategoryVisual {
  const slug = ICON_NAME_TO_SLUG[iconName];
  if (slug) return getCategoryVisual(slug);
  return DEFAULT_VISUAL;
}

export const CATEGORY_ICON_NAMES: Record<string, string> = {
  "tarihi-yer": "Landmark",
  muzeler: "LibraryBig",
  "sanat-mekanlari": "Palette",
  parklar: "TreePine",
};
