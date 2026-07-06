"use client";

import { createContext, useContext } from "react";
import type { AdPlacementConfig } from "@/lib/data/ad-placements";

const AdPlacementsContext = createContext<Record<string, AdPlacementConfig>>({});

export function AdPlacementsProvider({
  slots,
  children,
}: {
  slots: Record<string, AdPlacementConfig>;
  children: React.ReactNode;
}) {
  return (
    <AdPlacementsContext.Provider value={slots}>
      {children}
    </AdPlacementsContext.Provider>
  );
}

export function useAdPlacement(slot: string): AdPlacementConfig | undefined {
  return useContext(AdPlacementsContext)[slot];
}
