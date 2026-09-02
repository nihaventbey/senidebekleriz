"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  MapPinned,
  Images,
  Tags,
  FileText,
  Megaphone,
  ExternalLink,
  UserCog,
  BookOpen,
  CalendarDays,
  Radar,
  Paintbrush,
  Newspaper,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

export const adminNavSections: NavSection[] = [
  {
    title: "Ana Merkez",
    items: [{ href: "/yonetim", label: "Yönetim Kokpiti", icon: LayoutDashboard }],
  },
  {
    title: "Kültür & Sanat Akışı",
    items: [
      { href: "/yonetim/haberler", label: "Kültür Haberleri", icon: Newspaper },
      { href: "/yonetim/etkinlikler", label: "Etkinlikler", icon: CalendarDays },
      { href: "/yonetim/kesif", label: "İçerik Keşfi (AI)", icon: Radar },
      { href: "/yonetim/yazilar", label: "Gezi Rehberleri", icon: BookOpen },
    ],
  },
  {
    title: "Şehir & Mekan Rehberi",
    items: [
      { href: "/yonetim/sehirler", label: "81 Şehir", icon: Building2 },
      { href: "/yonetim/mekanlar", label: "Kültür Mekanları", icon: MapPinned },
      { href: "/yonetim/gorseller", label: "Görsel Stüdyosu", icon: Images },
      { href: "/yonetim/kategoriler", label: "Kategoriler", icon: Tags },
      { href: "/yonetim/sayfalar", label: "Statik Sayfalar", icon: FileText },
    ],
  },
  {
    title: "Yönetim & Ayarlar",
    items: [
      { href: "/yonetim/reklamlar", label: "Reklam & Gelir", icon: Megaphone },
      { href: "/yonetim/gorunum", label: "Site Görünümü", icon: Paintbrush },
      { href: "/yonetim/hesap", label: "Hesap Ayarları", icon: UserCog },
    ],
  },
];

export const adminNavItems = adminNavSections.flatMap((section) => section.items);

function isNavActive(pathname: string, href: string) {
  if (href === "/yonetim") return pathname === "/yonetim";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[min(100%,15rem)] shrink-0 flex-col border-r border-border/60 bg-muted/25 lg:w-60 xl:w-64 md:flex">
      <div className="border-b border-border/60 px-5 py-5">
        <Link href="/yonetim" className="block">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Seni de Bekleriz
          </p>
          <p className="mt-1 text-lg font-bold tracking-tight">Yönetim</p>
        </Link>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto p-3">
        {adminNavSections.map((section) => (
          <div key={section.title}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isNavActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-background/80 hover:text-foreground"
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
      </nav>

      <div className="border-t border-border/60 p-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-background/80 hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          Siteyi Görüntüle
        </Link>
      </div>
    </aside>
  );
}
