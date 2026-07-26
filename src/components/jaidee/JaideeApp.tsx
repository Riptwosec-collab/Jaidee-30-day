"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BookHeart,
  CalendarDays,
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
import { encouragementDays, getEncouragementDay, type EncouragementDay } from "@/data/encouragement";
import { extraEncouragementMessages, randomEncouragement } from "@/data/encouragementExtras";
import { downloadDataUrl, createShareCard, type ShareCardSize, type ShareCardTheme } from "@/lib/shareCard";
import { formatThaiDate, getThemeLabel, getTimeGreeting, getTimeTheme, getUnlockedDay, type TimeTheme } from "@/lib/dates";
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
type JournalMode = "notes" | "favorites";

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

const onboardingSlides = [
  { icon: "🌅", title: "วันละหนึ่งกำลังใจ", text: "เปิดรับข้อความดี ๆ ให้ตัวเองวันละหนึ่งครั้ง" },
  { icon: "☕", title: "ภารกิจที่ไม่กดดัน", text: "ทำภารกิจเล็ก ๆ ที่ใช้เวลาเพียงไม่กี่นาที" },
  { icon: "🌷", title: "บันทึกการเติบโต", text: "เก็บความรู้สึกและมองเห็นว่าคุณเดินมาไกลแค่ไหน" },
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
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [tab, setTab] = useState<Tab>("today");
  const [journalMode, setJournalMode] = useState<JournalMode>("notes");
  const [profile, setProfile] = useState<UserProfile>(() => createDefaultProfile());
  const [settings, setSettings] = useState<UserSettings>(() => readSettings());
  const [entries, setEntries] = useState<Record<number, DailyEntry>>({});
  const [selectedDay, setSelectedDay] = useState(1);
  const [sheetDay, setSheetDay] = useState<number | null>(null);
  const [toast, setToast] = useState("ดูแลใจทีละนิด ชีวิตจะใจดีกับคุณ");
  const [breathingOpen, setBreathingOpen] = useState(false);
  const [shareSize, setShareSize] = useState<ShareCardSize>("story");
  const [shareTheme, setShareTheme] = useState<ShareCardTheme>("peach");
  const [shareShowName, setShareShowName] = useState(true);
  const [shareShowDay, setShareShowDay] = useState(true);
  const [sharePreview, setSharePreview] = useState("");
  const [softMessage, setSoftMessage] = useState(() => randomEncouragement());

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
    const activeTheme = settings.themeMode === "auto" ? getTimeTheme() : settings.themeMode;
    document.body.dataset.theme = activeTheme;
  }, [settings.darkMode, settings.fontScale, settings.themeMode]);

  const unlockedDay = useMemo(() => getUnlockedDay(profile.startDate, settings.demoMode), [profile.startDate, settings.demoMode]);
  const currentDay = getEncouragementDay(Math.min(selectedDay, unlockedDay));
  const currentEntry = entryFor(entries, currentDay.day);
  const completedCount = useMemo(() => Object.values(entries).filter((entry) => entry.completed).length, [entries]);
  const favoriteDays = useMemo(() => encouragementDays.filter((day) => entryFor(entries, day.day).favorite), [entries]);
  const favoriteCount = favoriteDays.length;
  const journalItems = useMemo(
    () => encouragementDays.map((day) => ({ day, entry: entryFor(entries, day.day) })).filter(({ entry }) => entry.note.trim() || entry.mood || entry.completed || entry.favorite).reverse(),
    [entries],
  );
  const journalCount = useMemo(() => Object.values(entries).filter((entry) => entry.note.trim()).length, [entries]);
  const missionStartedCount = useMemo(() => Object.values(entries).filter((entry) => entry.missionStarted).length, [entries]);
  const progressPercent = Math.round((completedCount / 30) * 100);
  const reduceMotion = settings.reduceMotion;
  const activeTimeTheme = settings.themeMode === "auto" ? getTimeTheme() : (settings.themeMode as TimeTheme);
  const moodInsight = getMoodInsight(entries);
  const sheetData = sheetDay ? getEncouragementDay(sheetDay) : null;
  const sheetEntry = sheetDay ? entryFor(entries, sheetDay) : null;

  useEffect(() => {
    if (!ready) return;
    try {
      setSharePreview(createShareCard(currentDay, profile, { size: shareSize, theme: shareTheme, showName: shareShowName, showDay: shareShowDay }));
    } catch {
      setSharePreview("");
    }
  }, [currentDay, profile, ready, shareShowDay, shareShowName, shareSize, shareTheme]);

  useEffect(() => {
    if (!settings.reminderEnabled || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    let timeoutId = 0;
    const schedule = () => {
      const [hour = "20", minute = "30"] = (settings.reminderTime ?? "20:30").split(":");
      const target = new Date();
      target.setHours(Number(hour), Number(minute), 0, 0);
      if (target.getTime() <= Date.now()) target.setDate(target.getDate() + 1);
      timeoutId = window.setTimeout(() => {
        new Notification("ใจดี 30 วัน", { body: "วันนี้มีข้อความดี ๆ รอคุณอยู่นะ" });
        schedule();
      }, target.getTime() - Date.now());
    };
    schedule();
    return () => window.clearTimeout(timeoutId);
  }, [settings.reminderEnabled, settings.reminderTime]);

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

  function speakMessage(text = currentDay.message) {
    if (!("speechSynthesis" in window)) {
      setToast("เบราว์เซอร์นี้ยังไม่รองรับการอ่านข้อความ");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "th-TH";
    window.speechSynthesis.speak(utterance);
  }

  async function shareText(day = currentDay) {
    const text = `ใจดี 30 วัน — วันที่ ${day.day}: ${day.message}`;
    if (navigator.share) {
      await navigator.share({ title: day.title, text }).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(text);
    setToast("คัดลอกข้อความแล้ว");
  }

  function downloadShareCard(day = currentDay) {
    try {
      const dataUrl = createShareCard(day, profile, { size: shareSize, theme: shareTheme, showName: shareShowName, showDay: shareShowDay });
      downloadDataUrl(dataUrl, `jaidee-day-${day.day}.png`);
    } catch {
      setToast("อุปกรณ์นี้ยังไม่รองรับการสร้างภาพแชร์");
    }
  }

  function downloadCertificate() {
    const canvas = document.createElement("canvas");
    canvas.width = 1400;
    canvas.height = 1000;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const gradient = ctx.createLinearGradient(0, 0, 1400, 1000);
    gradient.addColorStop(0, "#fff7ec");
    gradient.addColorStop(0.55, "#ffe5df");
    gradient.addColorStop(1, "#eee7ff");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1400, 1000);
    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.beginPath();
    ctx.roundRect(120, 120, 1160, 760, 60);
    ctx.fill();
    ctx.textAlign = "center";
    ctx.fillStyle = "#6f57bd";
    ctx.font = "900 70px sans-serif";
    ctx.fillText("ใบรับรองความใจดีต่อตัวเอง", 700, 280);
    ctx.fillStyle = "#2f2955";
    ctx.font = "800 58px sans-serif";
    ctx.fillText(profile.name || "คุณ", 700, 420);
    ctx.font = "600 36px sans-serif";
    ctx.fillText("สำหรับการดูแลหัวใจตัวเองตลอด 30 วัน", 700, 520);
    ctx.fillText(`สำเร็จ ${completedCount} วัน · บันทึก ${journalCount} ครั้ง · ข้อความโปรด ${favoriteCount} ประโยค`, 700, 610);
    ctx.font = "700 34px sans-serif";
    ctx.fillStyle = "#81768f";
    ctx.fillText("ขอบคุณที่ไม่ทอดทิ้งตัวเอง", 700, 735);
    downloadDataUrl(canvas.toDataURL("image/png"), "jaidee-certificate.png");
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
    setOnboardingStep(0);
    setSelectedDay(1);
    setToast("ล้างข้อมูลแล้ว คุณเริ่มใหม่ได้เสมอ");
  }

  async function requestReminder() {
    if (typeof Notification === "undefined") {
      setToast("เบราว์เซอร์นี้ยังไม่รองรับการแจ้งเตือน");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      persistSettings({ ...settings, reminderEnabled: true });
      setToast("เปิดแจ้งเตือนแล้ว วันนี้มีข้อความดี ๆ รอคุณอยู่นะ");
    } else {
      setToast("ยังไม่ได้รับสิทธิ์แจ้งเตือน คุณยังกลับมาเปิดเว็บได้ทุกเวลา");
    }
  }

  function openFavoriteRandom() {
    if (favoriteDays.length === 0) {
      setToast("ยังไม่มีข้อความโปรด ลองกดหัวใจในหน้าวันนี้ก่อนนะ");
      return;
    }
    const day = favoriteDays[Math.floor(Math.random() * favoriteDays.length)];
    setSelectedDay(day.day);
    setTab("today");
    setToast("สุ่มข้อความที่คุณชอบให้แล้ว");
  }

  if (!ready || showSplash) {
    return (
      <main className="mobile-shell grid min-h-screen place-items-center text-center">
        <motion.div
          className="glass card w-full space-y-4"
          animate={reduceMotion ? undefined : { scale: [0.98, 1.025, 1] }}
          transition={{ duration: 1.35, repeat: Infinity, repeatType: "reverse" }}
        >
          <Mascot size="large" />
          <h1 className="brand-title text-4xl font-black">ใจดี 30 วัน</h1>
          <p className="soft-muted">ดูแลใจทีละนิด ชีวิตจะใจดีกับคุณ</p>
        </motion.div>
      </main>
    );
  }

  if (!onboardingDone) {
    const slide = onboardingSlides[onboardingStep];
    const isLast = onboardingStep === onboardingSlides.length - 1;
    return (
      <main className="mobile-shell flex flex-col justify-center">
        <section className="glass card space-y-5 text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-white/50 text-6xl shadow-xl">{slide.icon}</div>
          <p className="kicker">{slide.title}</p>
          <h1 className="brand-title text-3xl font-black">{isLast ? "เริ่มดูแลใจตัวเอง" : "ใจดี 30 วัน"}</h1>
          <p className="soft-muted">{slide.text}</p>
          {isLast && (
            <div className="space-y-3">
              <input
                className="input text-center"
                value={profile.name === "คุณ" ? "" : profile.name}
                onChange={(event) => persistProfile({ ...profile, name: event.target.value || "คุณ" })}
                placeholder="ชื่อเล่นของคุณ"
                aria-label="ชื่อเล่น"
              />
              <div className="grid grid-cols-4 gap-2">
                {["🌷", "🐱", "🌙", "⭐"].map((avatar) => (
                  <button key={avatar} className="avatar-choice" onClick={() => persistProfile({ ...profile, avatar })}>{avatar}</button>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-center gap-2">
            {onboardingSlides.map((item, index) => <span key={item.title} className={`page-dot ${index === onboardingStep ? "active" : ""}`} />)}
          </div>
          <button className="primary-btn" onClick={() => (isLast ? startProgram() : setOnboardingStep((step) => step + 1))}>
            {isLast ? "เริ่มดูแลใจตัวเอง" : "ถัดไป"}
          </button>
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
          <p className="mt-2 text-sm font-bold text-[var(--text-secondary)]">สวัสดีค่ะ {profile.name || "คุณ"} {profile.avatar}</p>
          <p className="text-xs text-[var(--text-secondary)]">{formatThaiDate()} · {getThemeLabel(activeTimeTheme)}</p>
        </div>
        <div className="flex gap-2">
          <button className="icon-btn" aria-label="แจ้งเตือน" onClick={settings.reminderEnabled ? () => persistSettings({ ...settings, reminderEnabled: false }) : requestReminder}>
            <Bell size={18} fill={settings.reminderEnabled ? "currentColor" : "none"} />
          </button>
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
                <div className="relative z-[1] mx-auto max-w-[270px] space-y-2">
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

              <section className="glass card mascot-card">
                <Mascot />
                <div>
                  <p className="text-sm font-black text-[var(--primary)]">ข้อความเติมใจ</p>
                  <p className="text-sm leading-6 text-[var(--text-secondary)]">{softMessage}</p>
                </div>
                <button className="soft-btn" onClick={() => setSoftMessage(randomEncouragement(Math.floor(Math.random() * extraEncouragementMessages.length)))}>สุ่มใหม่</button>
              </section>

              <div className="grid grid-cols-3 gap-3">
                <button className="action-tile" onClick={() => updateEntry(currentDay.day, { favorite: !currentEntry.favorite })}>
                  <span>{currentEntry.favorite ? "💖" : "🤍"}</span>
                  <span>เก็บไว้</span>
                </button>
                <button className="action-tile" onClick={() => speakMessage()}>
                  <span>🎧</span>
                  <span>ฟังเสียงใจ</span>
                </button>
                <button className="action-tile" onClick={() => shareText()}>
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
                        onClick={() => setSheetDay(day.day)}
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
                  <span><i className="legend-dot" style={{ background: "#f7a9a4" }} />มีบันทึก/โปรด</span>
                </div>
              </section>
            </section>
          )}

          {tab === "journal" && (
            <section className="space-y-3">
              <div className="glass card">
                <h2 className="brand-title text-3xl font-black">บันทึกใจ</h2>
                <p className="soft-muted text-sm">รวมความรู้สึกและคำคมที่คุณอยากเก็บไว้</p>
              </div>
              <div className="segmented">
                <button className={journalMode === "notes" ? "active" : ""} onClick={() => setJournalMode("notes")}>บันทึกทั้งหมด</button>
                <button className={journalMode === "favorites" ? "active" : ""} onClick={() => setJournalMode("favorites")}>คำคมที่ชอบ</button>
              </div>

              {journalMode === "notes" && (
                <>
                  {journalItems.map(({ day, entry }) => (
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
                </>
              )}

              {journalMode === "favorites" && (
                <section className="space-y-3">
                  <button className="primary-btn" onClick={openFavoriteRandom}>สุ่มข้อความที่ฉันชอบ</button>
                  {favoriteDays.map((day) => (
                    <article key={day.day} className="glass card favorite-card space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="kicker">วันที่ {day.day} · {day.title}</p>
                        <span className="text-2xl">{day.icon}</span>
                      </div>
                      <p className="text-lg font-black leading-8">“{day.message}”</p>
                      <div className="grid grid-cols-3 gap-2">
                        <button className="soft-btn" onClick={() => speakMessage(day.message)}><Volume2 size={16} /> ฟัง</button>
                        <button className="soft-btn" onClick={() => shareText(day)}><Share2 size={16} /> แชร์</button>
                        <button className="soft-btn" onClick={() => updateEntry(day.day, { favorite: false })}>นำออก</button>
                      </div>
                    </article>
                  ))}
                  {favoriteDays.length === 0 && <div className="glass card text-center text-[var(--text-secondary)]">ยังไม่มีคำคมที่ชอบ ลองกดหัวใจจากหน้าวันนี้ดูนะ</div>}
                </section>
              )}
            </section>
          )}

          {tab === "me" && (
            <section className="space-y-4">
              <div className="glass card overflow-hidden text-center">
                <Mascot size="large" />
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
                  <h3 className="text-lg font-black">Mood Insight</h3>
                  <span className="rounded-full bg-white/50 px-3 py-1 text-xs font-bold text-[var(--text-secondary)]">7 วันล่าสุด</span>
                </div>
                <MoodTrend entries={entries} />
                <p className="rounded-[24px] bg-white/45 p-3 text-sm leading-6 text-[var(--text-secondary)]">{moodInsight}</p>
              </section>

              <SummaryCard
                completedCount={completedCount}
                journalCount={journalCount}
                favoriteCount={favoriteCount}
                missionStartedCount={missionStartedCount}
                demoMode={settings.demoMode}
                onDownload={downloadCertificate}
              />

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

              <SharePreviewPanel
                preview={sharePreview}
                shareSize={shareSize}
                shareTheme={shareTheme}
                showName={shareShowName}
                showDay={shareShowDay}
                setShareSize={setShareSize}
                setShareTheme={setShareTheme}
                setShowName={setShareShowName}
                setShowDay={setShareShowDay}
                onDownload={() => downloadShareCard()}
              />

              <section className="glass card space-y-3">
                <h3 className="text-lg font-black">ธีมและการแจ้งเตือน</h3>
                <div className="theme-grid">
                  {(["auto", "morning", "day", "evening", "night"] as const).map((mode) => (
                    <button key={mode} className={settings.themeMode === mode ? "active" : ""} onClick={() => persistSettings({ ...settings, themeMode: mode })}>{mode}</button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input className="input" type="time" value={settings.reminderTime ?? "20:30"} onChange={(event) => persistSettings({ ...settings, reminderTime: event.target.value })} aria-label="เวลาแจ้งเตือน" />
                  <button className="soft-btn" onClick={settings.reminderEnabled ? () => persistSettings({ ...settings, reminderEnabled: false }) : requestReminder}>{settings.reminderEnabled ? "ปิดเตือน" : "เปิดเตือน"}</button>
                </div>
                <Toggle label="Dark Mode" checked={settings.darkMode} onChange={(value) => persistSettings({ ...settings, darkMode: value })} />
                <Toggle label="Reduce Motion" checked={settings.reduceMotion} onChange={(value) => persistSettings({ ...settings, reduceMotion: value })} />
                <Toggle label="โหมดทดลองดูครบ 30 วัน" checked={settings.demoMode} onChange={(value) => persistSettings({ ...settings, demoMode: value })} />
              </section>

              <section className="glass card space-y-3">
                <p className="rounded-[24px] bg-white/45 p-4 text-center text-[var(--text-secondary)]">“ไม่ว่าจะช้าแค่ไหน แต่คุณยังไม่หยุด... ก็ดีมากแล้ว”</p>
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
                transition={{ duration: 12, repeat: Infinity, times: [0, 0.34, 0.5, 0.84, 1] }}
              />
              <h2 className="mt-6 text-2xl font-black">หายใจไปด้วยกัน</h2>
              <p className="mt-2 text-[var(--text-secondary)]">หายใจเข้า 4 วินาที · กลั้นไว้ 2 วินาที · หายใจออก 6 วินาที</p>
              <button className="primary-btn mt-6" onClick={() => setBreathingOpen(false)}>เสร็จแล้ว</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sheetData && sheetEntry && (
          <DayBottomSheet
            day={sheetData}
            entry={sheetEntry}
            moodLabel={sheetEntry.mood ? `${moodOptions[sheetEntry.mood - 1].emoji} ${moodOptions[sheetEntry.mood - 1].label}` : "ยังไม่ได้เลือก"}
            onClose={() => setSheetDay(null)}
            onOpen={() => { setSelectedDay(sheetData.day); setTab("today"); setSheetDay(null); }}
            onFavorite={() => updateEntry(sheetData.day, { favorite: !sheetEntry.favorite })}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function StatusBar() {
  return (
    <div className="status-bar">
      <span>{phoneTime()}</span>
      <span>●●● ᴡɪꜰɪ ▰</span>
    </div>
  );
}

function Mascot({ size = "normal" }: { size?: "normal" | "large" }) {
  return (
    <div className={`mascot ${size}`} aria-hidden="true">
      <div className="cat-face">♡</div>
      <div className="cat-body" />
      <div className="cat-tail" />
    </div>
  );
}

function ProgressPanel({ unlockedDay, progressPercent }: { unlockedDay: number; progressPercent: number }) {
  return (
    <section className="glass card soft-panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black">วันที่ {unlockedDay} จาก 30</p>
          <p className="text-xs text-[var(--text-secondary)]">ขอบคุณที่เลือกใจดีกับตัวเองในทุก ๆ วัน</p>
        </div>
        <strong className="text-[var(--primary)]">{progressPercent}%</strong>
      </div>
      <div className="progress-track mt-4">
        <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.75 }} />
      </div>
    </section>
  );
}

function MiniStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="mini-stat">
      <span>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

function StatCard({ icon, label, value, note }: { icon: string; label: string; value: string; note: string }) {
  return (
    <div className="glass card stat-card">
      <span className="text-2xl">{icon}</span>
      <p className="text-sm font-black">{label}</p>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function Badge({ unlocked, icon, label }: { unlocked: boolean; icon: string; label: string }) {
  return (
    <div className={`badge-card ${unlocked ? "unlocked" : ""}`}>
      <span>{unlocked ? icon : "☆"}</span>
      <small>{label}</small>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-[24px] bg-white/40 p-3 text-sm font-bold">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function MoodTrend({ entries }: { entries: Record<number, DailyEntry> }) {
  const points = Array.from({ length: 7 }, (_, index) => {
    const day = Math.max(1, 30 - 6 + index);
    return entryFor(entries, day).mood ?? ((index % 3) + 2);
  });
  return (
    <div className="mood-chart" aria-label="กราฟอารมณ์ 7 วันล่าสุด">
      {points.map((value, index) => (
        <div key={`${value}-${index}`} className="mood-bar-wrap">
          <span className="mood-dot" style={{ bottom: `${value * 17}%` }} />
          <small>{index + 1}</small>
        </div>
      ))}
    </div>
  );
}

function getMoodInsight(entries: Record<number, DailyEntry>): string {
  const moods = Object.values(entries).filter((entry): entry is DailyEntry & { mood: 1 | 2 | 3 | 4 | 5 } => Boolean(entry.mood));
  if (moods.length === 0) return "ยังไม่มีข้อมูลอารมณ์ ลองเลือกความรู้สึกวันนี้เพื่อให้ระบบค่อย ๆ สะท้อนใจคุณได้ดีขึ้น";
  const average = moods.reduce((sum, entry) => sum + entry.mood, 0) / moods.length;
  if (average >= 4) return "ช่วงนี้หัวใจของคุณมีแสงดี ๆ อยู่หลายวัน ลองเก็บช่วงเวลาเหล่านี้ไว้เป็นหลักฐานว่าคุณยังยิ้มได้";
  if (average >= 3) return "อารมณ์โดยรวมอยู่ในช่วงค่อย ๆ ทรงตัว ให้เวลาตัวเองอีกนิด คุณกำลังเดินได้ดีแล้ว";
  return "ช่วงนี้อาจหนักกว่าปกติ ลองลดความคาดหวังลงและให้ตัวเองพักอย่างตั้งใจนะ";
}

function SummaryCard({ completedCount, journalCount, favoriteCount, missionStartedCount, demoMode, onDownload }: { completedCount: number; journalCount: number; favoriteCount: number; missionStartedCount: number; demoMode: boolean; onDownload: () => void }) {
  const isComplete = completedCount >= 30 || demoMode;
  return (
    <section className={`glass card summary-card ${isComplete ? "complete" : ""}`}>
      <p className="kicker">สรุปเส้นทาง 30 วัน</p>
      <h3 className="brand-title text-2xl font-black">{isComplete ? "คุณทำสำเร็จแล้ว" : "กำลังเดินทางอย่างอ่อนโยน"}</h3>
      <p className="soft-muted text-sm">ขอบคุณที่เลือกดูแลหัวใจตัวเองตลอดเส้นทางนี้</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-center">
        <MiniStat icon="✅" label="วันที่สำเร็จ" value={`${completedCount}/30`} />
        <MiniStat icon="📝" label="บันทึก" value={`${journalCount}`} />
        <MiniStat icon="💗" label="ข้อความโปรด" value={`${favoriteCount}`} />
        <MiniStat icon="⭐" label="ภารกิจ" value={`${missionStartedCount}`} />
      </div>
      <button className="primary-btn mt-4" onClick={onDownload}>ดาวน์โหลดใบประกาศ</button>
    </section>
  );
}

function SharePreviewPanel({ preview, shareSize, shareTheme, showName, showDay, setShareSize, setShareTheme, setShowName, setShowDay, onDownload }: {
  preview: string;
  shareSize: ShareCardSize;
  shareTheme: ShareCardTheme;
  showName: boolean;
  showDay: boolean;
  setShareSize: (size: ShareCardSize) => void;
  setShareTheme: (theme: ShareCardTheme) => void;
  setShowName: (value: boolean) => void;
  setShowDay: (value: boolean) => void;
  onDownload: () => void;
}) {
  return (
    <section className="glass card space-y-3">
      <h3 className="text-lg font-black">Share Card Preview</h3>
      {preview && <img className="share-preview" src={preview} alt="ตัวอย่างภาพแชร์" />}
      <div className="grid grid-cols-2 gap-2">
        <select className="input" value={shareSize} onChange={(event) => setShareSize(event.target.value as ShareCardSize)} aria-label="ขนาดภาพแชร์">
          <option value="story">Story</option>
          <option value="square">Square</option>
          <option value="wallpaper">Wallpaper</option>
        </select>
        <select className="input" value={shareTheme} onChange={(event) => setShareTheme(event.target.value as ShareCardTheme)} aria-label="ธีมภาพแชร์">
          <option value="peach">Peach</option>
          <option value="lavender">Lavender</option>
          <option value="cream">Cream</option>
          <option value="night">Night</option>
        </select>
      </div>
      <Toggle label="แสดงชื่อผู้ใช้" checked={showName} onChange={setShowName} />
      <Toggle label="แสดงเลขวัน" checked={showDay} onChange={setShowDay} />
      <button className="primary-btn" onClick={onDownload}>ดาวน์โหลดภาพ PNG</button>
    </section>
  );
}

function DayBottomSheet({ day, entry, moodLabel, onClose, onOpen, onFavorite }: { day: EncouragementDay; entry: DailyEntry; moodLabel: string; onClose: () => void; onOpen: () => void; onFavorite: () => void }) {
  return (
    <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.section className="bottom-sheet glass" initial={{ y: 420 }} animate={{ y: 0 }} exit={{ y: 420 }} onClick={(event) => event.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="kicker">วันที่ {day.day}</p>
            <h3 className="text-2xl font-black">{day.title}</h3>
          </div>
          <span className="text-4xl">{day.icon}</span>
        </div>
        <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">“{day.message}”</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-[22px] bg-white/45 p-3"><b>ภารกิจ</b><br />{day.mission}</div>
          <div className="rounded-[22px] bg-white/45 p-3"><b>อารมณ์</b><br />{moodLabel}</div>
        </div>
        <p className="mt-3 rounded-[22px] bg-white/45 p-3 text-sm text-[var(--text-secondary)]">{entry.note || "ยังไม่มีบันทึกของวันนี้"}</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button className="soft-btn" onClick={onFavorite}>{entry.favorite ? "นำออก" : "เก็บโปรด"}</button>
          <button className="soft-btn" onClick={onClose}>ปิด</button>
          <button className="primary-btn" onClick={onOpen}>ดูเต็มหน้า</button>
        </div>
      </motion.section>
    </motion.div>
  );
}
