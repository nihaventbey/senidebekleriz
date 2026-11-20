import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EditorialShellProps = {
  header: ReactNode;
  main: ReactNode;
  aside: ReactNode;
  className?: string;
};

/**
 * Standardized two-column editorial workspace for News, Events, and Guides.
 * Renders an 8-column writing canvas on the left and a sticky 4-column inspector on the right.
 */
export function EditorialShell({
  header,
  main,
  aside,
  className,
}: EditorialShellProps) {
  return (
    <div className={cn("mx-auto max-w-7xl space-y-5", className)}>
      {header}
      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <div className="min-w-0 space-y-5 lg:col-span-8">{main}</div>
        <aside className="min-w-0 space-y-4 lg:col-span-4 lg:sticky lg:top-[7.75rem]">
          {aside}
        </aside>
      </div>
    </div>
  );
}
