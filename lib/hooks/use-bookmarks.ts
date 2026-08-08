"use client";

import { useEffect, useState } from "react";

export type BookmarkItem = {
  id: string;
  title: string;
  slug: string;
  type: "article" | "place" | "city";
  coverImage?: string | null;
  cityName?: string | null;
};

const STORAGE_KEY = "senidebekleriz_bookmarks";

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setBookmarks(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Error reading bookmarks:", err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  function saveBookmarks(items: BookmarkItem[]) {
    setBookmarks(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error("Error saving bookmarks:", err);
    }
  }

  function addBookmark(item: BookmarkItem) {
    if (bookmarks.some((b) => b.id === item.id)) return;
    saveBookmarks([...bookmarks, item]);
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

  function isBookmarked(id: string): boolean {
    return bookmarks.some((b) => b.id === id);
  }

  return {
    bookmarks,
    isLoaded,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    isBookmarked,
  };
}
