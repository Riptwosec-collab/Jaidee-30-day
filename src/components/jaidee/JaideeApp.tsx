"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BookHeart,
  CalendarDays,
  CheckCircle2,
  Download,
  Heart,
  Home,
  Moon,
  RefreshCcw,
  Share2,
  Sparkles,
  UserRound,
  Volume2,
  Wind,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { encouragementDays, getEncouragementDay } from "@/data/encouragement";
import { downloadDataUrl, createShareCard, type ShareCardSize } from "@/lib/shareCard";
import { formatThaiDate, getTimeGreeting, getUnlockedDay } from "@/lib/dates";
import {
  buildExportPayload,
  createDefaultEntry,
  createDefaultProfile,
  type DailyEntry,
  type UserProfile,
  type UserSettings,
  readDailyEntries,
  readOnboardingDone,
  readProfile,
  readSettings,
  resetAllData,
  validateImportPayload,
  writeDailyEntries,
  writeOnboardingDone,
  writeProfile,
  writeSettings,
} from "@/lib/storage";

type Tab = "today" | "calendar" | "journal" | "me";

const moodOptions = [
  { value: 1, emoji: "😔", label: "เหนื่อยมาก", response: "วันนี้อาจหนักไปหน่อย คุณไม่จำเป็นต้องเข้มแข็งตลอดเวลาก็ได้" },
  { value: 2, emoji: "😐", label: "เฉย ๆ", response: "วันที่ธรรมดาก็มีความหมายเหมือนกัน" },
  { value: 3, emoji: "🙂", label: "เริ่มดีขึ้น", response: "ดีใจที่หัวใจคุณเริ่มเบาลงอีกนิด" },
  { value: 4, emoji: "😊", label: "รู้สึกดี", response: "เก็บช่วงเวลาดี ๆ นี้ไว้กับตัวเองนะ" },
  { value: 5, emoji: "🤩", label: "ดีมาก", response: "วันนี้หัวใจของคุณกำลังเปล่งประกายเลย" },
] as const;

const navItems = [
  { key: "today", label: "วันนี้", icon: Home },
  { key: "calendar", label: "30 วัน", icon: CalendarDays },
  { key: "journal", label: "บันทึกใจ", icon: BookHeart },
  { key: "me", label: "ตัวฉัน", icon: UserRound },
] as const;

function entryFor(entries: Record<number, DailyEntry>, day: number): DailyEntry {
  return entries[day] ?? createDefaultEntry(day);
}

