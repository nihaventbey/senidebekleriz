"use client";

import { useEffect, useState, useCallback } from "react";

export type BookmarkItem = {
  id: string;
  title: string;
  slug: string;
  type: "article" | "place" | "city" | "event" | "news";
  coverImage?: string | null;
  cityName?: string | null;
  status?: "visited" | "bucketlist"; // "Gezdim" vs "Hedefim"
  savedAt?: string;
};

const STORAGE_KEY = "senidebekleriz_bookmarks";
const CHANGE_EVENT = "sdb-bookmarks-changed";

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const sync = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setBookmarks(JSON.parse(stored));
      } else {
        setBookmarks([]);
      }
    } catch (err) {
      console.error("Error reading bookmarks:", err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    sync();

    function handleStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) sync();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(CHANGE_EVENT, sync);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(CHANGE_EVENT, sync);
    };
  }, [sync]);

  function saveBookmarks(items: BookmarkItem[]) {
    setBookmarks(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch (err) {
      console.error("Error saving bookmarks:", err);
    }
  }

  function addBookmark(item: BookmarkItem, defaultStatus: "visited" | "bucketlist" = "bucketlist") {
    if (bookmarks.some((b) => b.id === item.id)) return;
    const newItem: BookmarkItem = {
      ...item,
      status: item.status || defaultStatus,
      savedAt: new Date().toISOString(),
    };
    saveBookmarks([...bookmarks, newItem]);
  }

  function removeBookmark(id: string) {
    saveBookmarks(bookmarks.filter((b) => b.id !== id));
  }

  function toggleBookmark(item: BookmarkItem) {
    if (bookmarks.some((b) => b.id === item.id)) {
      removeBookmark(item.id);
    } else {
      addBookmark(item);
    }
  }

  function updateStatus(id: string, status: "visited" | "bucketlist") {
    saveBookmarks(
      bookmarks.map((b) => (b.id === id ? { ...b, status } : b))
    );
  }

  function isBookmarked(id: string): boolean {
    return bookmarks.some((b) => b.id === id);
  }

  function getItemStatus(id: string): "visited" | "bucketlist" | null {
    const item = bookmarks.find((b) => b.id === id);
    return item?.status || null;
  }

  const visitedCount = bookmarks.filter((b) => b.status === "visited").length;
  const bucketlistCount = bookmarks.filter((b) => b.status !== "visited").length;

  return {
    bookmarks,
    isLoaded,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    updateStatus,
    isBookmarked,
    getItemStatus,
    visitedCount,
    bucketlistCount,
  };
}
