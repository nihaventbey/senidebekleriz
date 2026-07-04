"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { Search, MapPin, ArrowRight, Loader2 } from "lucide-react";

type SearchResult = {
  type: "city" | "place";
  name: string;
  slug: string;
  citySlug?: string;
  cityName?: string;
  description?: string;
};

type SearchBarProps = {
  variant?: "trigger" | "inline";
  className?: string;
};

export function SearchBar({ variant = "trigger", className }: SearchBarProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults([]);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  function handleSelect(result: SearchResult) {
    setOpen(false);
    if (result.type === "city") {
      router.push(`/sehir/${result.slug}`);
    } else {
      router.push(`/mekan/${result.slug}`);
    }
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) {
      setOpen(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex h-9 items-center gap-2 rounded-lg border border-border/60 bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${className || ""}`}
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Ara...</span>
        <kbd className="pointer-events-none hidden select-none rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {open && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          className="fixed inset-0 z-[200] flex items-start justify-center bg-black/60 pt-[15vh] backdrop-blur-sm"
        >
          <div className="w-full max-w-lg mx-4 overflow-hidden rounded-2xl border bg-background shadow-2xl">
            <div className="flex items-center border-b px-4">
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Şehir veya mekan ara..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setOpen(false);
                  if (e.key === "Enter" && results.length > 0) {
                    handleSelect(results[0]);
                  }
                }}
                className="flex h-14 w-full bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground"
              />
              {loading && <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />}
              <button
                onClick={() => setOpen(false)}
                className="ml-2 shrink-0 rounded-md border px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
              >
                ESC
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {query.length < 2 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  En az 2 karakter girin
                </div>
              ) : results.length === 0 && !loading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Sonuç bulunamadı
                </div>
              ) : (
                <ul className="space-y-1">
                  {results.map((result) => (
                    <li key={`${result.type}-${result.slug}`}>
                      <button
                        onClick={() => handleSelect(result)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{result.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {result.type === "city" ? "Şehir" : result.cityName || "Mekan"}
                            {result.description && ` · ${result.description.slice(0, 60)}`}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t px-4 py-2.5 text-xs text-muted-foreground">
              <kbd className="rounded border bg-background px-1.5 py-0.5">Enter</kbd> ile seç ·{" "}
              <kbd className="rounded border bg-background px-1.5 py-0.5">ESC</kbd> ile kapat
            </div>
          </div>
        </div>
      )}
    </>
  );
}
