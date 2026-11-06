"use client";

import { useSyncExternalStore } from "react";

import {
  getPinsSnapshot,
  getServerPinsSnapshot,
  subscribePins,
} from "@/lib/pins";

export function usePins(): string[] {
  return useSyncExternalStore(
    subscribePins,
    getPinsSnapshot,
    getServerPinsSnapshot,
  );
}
