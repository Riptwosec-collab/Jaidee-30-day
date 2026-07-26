"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getTimeTheme } from "@/lib/dates";
import { STORAGE_KEYS, type ThemeMode } from "@/lib/storage";

const themeOptions: Array<{ value: ThemeMode; label: string; note: string }> = [
  { value: "classic", label: "ธีมดั้งเดิม", note: "โทนอุ่นอ่านชัด" },
  { value: "auto", label: "อัตโนมัติ", note: "เปลี่ยนตามเวลา" },
  { value: "morning", label: "เช้า", note: "ครีมสว่าง" },
  { value: "day", label: "กลางวัน", note: "ฟ้าอ่อน" },
  { value: "evening", label: "เย็น", note: "พีชอบอุ่น" },
  { value: "night", label: "กลางคืน", note: "ม่วงเข้ม" },
];

function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "classic";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) return "classic";
    const parsed = JSON.parse(raw) as { themeMode?: ThemeMode };
    return parsed.themeMode ?? "classic";
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

function applyTheme(themeMode: ThemeMode) {
  if (typeof document === "undefined") return;
  const resolved = themeMode === "auto" ? getTimeTheme() : themeMode;
  document.body.dataset.theme = resolved;
}

export default function ThemeBridge() {
  const [open, setOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("classic");

  useEffect(() => {
    const stored = readStoredTheme();
    setThemeMode(stored);
    applyTheme(stored);
  }, []);

  function chooseTheme(nextTheme: ThemeMode) {
    setThemeMode(nextTheme);
    writeStoredTheme(nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <div className="theme-bridge" aria-label="ตัวช่วยธีมและคู่มือ">
      <button className="theme-bridge-button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        ธีม/คู่มือ
      </button>

      {open && (
        <section className="theme-bridge-panel">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="theme-bridge-kicker">อ่านชัดทุกธีม</p>
              <h2>เลือกธีม</h2>
            </div>
            <button className="theme-bridge-close" onClick={() => setOpen(false)} aria-label="ปิด">×</button>
          </div>

          <div className="theme-bridge-grid">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                className={themeMode === option.value ? "active" : ""}
                onClick={() => chooseTheme(option.value)}
              >
                <strong>{option.label}</strong>
                <small>{option.note}</small>
              </button>
            ))}
          </div>

          <Link className="theme-bridge-guide" href="/guide" onClick={() => setOpen(false)}>
            เปิดคู่มือการใช้งาน
          </Link>
        </section>
      )}
    </div>
  );
}
