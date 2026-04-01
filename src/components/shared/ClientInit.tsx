"use client";

import { useEffect } from "react";
import { seedIfEmpty } from "@/lib/db";
import { useAppStore } from "@/lib/store";
import { applyTheme, getTheme } from "@/lib/themes";

export function ClientInit() {
  const loadSettings  = useAppStore((s) => s.loadSettings);
  const zodiacTheme   = useAppStore((s) => s.settings.zodiacTheme);

  useEffect(() => {
    seedIfEmpty();
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    applyTheme(getTheme(zodiacTheme));
  }, [zodiacTheme]);

  return null;
}
