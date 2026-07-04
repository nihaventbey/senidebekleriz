"use client";

import { CheckCircle2, Circle } from "lucide-react";
import type { EditorialEvaluation } from "@/lib/content/editorial-checklist";

type Props = {
  evaluation: EditorialEvaluation;
  title?: string;
};

export function EditorialChecklist({ evaluation, title }: Props) {
  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">
          {title || "Editoryal Kalite Kontrolü"}
        </h3>
        <span className="text-xs text-muted-foreground">
          {evaluation.wordCount} kelime · {evaluation.charCount} karakter
        </span>
      </div>
      <ul className="space-y-2">
        {evaluation.checks.map((check) => (
          <li key={check.id} className="flex items-start gap-2 text-sm">
            {check.passed ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <div>
              <span className={check.passed ? "text-foreground" : "text-muted-foreground"}>
                {check.label}
              </span>
              {!check.passed && check.hint && (
                <p className="text-xs text-muted-foreground">{check.hint}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
      {evaluation.isReady && (
        <p className="mt-3 text-xs font-medium text-emerald-700">
          Yayına hazır — SEO indeks için uygun.
        </p>
      )}
    </div>
  );
}
