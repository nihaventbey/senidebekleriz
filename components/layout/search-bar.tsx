"use client";

import { Search } from "lucide-react";
import { useSearch } from "@/components/layout/search-provider";

type SearchBarProps = {
  variant?: "trigger" | "hero";
  className?: string;
};

export function SearchBar({ variant = "trigger", className }: SearchBarProps) {
  const { openSearch } = useSearch();

  if (variant === "hero") {
    return (
      <button
        type="button"
        onClick={openSearch}
        className={`flex h-12 w-full items-center gap-3 rounded-xl border border-border/60 bg-background/80 px-4 text-left text-base shadow-sm backdrop-blur transition-colors hover:bg-background ${className || ""}`}
      >
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-muted-foreground">
          Şehir, müze veya tarihi yer ara...
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openSearch}
      className={`flex h-9 items-center gap-2 rounded-lg border border-border/60 bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${className || ""}`}
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline">Ara...</span>
    </button>
  );
}
