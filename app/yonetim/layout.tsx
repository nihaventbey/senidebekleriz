"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ExternalLink } from "lucide-react";
import { AdminSidebar, adminNavItems } from "@/components/admin/sidebar";
import { AdminMobileNav } from "@/components/admin/mobile-nav";
import { AdminBottomNav } from "@/components/admin/bottom-nav";
import { LogoutButton } from "@/components/admin/logout-button";
import { Button } from "@/components/ui/button";

function getPageTitle(pathname: string): string {
  if (pathname === "/yonetim") return "Yönetim Kokpiti";
  const match = adminNavItems.find(
    (item) =>
      item.href !== "/yonetim" &&
      (pathname === item.href || pathname.startsWith(`${item.href}/`))
  );
  return match?.label ?? "Yönetim Paneli";
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (pathname === "/yonetim/giris") {
    return <>{children}</>;
  }

  const pageTitle = getPageTitle(pathname);

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row text-foreground">
      {/* 1. Desktop Sticky Sidebar */}
      <AdminSidebar />

      {/* 2. Main Content Wrapper */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/70 bg-background/90 px-3.5 backdrop-blur-md sm:px-6">
          {/* Left: Mobile Drawer Trigger + Page Title */}
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-border/70 bg-background text-foreground hover:bg-muted active:scale-95 transition-all md:hidden"
              aria-label="Yönetim Menüsünü Aç"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="hidden h-2 w-2 rounded-full bg-emerald-500 md:inline-block" />
                <h1 className="truncate text-sm font-bold sm:text-base">
                  {pageTitle}
                </h1>
              </div>
              <p className="hidden text-xs text-muted-foreground md:block">
                Seni de Bekleriz · İçerik ve Site Yönetimi
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs gap-1.5 rounded-xl border-border/80 hidden sm:inline-flex"
            >
              <Link href="/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Siteyi Aç</span>
              </Link>
            </Button>

            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-xl sm:hidden text-muted-foreground hover:text-foreground"
              title="Siteyi Görüntüle"
            >
              <Link href="/" target="_blank" rel="noopener noreferrer" aria-label="Siteyi Aç">
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>

            <LogoutButton />
          </div>
        </header>

        {/* Main Workspace: Native window scrolling on mobile, padded bottom for mobile nav bar */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-28 md:pb-8">
          {children}
        </main>
      </div>

      {/* 3. Mobile Slide-in Navigation Drawer */}
      <AdminMobileNav open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* 4. Mobile Bottom Tab Bar */}
      <AdminBottomNav onOpenMenu={() => setDrawerOpen(true)} />
    </div>
  );
}
