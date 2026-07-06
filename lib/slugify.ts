const TURKISH_CHAR_MAP: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
};

function transliterateTurkish(text: string): string {
  return [...text]
    .map((char) => TURKISH_CHAR_MAP[char] ?? char)
    .join("");
}

export function slugify(text: string): string {
  return transliterateTurkish(text.toLocaleLowerCase("tr-TR"))
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[''`]/g, " ")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
