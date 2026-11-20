"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "success" | "warning" | "primary";

type DisclosureSectionProps = {
  title: string;
  description?: string;
  badge?: string;
  badgeTone?: BadgeTone;
  icon?: ReactNode;
  defaultOpen?: boolean;
  tone?: "default" | "accent";
  className?: string;
  children: ReactNode;
};

const BADGE_STYLES: Record<BadgeTone, string> = {
  neutral: "border-border/70 bg-muted/60 text-muted-foreground",
  success:
    "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  warning:
    "border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-300",
  primary: "border-primary/30 bg-primary/10 text-primary",
};

/**
 * Accessible progressive-disclosure card built on native HTML `<details>`/`<summary>`.
 * Intentionally avoids heading tags inside `<summary>` so screen readers expose a clean button trigger.
 */
export function DisclosureSection({
  title,
  description,
  badge,
  badgeTone = "neutral",
  icon,
  defaultOpen = false,
  tone = "default",
  className,
  children,
}: DisclosureSectionProps) {
  return (
    <details
      open={defaultOpen}
      className={cn(
        "admin-disclosure group overflow-hidden rounded-2xl border shadow-xs",
        tone === "accent"
          ? "border-primary/30 bg-primary/5"
          : "border-border/70 bg-card",
        className
      )}
    >
      <summary
        className={cn(
          "flex cursor-pointer select-none items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:px-5",
          tone === "accent" ? "hover:bg-primary/10" : "hover:bg-muted/40"
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <ChevronRight
            className="admin-disclosure-chevron h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          {icon ? <span className="shrink-0">{icon}</span> : null}
          <div className="min-w-0 flex-1">
            <span className="block truncate text-xs font-bold text-foreground sm:text-sm">
              {title}
            </span>
            {description ? (
              <span className="mt-0.5 block truncate text-[11px] font-normal text-muted-foreground">
                {description}
              </span>
            ) : null}
          </div>
        </div>

        {badge ? (
          <span
            className={cn(
              "inline-flex max-w-[11rem] shrink-0 items-center truncate rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
              BADGE_STYLES[badgeTone]
            )}
            title={badge}
          >
            {badge}
          </span>
        ) : null}
      </summary>

      <div className="space-y-4 border-t border-border/60 p-4 sm:p-5">
        {children}
      </div>
    </details>
  );
}
