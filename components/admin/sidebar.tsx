"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  MapPinned,
  Tags,
  FileText,
  Megaphone,
  ExternalLink,
  UserCog,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/yonetim", label: "Dashboard", icon: LayoutDashboard },
  { href: "/yonetim/sehirler", label: "Şehirler", icon: Building2 },
  { href: "/yonetim/mekanlar", label: "Mekanlar", icon: MapPinned },
  { href: "/yonetim/kategoriler", label: "Kategoriler", icon: Tags },
  { href: "/yonetim/sayfalar", label: "Sayfalar", icon: FileText },
  { href: "/yonetim/yazilar", label: "Blog Yazıları", icon: BookOpen },
  { href: "/yonetim/reklamlar", label: "Reklamlar", icon: Megaphone },
  { href: "/yonetim/hesap", label: "Hesap", icon: UserCog },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r bg-muted/30 md:flex">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/yonetim" className="text-lg font-bold">
          Yönetim Paneli
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/yonetim"
              ? pathname === "/yonetim"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" />
          Siteyi Görüntüle
        </Link>
      </div>
    </aside>
  );
}
