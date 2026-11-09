"use server";

import { requireAdmin } from "@/lib/auth/admin";

import { runAutopilotFallback, getAutopilotStatus } from "@/lib/autopilot/fallback-autopilot";

export async function checkAutopilotStatusAction() {
  await requireAdmin();
  return await getAutopilotStatus();
}

export async function triggerAutopilotAction() {
  await requireAdmin();
  return await runAutopilotFallback();
}
