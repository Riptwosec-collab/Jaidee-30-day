"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BookHeart,
  CalendarDays,
  Download,
  Home,
  Moon,
  RefreshCcw,
  UserRound,
  Volume2,
  Wind,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { encouragementDays, getEncouragementDay } from "@/data/encouragement";
import { downloadDataUrl, createShareCard, type ShareCardSize } from "@/lib/shareCard";
import { formatThaiDate, getUnlockedDay } from "@/lib/dates";
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
  { value: 1, emoji: "😔", label: "แย่มาก", response: "วันนี้อาจหนักไปหน่อย คุณไม่จำเป็นต้องเข้มแข็งตลอดเวลาก็ได้" },
  { value: 2, emoji: "🙁", label: "ไม่ค่อยดี", response: "ไม่เป็นไรนะ วันที่ไม่สดใสก็ยังมีคุณค่าของมัน" },
  { value: 3, emoji: "😐", label: "เฉย ๆ", response: "วันที่ธรรมดาก็มีความหมายเหมือนกัน" },
  { value: 4, emoji: "🙂", label: "ดีนะ", response: "ดีใจที่หัวใจคุณเริ่มเบาลงอีกนิด" },
  { value: 5, emoji: "😄", label: "ดีมากเลย", response: "วันนี้หัวใจของคุณกำลังเปล่งประกายเลย" },
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

