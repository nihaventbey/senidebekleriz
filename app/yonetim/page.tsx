import { Metadata } from "next";
import { getAdminDashboardStats, getContentReadinessStats } from "@/lib/data/admin-stats";
import { getContentGaps } from "@/lib/data/content-gaps";
import { getDiscoveredContent } from "@/lib/data/admin-discovery";
import { DashboardCockpit } from "@/components/admin/dashboard-cockpit";

export const metadata: Metadata = {
  title: "Yönetim Kokpiti",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [stats, readiness, gaps, pendingDiscoveries] = await Promise.all([
    getAdminDashboardStats(),
    getContentReadinessStats(),
    getContentGaps(),
    getDiscoveredContent("pending_review"),
  ]);

  return (
    <DashboardCockpit
      stats={stats}
      readiness={readiness}
      gaps={gaps}
      pendingDiscoveries={pendingDiscoveries}
    />
  );
}
