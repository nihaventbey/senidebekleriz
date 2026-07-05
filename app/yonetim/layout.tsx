"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminMobileNav } from "@/components/admin/mobile-nav";
import { LogoutButton } from "@/components/admin/logout-button";
import { adminNavItems } from "@/components/admin/sidebar";

function getPageTitle(pathname: string): string {
  if (pathname === "/yonetim") return "Dashboard";
  const match = adminNavItems.find(
    (item) =>
      item.href !== "/yonetim" &&
      (pathname === item.href || pathname.startsWith(`${item.href}/`))
  );
  return match?.label ?? "Yönetim";
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/yonetim/giris") {
    return <>{children}</>;
  }

  const pageTitle = getPageTitle(pathname);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/20">
      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        <div className="flex min-h-[calc(100vh-4rem-2rem)] overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm sm:min-h-[calc(100vh-4rem-3rem)] lg:min-h-[calc(100vh-4rem-4rem)]">
          <AdminSidebar />

          <div className="relative flex min-w-0 flex-1 flex-col">
            <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border/60 bg-background/95 px-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <AdminMobileNav />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold sm:text-base">
                    {pageTitle}
                  </p>
                  <p className="hidden truncate text-xs text-muted-foreground sm:block">
                    İçerik ve site ayarları
                  </p>
                </div>
              </div>
              <LogoutButton />
            </header>

            <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
