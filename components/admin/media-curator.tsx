"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Lock,
  Unlock,
  Trash2,
  ExternalLink,
  Upload,
  Link2,
  Sparkles,
  Check,
  ChevronLeft,
  ChevronRight,
  Grid,
  Maximize2,
  Loader2,
  Building2,
  MapPinned,
  Image as ImageIcon,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";

type City = { id: string; name: string; slug: string };


type MediaItem = {
  id: string;
  name: string;
  slug: string;
  cover_image: string | null;
  cover_image_source: string | null;
  cover_image_locked: boolean;
  updated_at?: string;
  city_id?: string;
  cities?: { id: string; name: string; slug: string } | null;
  region?: string;
};

type Props = {
  initialCities: City[];
};

export function MediaCurator({ initialCities }: Props) {
  const [entityType, setEntityType] = useState<"places" | "cities">("places");
  const [selectedCityId, setSelectedCityId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "focus">("grid");

  const [items, setItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  // Focus mode active index
  const [focusIndex, setFocusIndex] = useState(0);

  // URL dialog state
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [activeItemForUrl, setActiveItemForUrl] = useState<MediaItem | null>(null);
  const [inputImageUrl, setInputImageUrl] = useState("");
  const [savingUrl, setSavingUrl] = useState(false);

  // Wiki suggestions state
  const [wikiDialogOpen, setWikiDialogOpen] = useState(false);
  const [activeItemForWiki, setActiveItemForWiki] = useState<MediaItem | null>(null);
  const [wikiSuggestions, setWikiSuggestions] = useState<{ url: string; title: string }[]>([]);
  const [loadingWiki, setLoadingWiki] = useState(false);

  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch items
  const fetchItems = useCallback(
    async (targetPage = 1, append = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          type: entityType,
          cityId: selectedCityId,
          status: statusFilter,
          query: debouncedQuery,
          page: targetPage.toString(),
          limit: "24",
        });

        const res = await fetch(`/api/admin/curate-image?${params.toString()}`);
        if (!res.ok) throw new Error("Görseller yüklenemedi");

        const data = await res.json();
        if (append) {
          setItems((prev) => [...prev, ...(data.items || [])]);
        } else {
          setItems(data.items || []);
          setFocusIndex(0);
        }
        setTotal(data.total || 0);
        setHasMore(data.hasMore || false);
        setPage(targetPage);
      } catch (err: any) {
        toast.error(err.message || "Veriler alınırken hata oluştu");
      } finally {
        setLoading(false);
      }
    },
    [entityType, selectedCityId, statusFilter, debouncedQuery]
  );

  useEffect(() => {
    fetchItems(1, false);
  }, [fetchItems]);

  // Actions
  const handleToggleLock = async (item: MediaItem) => {
    const newLock = !item.cover_image_locked;
    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, cover_image_locked: newLock } : i))
    );

    try {
      const res = await fetch("/api/admin/curate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle-lock",
          type: entityType,
          id: item.id,
          locked: newLock,
        }),
      });
      if (!res.ok) throw new Error("Kilitleme güncellenemedi");
      toast.success(newLock ? "Görsel onaylandı ve kilitlendi 🔒" : "Kilit kaldırıldı 🔓");
    } catch (err: any) {
      // Revert optimistic update
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, cover_image_locked: !newLock } : i))
      );
      toast.error(err.message || "İşlem başarısız");
    }
  };

  const handleClearImage = async (item: MediaItem) => {
    if (!confirm(`"${item.name}" görselini kaldırmak istediğinize emin misiniz?`)) return;

    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, cover_image: null, cover_image_source: null, cover_image_locked: false }
          : i
      )
    );

    try {
      const res = await fetch("/api/admin/curate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "clear-image",
          type: entityType,
          id: item.id,
          slug: item.slug,
          citySlug: item.cities?.slug,
        }),
      });
      if (!res.ok) throw new Error("Görsel silinemedi");
      toast.success("Görsel başarıyla kaldırıldı 🗑️");
    } catch (err: any) {
      toast.error(err.message || "İşlem başarısız");
      fetchItems(page, false);
    }
  };

  const handleSaveUrl = async () => {
    if (!activeItemForUrl || !inputImageUrl.trim()) return;

    setSavingUrl(true);
    const url = inputImageUrl.trim();

    try {
      const res = await fetch("/api/admin/curate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-image",
          type: entityType,
          id: activeItemForUrl.id,
          slug: activeItemForUrl.slug,
          citySlug: activeItemForUrl.cities?.slug,
          imageUrl: url,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Görsel kaydedilemedi");
      }

      setItems((prev) =>
        prev.map((i) =>
          i.id === activeItemForUrl.id
            ? { ...i, cover_image: url, cover_image_source: "manual", cover_image_locked: true }
            : i
        )
      );

      toast.success("Görsel başarıyla güncellendi ve kilitlendi! ✅");
      setUrlDialogOpen(false);
      setInputImageUrl("");
    } catch (err: any) {
      toast.error(err.message || "Görsel kaydedilemedi");
    } finally {
      setSavingUrl(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, item: MediaItem) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingItemId(item.id);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", entityType);
    formData.append("slug", item.slug);

    try {
      const uploadRes = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.error || "Yükleme başarısız");
      }

      const { url } = await uploadRes.json();

      // Update item in database
      const updateRes = await fetch("/api/admin/curate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-image",
          type: entityType,
          id: item.id,
          slug: item.slug,
          citySlug: item.cities?.slug,
          imageUrl: url,
        }),
      });

      if (!updateRes.ok) throw new Error("Görsel mekana kaydedilemedi");

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, cover_image: url, cover_image_source: "manual", cover_image_locked: true }
            : i
        )
      );

      toast.success("Görsel yüklendi ve kilitlendi! 📸");
    } catch (err: any) {
      toast.error(err.message || "Yükleme hatası");
    } finally {
      setUploadingItemId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleOpenWikiSuggestions = async (item: MediaItem) => {
    setActiveItemForWiki(item);
    setWikiDialogOpen(true);
    setLoadingWiki(true);
    setWikiSuggestions([]);

    const cityName = item.cities?.name || "";
    const searchQuery = `${item.name} ${cityName}`.trim();

    try {
      const res = await fetch(
        `/api/admin/curate-image?action=wiki-suggest&query=${encodeURIComponent(searchQuery)}`
      );
      if (!res.ok) throw new Error("Öneriler alınamadı");
      const data = await res.json();
      setWikiSuggestions(data.suggestions || []);
    } catch (err: any) {
      toast.error("Wikipedia görseli bulunamadı");
    } finally {
      setLoadingWiki(false);
    }
  };

  const handleApplyWikiSuggestion = async (url: string) => {
    if (!activeItemForWiki) return;

    try {
      const res = await fetch("/api/admin/curate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-image",
          type: entityType,
          id: activeItemForWiki.id,
          slug: activeItemForWiki.slug,
          citySlug: activeItemForWiki.cities?.slug,
          imageUrl: url,
        }),
      });

      if (!res.ok) throw new Error("Görsel uygulanamadı");

      setItems((prev) =>
        prev.map((i) =>
          i.id === activeItemForWiki.id
            ? { ...i, cover_image: url, cover_image_source: "manual", cover_image_locked: true }
            : i
        )
      );

      toast.success("Wikipedia görseli uygulandı ve kilitlendi! 🏛️");
      setWikiDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Görsel uygulanamadı");
    }
  };

  const getGoogleSearchUrl = (item: MediaItem) => {
    const cityName = item.cities?.name || "";
    const q = `${item.name} ${cityName}`.trim();
    return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`;
  };

  // Keyboard navigation for Focus Mode
  useEffect(() => {
    if (viewMode !== "focus" || items.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (urlDialogOpen || wikiDialogOpen) return;

      if (e.key === "ArrowRight") {
        setFocusIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowLeft") {
        setFocusIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key.toLowerCase() === "l") {
        const cur = items[focusIndex];
        if (cur) handleToggleLock(cur);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, items, focusIndex, urlDialogOpen, wikiDialogOpen]);

  const currentFocusItem = items[focusIndex] || null;

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Entity Selector (Places vs Cities) */}
          <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1">
            <button
              onClick={() => {
                setEntityType("places");
                setPage(1);
              }}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                entityType === "places"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MapPinned className="h-4 w-4 text-primary" />
              <span>Mekan Görselleri</span>
            </button>
            <button
              onClick={() => {
                setEntityType("cities");
                setPage(1);
              }}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                entityType === "cities"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="h-4 w-4 text-primary" />
              <span>Şehir Kapakları (81 İl)</span>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Grid Görünümü"
            >
              <Grid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode("focus")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                viewMode === "focus"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Focus / Hızlı İnceleme Modu"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sırayla İncele</span>
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-12">
          {/* City Filter (Only for Places) */}
          {entityType === "places" && (
            <div className="lg:col-span-3">
              <Select
                value={selectedCityId}
                onValueChange={(v) => {
                  if (v) {
                    setSelectedCityId(v);
                    setPage(1);
                  }
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Tüm Şehirler" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="all">Tüm Şehirler (81 İl)</SelectItem>
                  {initialCities.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Status Filter */}
          <div className={entityType === "places" ? "lg:col-span-3" : "lg:col-span-4"}>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                if (v) {
                  setStatusFilter(v);
                  setPage(1);
                }
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Görsel Durumu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="no-cover">⚠️ Görselsiz (Eksik)</SelectItem>
                <SelectItem value="auto">🌐 Wikimedia / Otomatik Çekilmiş</SelectItem>
                <SelectItem value="locked">🔒 Kilitli & Onaylı</SelectItem>
              </SelectContent>
            </Select>
          </div>


          {/* Search Input */}
          <div className={entityType === "places" ? "lg:col-span-6" : "lg:col-span-8"}>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={entityType === "places" ? "Mekan adı ile hızlı ara..." : "Şehir adı ara..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 text-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Count Summary */}
        <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <span>
            Toplam <strong>{total.toLocaleString("tr-TR")}</strong> kayıt bulundu
          </span>
          {viewMode === "focus" && items.length > 0 && (
            <span className="font-medium text-foreground">
              {focusIndex + 1} / {items.length} (Klavye: ⬅️ ➡️ Ok Tuşları, &apos;L&apos; Kilitle)
            </span>
          )}
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Görseller yükleniyor...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 py-20 text-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="text-base font-semibold">Kayıt Bulunamadı</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Seçilen filtre kriterlerine uygun mekan veya şehir görseli bulunamadı.
          </p>
        </div>
      )}

      {/* FOCUS / SLIDE REVIEW MODE */}
      {viewMode === "focus" && currentFocusItem && (
        <div className="mx-auto max-w-3xl">
          <Card className="overflow-hidden border-border/60 shadow-md">
            {/* Focus Image Area */}
            <div className="relative flex aspect-video w-full items-center justify-center bg-black/80">
              {currentFocusItem.cover_image ? (
                <img
                  src={currentFocusItem.cover_image}
                  alt={currentFocusItem.name}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 text-amber-500/80" />
                  <p className="text-sm font-medium text-white/80">Görsel Henüz Eklenmemiş</p>
                </div>
              )}

              {/* Status Badges on Image */}
              <div className="absolute left-3 top-3 flex items-center gap-2">
                {currentFocusItem.cover_image_locked ? (
                  <Badge className="bg-emerald-600 text-white shadow-sm gap-1 text-xs">
                    <Lock className="h-3 w-3" /> Onaylı & Kilitli
                  </Badge>
                ) : currentFocusItem.cover_image ? (
                  <Badge variant="secondary" className="bg-black/60 text-white/90 backdrop-blur-xs gap-1 text-xs">
                    {currentFocusItem.cover_image_source === "manual" ? "Manuel" : "Wikimedia / Otomatik"}
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    Görselsiz
                  </Badge>
                )}

                {currentFocusItem.cities?.name && (
                  <Badge variant="outline" className="bg-black/50 text-white border-white/20 text-xs">
                    {currentFocusItem.cities.name}
                  </Badge>
                )}
              </div>
            </div>

            {/* Focus Card Details & Actions */}
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">
                    {currentFocusItem.name}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Slug: <code className="text-xs">{currentFocusItem.slug}</code>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={entityType === "places" ? `/mekan/${currentFocusItem.slug}` : `/sehir/${currentFocusItem.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                  >
                    Canlıda Gör
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {/* 1. Google Search Button */}
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full text-xs font-medium gap-1.5"
                >
                  <a href={getGoogleSearchUrl(currentFocusItem)} target="_blank" rel="noopener noreferrer">
                    <Search className="h-3.5 w-3.5 text-blue-500" />
                    Google Görseller
                  </a>
                </Button>

                {/* 2. Wiki Suggestions */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenWikiSuggestions(currentFocusItem)}
                  className="w-full text-xs font-medium gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  Wiki Önerisi
                </Button>

                {/* 3. Paste URL */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveItemForUrl(currentFocusItem);
                    setInputImageUrl(currentFocusItem.cover_image || "");
                    setUrlDialogOpen(true);
                  }}
                  className="w-full text-xs font-medium gap-1.5"
                >
                  <Link2 className="h-3.5 w-3.5 text-purple-500" />
                  URL Yapıştır
                </Button>

                {/* 4. Lock / Approve */}
                <Button
                  variant={currentFocusItem.cover_image_locked ? "secondary" : "default"}
                  size="sm"
                  onClick={() => handleToggleLock(currentFocusItem)}
                  className="w-full text-xs font-medium gap-1.5"
                >
                  {currentFocusItem.cover_image_locked ? (
                    <>
                      <Unlock className="h-3.5 w-3.5" /> Kilidi Aç
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" /> Onayla & Kilitle
                    </>
                  )}
                </Button>

                {/* 5. Clear Image */}
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={!currentFocusItem.cover_image}
                  onClick={() => handleClearImage(currentFocusItem)}
                  className="w-full text-xs font-medium gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Görseli Sil
                </Button>
              </div>

              {/* Navigation Arrows */}
              <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={focusIndex === 0}
                  onClick={() => setFocusIndex((prev) => prev - 1)}
                  className="gap-1.5 text-xs"
                >
                  <ChevronLeft className="h-4 w-4" /> Önceki Mekan
                </Button>

                <span className="text-xs text-muted-foreground">
                  {focusIndex + 1} / {items.length}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={focusIndex === items.length - 1}
                  onClick={() => setFocusIndex((prev) => prev + 1)}
                  className="gap-1.5 text-xs"
                >
                  Sonraki Mekan <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* GRID VIEW MODE */}
      {viewMode === "grid" && items.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <Card
              key={item.id}
              className={`group flex h-full flex-col justify-between overflow-hidden border-border/60 transition-all hover:shadow-md ${
                item.cover_image_locked ? "ring-1 ring-emerald-500/40" : ""
              }`}
            >
              {/* Image Thumbnail & Overlay */}
              <div className="relative aspect-video w-full bg-muted/60 overflow-hidden">
                {item.cover_image ? (
                  <img
                    src={item.cover_image}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-muted-foreground/60 bg-muted/40">
                    <ImageIcon className="h-8 w-8" />
                    <span className="text-[11px]">Görsel Yok</span>
                  </div>
                )}

                {/* Status Badges */}
                <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
                  {item.cover_image_locked ? (
                    <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 gap-1 shadow-xs">
                      <Lock className="h-2.5 w-2.5" /> Kilitli
                    </Badge>
                  ) : item.cover_image ? (
                    <Badge
                      variant="secondary"
                      className="bg-black/65 text-white/90 backdrop-blur-xs text-[10px] px-1.5 py-0.5"
                    >
                      {item.cover_image_source === "manual" ? "Manuel" : "Otomatik"}
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
                      Görselsiz
                    </Badge>
                  )}
                </div>

                {/* City Tag */}
                {item.cities?.name && (
                  <div className="absolute right-2.5 top-2.5">
                    <Badge variant="outline" className="bg-black/60 text-white/90 border-white/20 text-[10px]">
                      {item.cities.name}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Title & Info */}
              <CardContent className="p-4 pb-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold leading-snug line-clamp-1 text-foreground" title={item.name}>
                    {item.name}
                  </h3>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="truncate max-w-[140px]">{item.cities?.name || item.region || item.slug}</span>
                    <Link
                      href={entityType === "places" ? `/mekan/${item.slug}` : `/sehir/${item.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-0.5 text-primary hover:underline"
                    >
                      Görüntüle
                      <ExternalLink className="h-2.5 w-2.5" />
                    </Link>
                  </div>
                </div>

                {/* Quick Action Grid */}
                <div className="mt-4 border-t border-border/60 pt-3 space-y-2">
                  <div className="flex items-center gap-1.5">
                    {/* Google Search Link */}
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="h-7 flex-1 px-2 text-[11px] font-normal text-muted-foreground hover:text-foreground"
                      title="Google Görsellerde Ara"
                    >
                      <a href={getGoogleSearchUrl(item)} target="_blank" rel="noopener noreferrer">
                        <Search className="h-3 w-3 mr-1 text-blue-500" />
                        Google
                      </a>
                    </Button>

                    {/* Wiki Suggestion */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenWikiSuggestions(item)}
                      className="h-7 flex-1 px-2 text-[11px] font-normal text-muted-foreground hover:text-foreground"
                      title="Wikipedia Önerilerini Getir"
                    >
                      <Sparkles className="h-3 w-3 mr-1 text-amber-500" />
                      Wiki
                    </Button>

                    {/* Paste URL */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveItemForUrl(item);
                        setInputImageUrl(item.cover_image || "");
                        setUrlDialogOpen(true);
                      }}
                      className="h-7 flex-1 px-2 text-[11px] font-normal text-muted-foreground hover:text-foreground"
                      title="URL ile Güncelle"
                    >
                      <Link2 className="h-3 w-3 mr-1 text-purple-500" />
                      URL
                    </Button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Lock / Approve Toggle */}
                    <Button
                      variant={item.cover_image_locked ? "secondary" : "default"}
                      size="sm"
                      onClick={() => handleToggleLock(item)}
                      className="h-7 flex-1 px-2 text-[11px] font-medium"
                    >
                      {item.cover_image_locked ? (
                        <>
                          <Unlock className="h-3 w-3 mr-1" /> Kilit Aç
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3 mr-1" /> Onayla
                        </>
                      )}
                    </Button>

                    {/* Clear Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!item.cover_image}
                      onClick={() => handleClearImage(item)}
                      className="h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      title="Görseli Sil"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Load More Button for Grid Mode */}
      {viewMode === "grid" && hasMore && (
        <div className="flex justify-center pt-6">
          <Button
            variant="outline"
            onClick={() => fetchItems(page + 1, true)}
            disabled={loading}
            className="px-8 text-xs font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Yükleniyor...
              </>
            ) : (
              "Daha Fazla Göster"
            )}
          </Button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
      />

      {/* URL Input Modal */}
      {urlDialogOpen && activeItemForUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border/60 bg-background p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <h3 className="text-base font-bold text-foreground">
                Görsel URL Yapıştır & Onayla
              </h3>
              <button
                onClick={() => setUrlDialogOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 py-4">
              <p className="text-xs text-muted-foreground">
                <strong>{activeItemForUrl.name}</strong> için web üzerinden kopyaladığınız doğrudan resim linkini (jpg, png, webp) yapıştırın:
              </p>
              <Input
                type="url"
                placeholder="https://images.unsplash.com/... veya doğrudan resim URL'si"
                value={inputImageUrl}
                onChange={(e) => setInputImageUrl(e.target.value)}
                className="text-xs"
                autoFocus
              />
              {inputImageUrl && (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted/40">
                  <img
                    src={inputImageUrl}
                    alt="Önizleme"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUrlDialogOpen(false)}
                className="text-xs"
              >
                Vazgeç
              </Button>
              <Button
                size="sm"
                onClick={handleSaveUrl}
                disabled={savingUrl || !inputImageUrl.trim()}
                className="text-xs font-semibold"
              >
                {savingUrl ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    Kaydet ve Kilitle
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Wikipedia Suggestions Modal */}
      {wikiDialogOpen && activeItemForWiki && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border/60 bg-background p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <h3 className="text-base font-bold text-foreground">
                  Wikipedia Görsel Önerileri
                </h3>
              </div>
              <button
                onClick={() => setWikiDialogOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 py-4">
              <p className="text-xs text-muted-foreground">
                <strong>{activeItemForWiki.name}</strong> için Wikipedia veritabanında bulunan alternatif görseller:
              </p>

              {loadingWiki && (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                  <p className="text-xs text-muted-foreground">Wikipedia aranıyor...</p>
                </div>
              )}

              {!loadingWiki && wikiSuggestions.length === 0 && (
                <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                  Bu mekan için Wikipedia&apos;da alternatif fotoğraf bulunamadı. Lütfen Google Görseller butonunu kullanarak görsel bağlantısı yapıştırın.
                </div>
              )}

              {!loadingWiki && wikiSuggestions.length > 0 && (
                <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                  {wikiSuggestions.map((sug, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleApplyWikiSuggestion(sug.url)}
                      className="group relative cursor-pointer overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:border-primary hover:shadow-md"
                    >
                      <div className="aspect-video w-full overflow-hidden bg-muted">
                        <img
                          src={sug.url}
                          alt={sug.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      <div className="p-2 text-center">
                        <p className="text-[11px] font-semibold text-primary group-hover:underline">
                          Bu Görseli Seç ✅
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWikiDialogOpen(false)}
                className="text-xs"
              >
                Kapat
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

