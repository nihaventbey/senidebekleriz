"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Search, MapPin, ArrowRight, Loader2 } from "lucide-react";

const SEARCH_PORTAL_ID = "search-portal";

function getSearchPortalRoot(): HTMLElement {
  return document.getElementById(SEARCH_PORTAL_ID) ?? document.body;
}

type SearchResult = {
  type: "city" | "place";
  name: string;
  slug: string;
  citySlug?: string;
  cityName?: string;
  description?: string;
};

type SearchContextValue = {
  openSearch: () => void;
  closeSearch: () => void;
  isOpen: boolean;
};

const SearchContext = createContext<SearchContextValue | null>(null);

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within SearchProvider");
  }
  return context;
}

function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      return;
    }

    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);

    return () => {
      window.clearTimeout(timer);
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
    if (!open) return;
    const timer = window.setTimeout(() => search(query), 300);
    return () => window.clearTimeout(timer);
  }, [open, query, search]);

  function handleSelect(result: SearchResult) {
    onClose();
    if (result.type === "city") {
      router.push(`/sehir/${result.slug}`);
    } else {
      router.push(`/mekan/${result.slug}`);
    }
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) {
      onClose();
    }
  }

  if (!open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[9999] flex min-h-dvh w-screen items-start justify-center bg-black/75 pt-[12vh] sm:pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Site araması"
    >
      <div className="mx-4 w-full max-w-lg overflow-hidden rounded-2xl border bg-background shadow-2xl">
        <div className="flex items-center border-b px-4">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Şehir, müze veya tarihi yer ara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                onClose();
              }
              if (e.key === "Enter" && results.length > 0) {
                handleSelect(results[0]);
              }
            }}
            className="flex h-14 w-full bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground"
          />
          {loading && (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
          )}
          <button
            type="button"
            onClick={onClose}
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
                    type="button"
                    onClick={() => handleSelect(result)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {result.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {result.type === "city"
                          ? "Şehir"
                          : result.cityName || "Mekan"}
                        {result.description &&
                          ` · ${result.description.slice(0, 60)}`}
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
          <kbd className="rounded border bg-background px-1.5 py-0.5">
            Enter
          </kbd>{" "}
          ile seç ·{" "}
          <kbd className="rounded border bg-background px-1.5 py-0.5">ESC</kbd>{" "}
          ile kapat
        </div>
      </div>
    </div>,
    getSearchPortalRoot()
  );
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  const openSearch = useCallback(() => setOpen(true), []);
  const closeSearch = useCallback(() => setOpen(false), []);

  useLayoutEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      document.body.removeAttribute("data-search-open");
      return;
    }

    document.body.style.overflow = "hidden";
    document.body.setAttribute("data-search-open", "true");

    return () => {
      document.body.style.overflow = "";
      document.body.removeAttribute("data-search-open");
    };
  }, [open]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [open]);

  return (
    <SearchContext.Provider
      value={{ openSearch, closeSearch, isOpen: open }}
    >
      {children}
      {portalReady && (
        <SearchOverlay open={open} onClose={closeSearch} />
      )}
    </SearchContext.Provider>
  );
}
