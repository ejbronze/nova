"use client";

import { useEffect } from "react";
import { seedIfEmpty } from "@/lib/db";
import { useAppStore } from "@/lib/store";

export function ClientInit() {
  const loadSettings = useAppStore((s) => s.loadSettings);

  useEffect(() => {
    seedIfEmpty();
    loadSettings();
  }, [loadSettings]);

  return null;
}
