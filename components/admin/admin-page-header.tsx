import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/**
 * Standardized page header bar shared across admin listing pages.
 */
export function AdminPageHeader({
  title,
  description,
  badge,
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {badge}
        </div>
        {description ? (
          <p className="text-xs text-muted-foreground sm:text-sm">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
