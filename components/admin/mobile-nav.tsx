"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ExternalLink, ShieldCheck } from "lucide-react";
import { adminNavSections } from "@/components/admin/sidebar";
import { LogoutButton } from "@/components/admin/logout-button";
import { cn } from "@/lib/utils";

type AdminMobileNavProps = {
  open: boolean;
  onClose: () => void;
};

export function AdminMobileNav({ open, onClose }: AdminMobileNavProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle ESC key
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Yönetim Menüsü"
    >
      {/* 1. Backdrop with light-dismiss tap */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Slide-in Drawer Sheet: min(22rem, 85vw) leaves 15% tap affordance on mobile */}
      <nav
        className="relative z-10 flex h-[100svh] w-[min(22rem,85vw)] flex-col bg-background shadow-2xl transition-transform duration-200 ease-out animate-in slide-in-from-left"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/70 px-4 bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Seni de Bekleriz
              </p>
              <p className="text-sm font-bold text-foreground">Yönetim Paneli</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Menüyü Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {adminNavSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/yonetim"
                      ? pathname === "/yonetim"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium min-h-[44px] transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:bg-muted/80 hover:text-foreground active:bg-muted"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Drawer Footer Actions */}
        <div className="shrink-0 border-t border-border/70 p-3 bg-muted/20 space-y-1.5 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
          <Link
            href="/"
            onClick={onClose}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-background px-3 py-2.5 text-xs font-medium text-foreground hover:bg-muted min-h-[44px] transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Siteyi Yeni Sekmede Aç</span>
          </Link>

          <div className="pt-0.5 flex justify-center">
            <LogoutButton />
          </div>
        </div>
      </nav>
    </div>,
    document.body
  );
}