export default function JaideeApp() {
  const [ready, setReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(true);
  const [tab, setTab] = useState<Tab>("today");
  const [profile, setProfile] = useState<UserProfile>(() => createDefaultProfile());
  const [settings, setSettings] = useState<UserSettings>(() => readSettings());
  const [entries, setEntries] = useState<Record<number, DailyEntry>>({});
  const [selectedDay, setSelectedDay] = useState(1);
  const [toast, setToast] = useState("พื้นที่เล็ก ๆ สำหรับหัวใจของคุณ");
  const [breathingOpen, setBreathingOpen] = useState(false);
  const [shareSize, setShareSize] = useState<ShareCardSize>("story");

  useEffect(() => {
    const nextProfile = readProfile();
    const nextSettings = readSettings();
    const nextEntries = readDailyEntries();
    setProfile(nextProfile);
    setSettings(nextSettings);
    setEntries(nextEntries);
    setOnboardingDone(readOnboardingDone());
    setSelectedDay(getUnlockedDay(nextProfile.startDate, nextSettings.demoMode));
    setReady(true);
    const timer = window.setTimeout(() => setShowSplash(false), 900);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", settings.darkMode);
    document.documentElement.style.fontSize = `${settings.fontScale * 100}%`;
  }, [settings.darkMode, settings.fontScale]);

  const unlockedDay = useMemo(() => getUnlockedDay(profile.startDate, settings.demoMode), [profile.startDate, settings.demoMode]);
  const currentDay = getEncouragementDay(Math.min(selectedDay, unlockedDay));
  const currentEntry = entryFor(entries, currentDay.day);
  const completedCount = useMemo(() => Object.values(entries).filter((entry) => entry.completed).length, [entries]);
  const favoriteCount = useMemo(() => Object.values(entries).filter((entry) => entry.favorite).length, [entries]);
  const journalCount = useMemo(() => Object.values(entries).filter((entry) => entry.note.trim()).length, [entries]);
  const progressPercent = Math.round((completedCount / 30) * 100);
  const reduceMotion = settings.reduceMotion;

  function persistSettings(next: UserSettings) {
    setSettings(next);
    writeSettings(next);
  }

  function persistProfile(next: UserProfile) {
    setProfile(next);
    writeProfile(next);
  }

  function updateEntry(day: number, patch: Partial<DailyEntry>) {
    setEntries((previous) => {
      const existing = entryFor(previous, day);
      const next = {
        ...previous,
        [day]: {
          ...existing,
          ...patch,
          day,
          lastUpdated: new Date().toISOString(),
        },
      };
      writeDailyEntries(next);
      return next;
    });
  }

  function completeMission(day: number) {
    updateEntry(day, {
      completed: true,
      missionStarted: true,
      completedAt: new Date().toISOString(),
    });
    if (settings.vibrationEnabled && "vibrate" in navigator) navigator.vibrate(35);
    setToast(getEncouragementDay(day).completionMessage);
  }

  function startProgram() {
    const newProfile = { ...profile, startDate: new Date().toISOString().slice(0, 10) };
    persistProfile(newProfile);
    writeOnboardingDone();
    setOnboardingDone(true);
    setSelectedDay(1);
  }

  function speakMessage() {
    if (!("speechSynthesis" in window)) {
      setToast("เบราว์เซอร์นี้ยังไม่รองรับการอ่านข้อความ");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentDay.message);
    utterance.lang = "th-TH";
    window.speechSynthesis.speak(utterance);
  }

  async function shareText() {
    const text = `ใจดี 30 วัน — วันที่ ${currentDay.day}: ${currentDay.message}`;
    if (navigator.share) {
      await navigator.share({ title: currentDay.title, text }).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(text);
    setToast("คัดลอกข้อความแล้ว");
  }

  function downloadShareCard() {
    try {
      const dataUrl = createShareCard(currentDay, profile, shareSize);
      downloadDataUrl(dataUrl, `jaidee-day-${currentDay.day}.png`);
    } catch {
      setToast("อุปกรณ์นี้ยังไม่รองรับการสร้างภาพแชร์");
    }
  }

  function exportJson() {
    const payload = buildExportPayload(profile, settings, entries);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "jaidee-30-days-backup.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const payload = validateImportPayload(parsed);
      if (!payload) {
        setToast("ไฟล์นี้ไม่ใช่ข้อมูลของ ใจดี 30 วัน หรือเวอร์ชันไม่ตรงกัน");
        return;
      }
      persistProfile(payload.profile);
      persistSettings(payload.settings);
      setEntries(payload.dailyEntries);
      writeDailyEntries(payload.dailyEntries);
      setToast("นำเข้าข้อมูลสำเร็จแล้ว");
    } catch {
      setToast("อ่านไฟล์ไม่สำเร็จ ลองเลือกไฟล์ใหม่อีกครั้งนะ");
    } finally {
      event.target.value = "";
    }
  }

  function resetData() {
    if (!window.confirm("ต้องการล้างข้อมูลทั้งหมดจริงไหม?")) return;
    resetAllData();
    const freshProfile = createDefaultProfile();
    setProfile(freshProfile);
    setSettings(readSettings());
    setEntries({});
    setOnboardingDone(false);
    setSelectedDay(1);
    setToast("ล้างข้อมูลแล้ว คุณเริ่มใหม่ได้เสมอ");
  }

  if (!ready || showSplash) {
    return (
      <main className="mobile-shell grid min-h-screen place-items-center text-center">
        <motion.div
          className="glass card w-full"
          animate={reduceMotion ? undefined : { scale: [0.98, 1.02, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, repeatType: "reverse" }}
        >
          <div className="text-7xl">🌷</div>
          <h1 className="mt-5 text-3xl font-black">ใจดี 30 วัน</h1>
          <p className="mt-2 text-[var(--text-secondary)]">พื้นที่เล็ก ๆ สำหรับหัวใจของคุณ</p>
        </motion.div>
      </main>
    );
  }

  if (!onboardingDone) {
    return (
      <main className="mobile-shell flex flex-col justify-center">
        <section className="glass card space-y-5 text-center">
          <div className="text-7xl">🌅</div>
          <p className="text-sm font-bold text-[var(--primary)]">วันละหนึ่งกำลังใจ</p>
          <h1 className="text-3xl font-black">วันนี้ไม่ต้องเก่งที่สุดก็ได้</h1>
          <p className="text-[var(--text-secondary)]">แค่ยังอยู่ตรงนี้และพยายามต่อก็เพียงพอแล้ว</p>
          <input
            className="input text-center"
            value={profile.name === "คุณ" ? "" : profile.name}
            onChange={(event) => persistProfile({ ...profile, name: event.target.value || "คุณ" })}
            placeholder="ชื่อเล่นของคุณ"
            aria-label="ชื่อเล่น"
          />
          <button className="primary-btn" onClick={startProgram}>เริ่มดูแลใจตัวเอง</button>
          <button className="soft-btn w-full" onClick={startProgram}>ข้ามก่อน</button>
        </section>
      </main>
    );
  }

  return (
    <main className="mobile-shell">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[var(--primary)]">{getTimeGreeting()}</p>
          <h1 className="mt-1 text-2xl font-black">สวัสดี {profile.name || "คุณ"}</h1>
          <p className="text-sm text-[var(--text-secondary)]">{formatThaiDate()}</p>
        </div>
        <button className="icon-btn" aria-label="เปิดโหมดกลางคืน" onClick={() => persistSettings({ ...settings, darkMode: !settings.darkMode })}>
          <Moon size={20} />
        </button>
      </header>

      <div className="toast glass">{toast}</div>

      <section className="glass card mb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--text-secondary)]">วันที่ {unlockedDay} จาก 30</p>
            <h2 className="text-xl font-black">ความคืบหน้า {progressPercent}%</h2>
          </div>
          <Sparkles className="text-[var(--primary)]" />
        </div>
        <div className="progress-track mt-4">
          <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: reduceMotion ? 0 : 0.75 }} />
        </div>
      </section>

      <AnimatePresence mode="wait">
        <motion.section
          key={tab}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
        >
          {tab === "today" && (
            <div className="space-y-4">
              <section className="glass card space-y-4 text-center">
                <div className="text-6xl">{currentDay.icon}</div>
                <p className="text-sm font-bold text-[var(--primary)]">วันที่ {currentDay.day} — {currentDay.theme}</p>
                <h2 className="text-2xl font-black">{currentDay.title}</h2>
                <p className="text-2xl font-extrabold leading-relaxed">{currentDay.message}</p>
                <div className="grid grid-cols-3 gap-2">
                  <button className="icon-btn" onClick={() => updateEntry(currentDay.day, { favorite: !currentEntry.favorite })} aria-label="รายการโปรด">
                    <Heart size={19} fill={currentEntry.favorite ? "currentColor" : "none"} />
                  </button>
                  <button className="icon-btn" onClick={speakMessage} aria-label="อ่านข้อความ"><Volume2 size={19} /></button>
                  <button className="icon-btn" onClick={shareText} aria-label="แชร์ข้อความ"><Share2 size={19} /></button>
                </div>
              </section>

              <section className="glass card space-y-3">
                <h2 className="text-xl font-black">ภารกิจเล็ก ๆ ของวันนี้</h2>
                <p className="text-[var(--text-secondary)]">{currentDay.mission}</p>
                <p className="text-sm font-bold text-[var(--primary)]">ประมาณ {currentDay.missionDuration} นาที</p>
                <div className="grid grid-cols-2 gap-2">
                  <button className="soft-btn" onClick={() => updateEntry(currentDay.day, { missionStarted: true })}>เริ่มทำ</button>
                  <button className="primary-btn" onClick={() => completeMission(currentDay.day)}>
                    {currentEntry.completed ? "สำเร็จแล้ว" : "ทำสำเร็จแล้ว"}
                  </button>
                </div>
              </section>

              <section className="glass card space-y-3">
                <h2 className="text-xl font-black">ตอนนี้คุณรู้สึกอย่างไร?</h2>
                <div className="grid grid-cols-5 gap-2">
                  {moodOptions.map((mood) => (
                    <button
                      key={mood.value}
                      className={`mood-btn ${currentEntry.mood === mood.value ? "selected" : ""}`}
                      onClick={() => updateEntry(currentDay.day, { mood: mood.value })}
                    >
                      <span className="text-2xl">{mood.emoji}</span>
                      <span>{mood.label}</span>
                    </button>
                  ))}
                </div>
                {currentEntry.mood && <p className="rounded-3xl bg-white/50 p-3 text-sm text-[var(--text-secondary)]">{moodOptions[currentEntry.mood - 1].response}</p>}
              </section>

              <section className="glass card space-y-3">
                <label className="text-xl font-black" htmlFor="journal">อยากบอกอะไรกับตัวเองไหม?</label>
                <textarea
                  id="journal"
                  className="textarea"
                  maxLength={1000}
                  value={currentEntry.note}
                  placeholder={currentDay.reflection}
                  onChange={(event) => updateEntry(currentDay.day, { note: event.target.value })}
                />
                <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                  <span>บันทึกอัตโนมัติแล้ว</span>
                  <span>{currentEntry.note.length}/1000</span>
                </div>
              </section>
            </div>
          )}

          {tab === "calendar" && (
            <section className="glass card space-y-4">
              <div>
                <h2 className="text-2xl font-black">ปฏิทิน 30 วัน</h2>
                <p className="text-sm text-[var(--text-secondary)]">คุณไม่ได้แข่งขันกับใคร ทุกช่องที่เติมเต็มคือสิ่งที่คุณมอบให้ตัวเอง</p>
              </div>
              <div className="day-grid">
                {encouragementDays.map((day) => {
                  const entry = entryFor(entries, day.day);
                  const locked = day.day > unlockedDay;
                  return (
                    <button
                      key={day.day}
                      disabled={locked}
                      className={`day-cell ${entry.completed ? "done" : ""} ${day.day === currentDay.day ? "today" : ""} ${locked ? "locked" : ""}`}
                      onClick={() => { setSelectedDay(day.day); setTab("today"); }}
                    >
                      <span>{locked ? "🔒" : day.day}</span>
                      <small>{entry.favorite ? "♥" : entry.note ? "•" : entry.completed ? "✓" : ""}</small>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {tab === "journal" && (
            <section className="space-y-3">
              <div className="glass card">
                <h2 className="text-2xl font-black">บันทึกใจ</h2>
                <p className="text-sm text-[var(--text-secondary)]">รวมบันทึกทั้งหมด เรียงจากวันล่าสุดไปเก่า</p>
              </div>
              {encouragementDays
                .map((day) => ({ day, entry: entryFor(entries, day.day) }))
                .filter(({ entry }) => entry.note.trim() || entry.mood || entry.completed || entry.favorite)
                .reverse()
                .map(({ day, entry }) => (
                  <article key={day.day} className="glass card space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black">วันที่ {day.day}: {day.title}</h3>
                      <span>{entry.mood ? moodOptions[entry.mood - 1].emoji : day.icon}</span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">{entry.note || "ยังไม่มีข้อความบันทึก แต่วันนี้มีความหมายแล้ว"}</p>
                    <button className="soft-btn" onClick={() => { setSelectedDay(day.day); setTab("today"); }}>เปิดดูวันนี้</button>
                  </article>
                ))}
              {journalCount === 0 && <div className="glass card text-center text-[var(--text-secondary)]">พื้นที่นี้ยังว่างอยู่ เมื่อพร้อม ลองเขียนอะไรเล็ก ๆ ให้ตัวเองดูนะ</div>}
            </section>
          )}

          {tab === "me" && (
            <section className="space-y-4">
              <div className="glass card space-y-3">
                <h2 className="text-2xl font-black">ตัวฉัน</h2>
                <input className="input" value={profile.name} onChange={(event) => persistProfile({ ...profile, name: event.target.value || "คุณ" })} aria-label="ชื่อเล่น" />
                <div className="grid grid-cols-3 gap-2 text-center">
                  <Stat label="สำเร็จ" value={completedCount} />
                  <Stat label="บันทึก" value={journalCount} />
                  <Stat label="โปรด" value={favoriteCount} />
                </div>
              </div>

              <div className="glass card space-y-3">
                <h3 className="text-xl font-black">Badge</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Badge unlocked={completedCount >= 1} label="ก้าวแรก" />
                  <Badge unlocked={completedCount >= 3} label="ใจดีต่อเนื่อง" />
                  <Badge unlocked={completedCount >= 7} label="หนึ่งสัปดาห์ของเรา" />
                  <Badge unlocked={completedCount >= 15} label="ครึ่งทางแล้วนะ" />
                  <Badge unlocked={journalCount >= 10} label="นักบันทึกใจ" />
                  <Badge unlocked={completedCount >= 30} label="ใจดีครบ 30 วัน" />
                </div>
              </div>

              <div className="glass card space-y-3">
                <h3 className="text-xl font-black">สร้างภาพแชร์</h3>
                <select className="input" value={shareSize} onChange={(event) => setShareSize(event.target.value as ShareCardSize)} aria-label="ขนาดภาพแชร์">
                  <option value="story">Instagram Story</option>
                  <option value="square">Square Post</option>
                  <option value="wallpaper">Mobile Wallpaper</option>
                </select>
                <button className="primary-btn" onClick={downloadShareCard}>ดาวน์โหลดภาพ PNG</button>
              </div>

              <div className="glass card space-y-3">
                <h3 className="text-xl font-black">ตั้งค่าและข้อมูล</h3>
                <Toggle label="Dark Mode" checked={settings.darkMode} onChange={(value) => persistSettings({ ...settings, darkMode: value })} />
                <Toggle label="Reduce Motion" checked={settings.reduceMotion} onChange={(value) => persistSettings({ ...settings, reduceMotion: value })} />
                <Toggle label="โหมดทดลองดูครบ 30 วัน" checked={settings.demoMode} onChange={(value) => persistSettings({ ...settings, demoMode: value })} />
                <div className="grid grid-cols-2 gap-2">
                  <button className="soft-btn" onClick={exportJson}><Download size={16} /> Export</button>
                  <label className="soft-btn grid place-items-center">
                    Import
                    <input className="hidden" type="file" accept="application/json" onChange={importJson} />
                  </label>
                </div>
                <button className="soft-btn w-full" onClick={resetData}><RefreshCcw size={16} /> ล้างข้อมูลทั้งหมด</button>
                <p className="text-xs text-[var(--text-secondary)]">บันทึกและข้อมูลความรู้สึกจะถูกเก็บไว้บนอุปกรณ์นี้เท่านั้น</p>
              </div>
            </section>
          )}
        </motion.section>
      </AnimatePresence>

      <button className="breathing-fab" onClick={() => setBreathingOpen(true)} aria-label="เปิดแบบฝึกหายใจ"><Wind size={22} /></button>

      <nav className="bottom-nav" aria-label="เมนูหลัก">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.key} className={`nav-item ${tab === item.key ? "active" : ""}`} onClick={() => setTab(item.key)}>
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <AnimatePresence>
        {breathingOpen && (
          <motion.div className="breathing-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="glass card w-full max-w-sm text-center">
              <motion.div
                className="breathing-orb mx-auto"
                animate={reduceMotion ? undefined : { scale: [1, 1.35, 1.12, 0.86, 1] }}
                transition={{ duration: 12, repeat: Infinity, times: [0, 0.33, 0.5, 0.92, 1] }}
              />
              <h2 className="mt-6 text-2xl font-black">หายใจเข้า 4 • กลั้น 2 • ออก 6</h2>
              <p className="mt-2 text-[var(--text-secondary)]">ทำซ้ำ 3 รอบ แล้วค่อย ๆ กลับมาหาตัวเอง</p>
              <button className="primary-btn mt-6" onClick={() => setBreathingOpen(false)}>เสร็จแล้ว</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-white/50 p-3">
      <p className="text-2xl font-black text-[var(--primary)]">{value}</p>
      <p className="text-xs text-[var(--text-secondary)]">{label}</p>
    </div>
  );
}

function Badge({ label, unlocked }: { label: string; unlocked: boolean }) {
  return (
    <div className={`rounded-3xl border border-[var(--border)] p-3 text-sm font-bold ${unlocked ? "bg-white/60" : "opacity-45"}`}>
      {unlocked ? <CheckCircle2 className="mb-1 text-[var(--success)]" size={18} /> : <Sparkles className="mb-1" size={18} />}
      {label}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-3xl bg-white/50 p-3 font-bold">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}
