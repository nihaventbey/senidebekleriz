import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats and safely trims a summary/meta_description so it never cuts mid-word or mid-sentence.
 */
export function formatSeoSummary(text?: string | null, targetMax = 220): string {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= targetMax) return clean;

  const sub = clean.slice(0, targetMax);
  const lastPunct = Math.max(sub.lastIndexOf("."), sub.lastIndexOf("!"), sub.lastIndexOf("?"));
  if (lastPunct >= 90) {
    return sub.slice(0, lastPunct + 1).trim();
  }
  const lastSpace = sub.lastIndexOf(" ");
  if (lastSpace >= 90) {
    return sub.slice(0, lastSpace).trim() + "...";
  }
  return sub.trim();
}
