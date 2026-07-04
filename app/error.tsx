"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Bir Hata Oluştu</h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        Üzgünüz, bir şeyler yanlış gitti. Lütfen tekrar deneyin.
      </p>
      <Button onClick={reset} className="mt-8">
        Tekrar Dene
      </Button>
    </div>
  );
}
