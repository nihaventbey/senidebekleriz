"use server";

import { requireAdmin } from "@/lib/auth/admin";
import * as discovery from "@/lib/discovery/service";

export async function runDiscoverySync() {
  await requireAdmin();
  return discovery.runDiscoverySync();
}

export async function rejectDiscovery(id: string) {
  await requireAdmin();
  return discovery.rejectDiscovery(id);
}

export async function importDiscoveryAsEvent(id: string) {
  await requireAdmin();
  return discovery.importDiscoveryAsEvent(id);
}

export async function importDiscoveryAsArticle(id: string) {
  await requireAdmin();
  return discovery.importDiscoveryAsArticle(id);
}

export async function importDiscoveryAsNews(id: string) {
  await requireAdmin();
  return discovery.importDiscoveryAsNews(id);
}

export async function bulkImportDiscovery(ids: string[]) {
  await requireAdmin();
  return discovery.bulkImportDiscovery(ids);
}

export async function bulkRejectDiscovery(ids: string[]) {
  await requireAdmin();
  return discovery.bulkRejectDiscovery(ids);
}

export async function bulkDeleteDiscovery(ids: string[]) {
  await requireAdmin();
  return discovery.bulkDeleteDiscovery(ids);
}

export async function deleteAllDiscoveredContentByFilter(status?: string) {
  await requireAdmin();
  return discovery.deleteAllDiscoveredContentByFilter(status);
}

export async function disaggregateDiscoveryBulletin(id: string) {
  await requireAdmin();
  return discovery.disaggregateDiscoveryBulletin(id);
}
