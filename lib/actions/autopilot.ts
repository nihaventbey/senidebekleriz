"use server";

import { runAutopilotFallback, getAutopilotStatus } from "@/lib/autopilot/fallback-autopilot";

export async function checkAutopilotStatusAction() {
  return await getAutopilotStatus();
}

export async function triggerAutopilotAction() {
  return await runAutopilotFallback();
}
