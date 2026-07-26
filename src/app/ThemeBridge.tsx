"use client";

import { Moon, Sparkles, Sun, Sunrise, Sunset } from "lucide-react";
import { useEffect, useState } from "react";
import { getNextTheme, getThemeLabel, getTimeTheme, type DisplayTheme } from "@/lib/dates";
import { STORAGE_KEYS, type ThemeMode } from "@/lib/storage";

function normalizeTheme(value: unknown): ThemeMode {
  if (value === "classic" || value === "auto" || value === "morning" || value === "day" || value === "evening" || value === "night") {
    return value;
  }
  return "classic";
}

function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "classic";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) return "classic";
    const parsed = JSON.parse(raw) as { themeMode?: unknown };
    return normalizeTheme(parsed.themeMode);
  } catch {
    return "classic";
  }
}

function writeStoredTheme(themeMode: ThemeMode) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.settings);
    const parsed = raw ? JSON.parse(raw) : {};
    window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify({ ...parsed, themeMode }));
  } catch {
    window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify({ themeMode }));
  }
}

function resolveTheme(themeMode: ThemeMode): DisplayTheme {
  return themeMode === "auto" ? getTimeTheme() : themeMode;
}

function applyTheme(themeMode: ThemeMode) {
  if (typeof document === "undefined") return;
  document.body.dataset.theme = resolveTheme(themeMode);
}

function ThemeIcon({ theme }: { theme: DisplayTheme }) {
  if (theme === "classic") return <Sparkles size={18} />;
  if (theme === "morning") return <Sunrise size={18} />;
  if (theme === "day") return <Sun size={18} />;
  if (theme === "evening") return <Sunset size={18} />;
  return <Moon size={18} />;
}

export default function ThemeBridge() {
  const [themeMode, setThemeMode] = useState<ThemeMode>("classic");
  const [toast, setToast] = useState("");

  useEffect(() => {
    const stored = readStoredTheme();
    setThemeMode(stored);
    applyTheme(stored);
  }, []);

  function cycleTheme() {
    const nextTheme = getNextTheme(resolveTheme(themeMode)) as ThemeMode;
    setThemeMode(nextTheme);
    writeStoredTheme(nextTheme);
    applyTheme(nextTheme);
    setToast(`เปลี่ยนเป็น ${getThemeLabel(nextTheme)}`);
    window.setTimeout(() => setToast(""), 1400);
  }

  const resolvedTheme = resolveTheme(themeMode);

  return (
    <>
      <div className="theme-fab-wrap" aria-label="เปลี่ยนธีม">
        <button className="theme-fab" onClick={cycleTheme} aria-label="เปลี่ยนธีม" title={getThemeLabel(resolvedTheme)}>
          <ThemeIcon theme={resolvedTheme} />
        </button>
      </div>
      {toast && <div className="theme-fab-toast">{toast}</div>}
    </>
  );
}
