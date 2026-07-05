"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";

type ArticleImageGalleryProps = {
  images: string[];
  coverImage?: string;
  onSetCover?: (url: string) => void;
  className?: string;
};

export function ArticleImageGallery({
  images,
  coverImage,
  onSetCover,
  className,
}: ArticleImageGalleryProps) {
  if (images.length === 0) return null;

  return (
    <div className={cn("rounded-lg border bg-muted/20 p-4", className)}>
      <h3 className="text-sm font-semibold">Görseller ({images.length})</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Kapak ve içerikteki görseller. Bir görseli kapak yapmak için üzerindeki
        butonu kullanın.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((url) => {
          const isCover = coverImage === url;
          return (
            <figure
              key={url}
              className={cn(
                "overflow-hidden rounded-lg border bg-background",
                isCover && "ring-2 ring-primary"
              )}
            >
              <img
                src={url}
                alt=""
                className="aspect-video w-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <figcaption className="space-y-2 p-2">
                {isCover ? (
                  <span className="inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Kapak görseli
                  </span>
                ) : onSetCover ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onSetCover(url)}
                  >
                    <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
                    Kapak yap
                  </Button>
                ) : null}
                <p className="line-clamp-1 break-all text-[11px] text-muted-foreground">
                  {url}
                </p>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