function phoneTime(): string {
  return new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
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
  const [toast, setToast] = useState("ดูแลใจทีละนิด ชีวิตจะใจดีกับคุณ");
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
    const timer = window.setTimeout(() => setShowSplash(false), 950);
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
  const missionStartedCount = useMemo(() => Object.values(entries).filter((entry) => entry.missionStarted).length, [entries]);
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
          className="glass card w-full space-y-4"
          animate={reduceMotion ? undefined : { scale: [0.98, 1.025, 1] }}
          transition={{ duration: 1.35, repeat: Infinity, repeatType: "reverse" }}
        >
          <div className="text-7xl">♡</div>
          <h1 className="brand-title text-4xl font-black">ใจดี 30 วัน</h1>
          <p className="soft-muted">ดูแลใจทีละนิด ชีวิตจะใจดีกับคุณ</p>
        </motion.div>
      </main>
    );
  }

  if (!onboardingDone) {
    return (
      <main className="mobile-shell flex flex-col justify-center">
        <section className="glass card space-y-5 text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-white/50 text-6xl shadow-xl">🌷</div>
          <p className="kicker">วันละหนึ่งกำลังใจ</p>
          <h1 className="brand-title text-3xl font-black">วันนี้ไม่ต้องเก่งที่สุดก็ได้</h1>
          <p className="soft-muted">แค่ยังอยู่ตรงนี้และพยายามต่อก็เพียงพอแล้ว</p>
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
      <StatusBar />

      <header className="mb-4 flex items-start justify-between gap-3 px-1">
        <div>
          <h1 className="brand-title text-3xl font-black">ใจดี <span className="text-xl">30 วัน</span></h1>
          <p className="mt-2 text-sm font-bold text-[var(--text-secondary)]">สวัสดีค่ะ {profile.name || "คุณ"} 💜</p>
          <p className="text-xs text-[var(--text-secondary)]">{formatThaiDate()}</p>
        </div>
        <div className="flex gap-2">
          <button className="icon-btn" aria-label="แจ้งเตือน"><Bell size={18} /></button>
          <button className="icon-btn" aria-label="เปิดโหมดกลางคืน" onClick={() => persistSettings({ ...settings, darkMode: !settings.darkMode })}>
            <Moon size={18} />
          </button>
        </div>
      </header>

      <div className="toast glass">{toast}</div>

      <AnimatePresence mode="wait">
        <motion.section
          key={tab}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
        >
          {tab === "today" && (
            <section className="space-y-4">
              <ProgressPanel unlockedDay={unlockedDay} progressPercent={progressPercent} />

              <article className="glass card hero-art lift-card text-center">
                <div className="relative z-[1] mx-auto max-w-[265px] space-y-2">
                  <p className="kicker">{currentDay.title}</p>
                  <p className="text-sm leading-7 text-[var(--text-secondary)]">“{currentDay.message}”</p>
                </div>
                <div className="illustration-sun" />
                <div className="illustration-flower">🌸</div>
                <div className="illustration-girl" aria-hidden="true">
                  <div className="head" />
                  <div className="body" />
                </div>
              </article>

              <div className="grid grid-cols-3 gap-3">
                <button className="action-tile" onClick={() => updateEntry(currentDay.day, { favorite: !currentEntry.favorite })}>
                  <span>{currentEntry.favorite ? "💖" : "🤍"}</span>
                  <span>เก็บไว้</span>
                </button>
                <button className="action-tile" onClick={speakMessage}>
                  <span>🎧</span>
                  <span>ฟังเสียงใจ</span>
                </button>
                <button className="action-tile" onClick={shareText}>
                  <span>🔗</span>
                  <span>แชร์ให้เพื่อน</span>
                </button>
              </div>

              <section className="glass card mission-card space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black">✨ ภารกิจเล็ก ๆ ของวันนี้</h2>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{currentDay.mission}</p>
                    <p className="mt-2 text-xs font-black text-[var(--primary)]">ประมาณ {currentDay.missionDuration} นาที · เพื่อเติมความสดชื่นให้ร่างกายและใจ 💧</p>
                  </div>
                  <span className="text-2xl">›</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button className="soft-btn" onClick={() => updateEntry(currentDay.day, { missionStarted: true })}>เริ่มทำ</button>
                  <button className="primary-btn" onClick={() => completeMission(currentDay.day)}>
                    {currentEntry.completed ? "สำเร็จแล้ว" : "ทำสำเร็จแล้ว"}
                  </button>
                </div>
              </section>

              <section className="glass card space-y-3">
                <h2 className="text-lg font-black">วันนี้คุณรู้สึกอย่างไรบ้าง?</h2>
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
                {currentEntry.mood && <p className="rounded-3xl bg-white/40 p-3 text-sm text-[var(--text-secondary)]">{moodOptions[currentEntry.mood - 1].response}</p>}
              </section>

              <section className="glass card space-y-3">
                <label className="text-lg font-black" htmlFor="journal">บันทึกความรู้สึกของคุณ</label>
                <textarea
                  id="journal"
                  className="textarea"
                  maxLength={1000}
                  value={currentEntry.note}
                  placeholder="เขียนอะไรในใจสักหน่อย..."
                  onChange={(event) => updateEntry(currentDay.day, { note: event.target.value })}
                />
                <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                  <span>บันทึกอัตโนมัติแล้ว</span>
                  <span>{currentEntry.note.length}/1000</span>
                </div>
              </section>
            </section>
          )}

          {tab === "calendar" && (
            <section className="space-y-4">
              <div className="px-1">
                <h2 className="brand-title text-3xl font-black">30 วัน</h2>
                <p className="soft-muted text-sm">ก้าวทีละวัน... หัวใจแข็งแรงขึ้นทุกวัน</p>
              </div>

              <div className="glass card grid grid-cols-3 gap-3 text-center">
                <MiniStat icon="✅" label="เสร็จสิ้นแล้ว" value={`${completedCount} วัน`} />
                <MiniStat icon="🔥" label="สตรีคต่อเนื่อง" value={`${completedCount} วัน`} />
                <MiniStat icon="💗" label="ความก้าวหน้า" value={`${progressPercent}%`} />
              </div>

              <section className="glass card space-y-4">
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
                        <small>{entry.completed ? "✓" : entry.favorite ? "♥" : entry.note ? "▣" : locked ? "" : "—"}</small>
                      </button>
                    );
                  })}
                </div>
                <div className="calendar-legend">
                  <span><i className="legend-dot" />เสร็จสิ้นแล้ว</span>
                  <span><i className="legend-dot" style={{ background: "#7658c8" }} />วันนี้</span>
                  <span><i className="legend-dot" style={{ background: "#f7a9a4" }} />ช่วงที่รู้สึกดี</span>
                </div>
              </section>
            </section>
          )}

          {tab === "journal" && (
            <section className="space-y-3">
              <div className="glass card">
                <h2 className="brand-title text-3xl font-black">บันทึกใจ</h2>
                <p className="soft-muted text-sm">รวมความรู้สึกเล็ก ๆ ที่คุณฝากไว้กับตัวเอง</p>
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
              <div className="glass card overflow-hidden text-center">
                <div className="mx-auto mb-3 grid h-32 w-32 place-items-center rounded-full bg-white/50 text-7xl shadow-xl">💗</div>
                <h2 className="brand-title text-3xl font-black">ตัวฉัน</h2>
                <p className="soft-muted text-sm">รู้จักตัวเองให้มากขึ้น แล้วจะรักตัวเองได้ง่ายขึ้น 💜</p>
                <input className="input mt-4 text-center" value={profile.name} onChange={(event) => persistProfile({ ...profile, name: event.target.value || "คุณ" })} aria-label="ชื่อเล่น" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StatCard icon="🔥" label="สตรีคต่อเนื่อง" value={`${completedCount} วัน`} note="เก่งมากเลย!" />
                <StatCard icon="📒" label="บันทึกทั้งหมด" value={`${journalCount} ครั้ง`} note="ขอบคุณที่ไว้ใจตัวเอง" />
                <StatCard icon="💗" label="คำคมที่ชอบ" value={`${favoriteCount} ประโยค`} note="เก็บไว้เติมใจ" />
                <StatCard icon="⭐" label="ภารกิจสำเร็จ" value={`${missionStartedCount} ภารกิจ`} note="ทุกก้าวมีความหมาย" />
              </div>

              <section className="glass card chart-card space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black">แนวโน้มอารมณ์</h3>
                  <span className="rounded-full bg-white/50 px-3 py-1 text-xs font-bold text-[var(--text-secondary)]">7 วันล่าสุด</span>
                </div>
                <MoodTrend entries={entries} />
              </section>

              <section className="glass card space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black">ความสำเร็จของคุณ</h3>
                  <span className="text-sm text-[var(--text-secondary)]">ดูทั้งหมด ›</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <Badge unlocked={completedCount >= 1} icon="🌱" label="เริ่มต้นได้ดี" />
                  <Badge unlocked={completedCount >= 3} icon="💗" label="ใจดีต่อเนื่อง" />
                  <Badge unlocked={completedCount >= 7} icon="⭐" label="ไม่ยอมแพ้" />
                  <Badge unlocked={completedCount >= 15} icon="🤍" label="ครึ่งทางแล้ว" />
                </div>
              </section>

              <section className="glass card space-y-3">
                <p className="rounded-[24px] bg-white/45 p-4 text-center text-[var(--text-secondary)]">“ไม่ว่าจะช้าแค่ไหน แต่คุณยังไม่หยุด... ก็ดีมากแล้ว”</p>
                <div className="grid grid-cols-2 gap-2">
                  <select className="input" value={shareSize} onChange={(event) => setShareSize(event.target.value as ShareCardSize)} aria-label="ขนาดภาพแชร์">
                    <option value="story">Story</option>
                    <option value="square">Square</option>
                    <option value="wallpaper">Wallpaper</option>
                  </select>
                  <button className="soft-btn" onClick={downloadShareCard}><Download size={16} />ภาพแชร์</button>
                </div>
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
              </section>
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
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              />
              <h2 className="mt-6 text-2xl font-black">หายใจช้า ๆ ไปด้วยกัน</h2>
              <p className="mt-2 text-[var(--text-secondary)]">เข้า 4 วิ · กลั้นไว้ 2 วิ · ออก 6 วิ · ทำซ้ำ 3 รอบ</p>
              <button className="primary-btn mt-6" onClick={() => setBreathingOpen(false)}>เสร็จแล้ว</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function StatusBar() {
  return (
    <div className="status-row" aria-hidden="true">
      <span>{phoneTime()}</span>
      <span className="status-pill" />
      <span>▴ Wi‑Fi ◼</span>
    </div>
  );
}

function ProgressPanel({ unlockedDay, progressPercent }: { unlockedDay: number; progressPercent: number }) {
  return (
    <section className="glass card mb-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[var(--text-primary)]">วันที่ {unlockedDay} จาก 30</p>
          <p className="text-xs text-[var(--text-secondary)]">ขอบคุณที่เลือกใกล้ชิดกับตัวเองในทุก ๆ วัน</p>
        </div>
        <span className="text-sm font-black text-[var(--primary)]">{progressPercent}%</span>
      </div>
      <div className="progress-track mt-4">
        <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.75 }} />
      </div>
    </section>
  );
}

function MiniStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-2xl">{icon}</div>
      <p className="text-xs text-[var(--text-secondary)]">{label}</p>
      <p className="text-xl font-black text-[var(--primary)]">{value}</p>
    </div>
  );
}

function StatCard({ icon, label, value, note }: { icon: string; label: string; value: string; note: string }) {
  return (
    <div className="stat-card">
      <div className="text-2xl">{icon}</div>
      <p className="text-xs font-bold text-[var(--text-secondary)]">{label}</p>
      <p className="stat-value">{value}</p>
      <p className="text-xs text-[var(--text-secondary)]">{note}</p>
    </div>
  );
}

function Badge({ unlocked, icon, label }: { unlocked: boolean; icon: string; label: string }) {
  return (
    <div className={`badge-card ${unlocked ? "" : "locked"}`}>
      <span className="text-2xl">{unlocked ? icon : "☆"}</span>
      <span className="text-[11px] font-black leading-tight">{label}</span>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-[22px] bg-white/40 px-4 py-3 text-sm font-bold">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function MoodTrend({ entries }: { entries: Record<number, DailyEntry> }) {
  const fallback = [3, 4, 3, 4, 3, 4, 5];
  const values = fallback.map((value, index) => entryFor(entries, index + 1).mood ?? value);
  const points = values.map((value, index) => `${22 + index * 42},${108 - (value - 1) * 20}`).join(" ");

  return (
    <svg viewBox="0 0 292 126" role="img" aria-label="กราฟแนวโน้มอารมณ์ 7 วันล่าสุด">
      {[0, 1, 2, 3, 4].map((line) => (
        <line key={line} x1="18" x2="278" y1={28 + line * 20} y2={28 + line * 20} stroke="rgba(111,87,189,.11)" strokeDasharray="4 5" />
      ))}
      <polyline points={points} fill="none" stroke="#7658c8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {values.map((value, index) => (
        <g key={`${value}-${index}`}>
          <circle cx={22 + index * 42} cy={108 - (value - 1) * 20} r="6" fill="#fff7ef" stroke="#7658c8" strokeWidth="4" />
          <text x={22 + index * 42} y="124" textAnchor="middle" fontSize="10" fill="#81768f">{index + 2} ก.ค.</text>
        </g>
      ))}
    </svg>
  );
}
