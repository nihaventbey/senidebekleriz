"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

type LoadMoreProps<T> = {
  initialItems: T[];
  fetchUrl: string;
  pageSize?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  emptyMessage?: string;
  noMoreMessage?: string;
};

export function LoadMore<T extends { id: string | number }>({
  initialItems,
  fetchUrl,
  pageSize = 20,
  renderItem,
  className = "",
  emptyMessage = "Öğe bulunamadı.",
  noMoreMessage = "Tüm öğeler gösterildi.",
}: LoadMoreProps<T>) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${fetchUrl}?page=${page + 1}&limit=${pageSize}`
      );
      const data = await res.json();
      const newItems = data.items || [];
      if (newItems.length < pageSize) {
        setHasMore(false);
      }
      setItems((prev) => [...prev, ...newItems]);
      setPage((p) => p + 1);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [fetchUrl, page, pageSize, loading, hasMore]);

  useEffect(() => {
    setItems(initialItems);
    setPage(1);
    setHasMore(initialItems.length >= pageSize);
  }, [initialItems, pageSize]);

  if (items.length === 0) {
    return (
      <div className={`py-12 text-center text-muted-foreground ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={item.id}>{renderItem(item, index)}</div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={loadMore}
            disabled={loading}
            className="min-w-[200px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Yükleniyor...
              </>
            ) : (
              <>
                Daha Fazla
                <ChevronDown className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          {noMoreMessage}
        </p>
      )}
    </div>
  );
}
