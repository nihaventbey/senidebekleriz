type PlacePhotosGalleryProps = {
  photos: string[];
  placeName: string;
};

export function PlacePhotosGallery({ photos, placeName }: PlacePhotosGalleryProps) {
  const uniquePhotos = [...new Set(photos.filter(Boolean))];
  if (uniquePhotos.length === 0) return null;

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm md:p-8">
      <h2 className="mb-4 text-xl font-bold">Fotoğraflar</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {uniquePhotos.map((url) => (
          <div
            key={url}
            className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted"
          >
            <img
              src={url}
              alt={placeName}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
