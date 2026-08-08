"use client";

import { useBookmarks, type BookmarkItem } from "@/lib/hooks/use-bookmarks";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "@/lib/toast";

type Props = {
  item: BookmarkItem;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
};

export function BookmarkButton({
  item,
  variant = "outline",
  size = "sm",
  className,
}: Props) {
  const { isBookmarked, toggleBookmark, isLoaded } = useBookmarks();
  const bookmarked = isLoaded && isBookmarked(item.id);

  function handleClick() {
    toggleBookmark(item);
    if (!bookmarked) {
      toast.success("Gezi Listene Eklendi ❤️", `"${item.title}" kaydettiklerinize eklendi.`);
    } else {
      toast.info("Gezi Listenizden Çıkarıldı", `"${item.title}" favorilerinizden kaldırıldı.`);
    }
  }

  return (
    <Button
      variant={bookmarked ? "default" : variant}
      size={size}
      onClick={handleClick}
      className={`gap-1.5 transition-all ${
        bookmarked
          ? "bg-rose-600 text-white hover:bg-rose-700 border-rose-600 shadow-sm"
          : "hover:text-rose-600 hover:border-rose-300"
      } ${className || ""}`}
      title={bookmarked ? "Gezi listenden çıkar" : "Gezi listeme ekle"}
    >
      <Heart className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
      <span>{bookmarked ? "Kaydedildi" : "Gezi Listeme Ekle"}</span>
    </Button>
  );
}
