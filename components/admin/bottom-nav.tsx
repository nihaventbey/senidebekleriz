"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Newspaper,
  CalendarDays,
  Radar,
  Menu,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type BottomNavItem = {
  href?: string;
  label: string;
  icon: LucideIcon;
  isAction?: boolean;
};

const bottomNavItems: BottomNavItem[] = [
  { href: "/yonetim", label: "Kokpit", icon: LayoutDashboard },
  { href: "/yonetim/haberler", label: "Haberler", icon: Newspaper },
  { href: "/yonetim/etkinlikler", label: "Etkinlik", icon: CalendarDays },
  { href: "/yonetim/kesif", label: "Keşif", icon: Radar },
  { label: "Menü", icon: Menu, isAction: true },
];

type AdminBottomNavProps = {
  onOpenMenu: () => void;
};

export function AdminBottomNav({ onOpenMenu }: AdminBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border/80 bg-background/95 backdrop-blur-md shadow-lg"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.35rem)" }}
      aria-label="Mobil Yönetim Alt Çubuğu"
    >
      <div className="flex items-center justify-around px-1 pt-1">
        {bottomNavItems.map((item, index) => {
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <button
                key={index}
                type="button"
                onClick={onOpenMenu}
                className="flex flex-1 flex-col items-center justify-center py-1.5 px-1 min-h-[48px] text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                aria-label="Tüm Yönetim Menüsünü Aç"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="mt-1 text-[10px] font-medium leading-none">
                  {item.label}
                </span>
              </button>
            );
          }

          const isActive =
            item.href === "/yonetim"
              ? pathname === "/yonetim"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={index}
              href={item.href!}
              className={cn(
                "flex flex-1 flex-col items-center justify-center py-1.5 px-1 min-h-[48px] transition-all active:scale-95",
                isActive
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex h-6 w-10 items-center justify-center rounded-full transition-colors",
                  isActive ? "bg-primary/15 text-primary" : ""
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="mt-1 text-[10px] leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
