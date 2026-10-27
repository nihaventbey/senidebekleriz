"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Heart, Award } from "lucide-react";
import { useState, useEffect } from "react";
import { Logo } from "@/components/layout/logo";
import { SearchBar } from "@/components/layout/search-bar";
import { useSearch } from "@/components/layout/search-provider";
import { useBookmarks } from "@/lib/hooks/use-bookmarks";
import { cn } from "@/lib/utils";
import type { BrandSettings } from "@/lib/settings/branding";

const navItems = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/haberler", label: "Haberler" },
  { href: "/etkinlikler", label: "Etkinlikler" },
  { href: "/sehirler", label: "Şehirler" },
  { href: "/kategoriler", label: "Kategoriler" },
  { href: "/blog", label: "Gezi Rehberi" },
];

type HeaderProps = {
  brand?: BrandSettings;
};

export function Header({ brand }: HeaderProps) {
  const pathname = usePathname();
  const { isOpen: searchOpen } = useSearch();
  const { bookmarks, isLoaded } = useBookmarks();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileMenuOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
  }, [mobileMenuOpen]);

  if (pathname?.startsWith("/embed")) {
    return null;
  }

  const bookmarkCount = isLoaded ? bookmarks.length : 0;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/60",
        searchOpen
          ? "bg-background"
          : "bg-background/80 backdrop-blur-md"
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Logo brand={brand} />

        <nav className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-foreground",
                pathname === item.href
                  ? "text-primary font-semibold"
                  : "text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <SearchBar />

          <Link
            href="/kaydedilenler"
            className="relative flex h-9 items-center gap-1.5 rounded-lg border border-border/60 px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Kültür Pasaportum & Gezi Listem"
          >
            <Heart className={cn("h-4 w-4", bookmarkCount > 0 ? "fill-rose-500 text-rose-500" : "")} />
            <span>Pasaportum</span>
            {bookmarkCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white">
                {bookmarkCount}
              </span>
            )}
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/kaydedilenler"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground"
            aria-label="Kültür Pasaportum"
          >
            <Heart className={cn("h-4 w-4", bookmarkCount > 0 ? "fill-rose-500 text-rose-500" : "")} />
            {bookmarkCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-0.5 text-[10px] font-bold text-white">
                {bookmarkCount}
              </span>
            )}
          </Link>
          <SearchBar />
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menü"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 top-16 z-40 bg-black/20 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute top-16 left-0 right-0 z-50 border-b bg-background p-4 shadow-lg md:hidden">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/kaydedilenler"
                className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="flex items-center gap-2">
                  <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
                  Kültür Pasaportum & Gezi Listem
                </span>
                {bookmarkCount > 0 && (
                  <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs text-white">
                    {bookmarkCount}
                  </span>
                )}
              </Link>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
