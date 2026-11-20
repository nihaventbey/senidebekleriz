"use client";

import { useId } from "react";

type SwitchControlProps = {
  id?: string;
  name?: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
};

/**
 * Accessible binary switch using the native HTML `switch` attribute
 * (`<input type="checkbox" switch>`) with `accent-color` styling and
 * explicit `for`/`id` label association.
 */
export function SwitchControl({
  id: providedId,
  name,
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: SwitchControlProps) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <div className="flex min-h-11 items-start gap-3 rounded-xl border border-border/70 bg-background/70 p-3.5 transition-colors hover:bg-muted/40">
      <div className="flex h-6 items-center">
        <input
          id={id}
          name={name}
          type="checkbox"
          role="switch"
          {...({ switch: "" } as Record<string, unknown>)}
          checked={checked}
          disabled={disabled}
          aria-describedby={descriptionId}
          onChange={(e) => onCheckedChange(e.target.checked)}
          className="native-switch"
        />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <label
          htmlFor={id}
          className="block cursor-pointer text-sm font-semibold leading-snug text-foreground"
        >
          {label}
        </label>
        {description && (
          <p id={descriptionId} className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
