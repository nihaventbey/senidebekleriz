"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Logo } from "@/components/layout/logo";
import { SearchBar } from "@/components/layout/search-bar";
import { useSearch } from "@/components/layout/search-provider";
import { cn } from "@/lib/utils";
import type { BrandSettings } from "@/lib/settings/branding";

const navItems = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/sehirler", label: "Şehirler" },
  { href: "/kategoriler", label: "Kategoriler" },
  { href: "/blog", label: "Gezi Rehberi" },
];

type HeaderProps = {
  brand?: BrandSettings;
};

export function Header({ brand }: HeaderProps) {
  const { isOpen: searchOpen } = useSearch();
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

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/60",
        searchOpen
          ? "bg-background"
          : "bg-background/80 backdrop-blur-md"
      )}
    >
      <div className="container mx-auto flex min-h-16 md:min-h-20 py-2 sm:py-3 items-center justify-between px-4">
        <Logo brand={brand} />

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <SearchBar />
        </div>

        <div className="flex items-center gap-2 md:hidden">
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
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
