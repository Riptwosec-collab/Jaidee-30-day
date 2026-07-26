"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookHeart, CalendarDays, CheckCircle2, Download, Heart, Home, Mic2, RefreshCcw, Share2, Sparkles, UserRound } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";

type Tab = "today" | "calendar" | "journal" | "me";
type Day = { day: number; title: string; message: string; mission: string; reflection: string; icon: string };
type Entry = { completed: boolean; mood?: number; note: string; favorite: boolean; completedAt?: string };
type Profile = { name: string; startDate: string };
type Settings = { darkMode: boolean; reduceMotion: boolean; demoMode: boolean };

const STORAGE = {
  profile: "kindheart30_profile",
  entries: "kindheart30_daily_entries",
  settings: "kindheart30_settings",
  onboarding: "kindheart30_onboarding",
};

const DAYS: Day[] = [
  ["เริ่มต้น", "ไม่จำเป็นต้องพร้อมทั้งหมด แค่กล้าเริ่มก็ถือว่าคุณเดินหน้าแล้ว", "เลือกหนึ่งสิ่งที่อยากทำ แล้วลงมือเพียง 5 นาที", "วันนี้คุณอยากเริ่มดูแลตัวเองจากเรื่องอะไร?", "🌅"],
  ["ให้เวลาตัวเอง", "คุณไม่จำเป็นต้องเติบโตด้วยความเร็วเดียวกับคนอื่น", "อยู่เงียบ ๆ กับตัวเองโดยไม่จับโทรศัพท์ 10 นาที", "ช่วงนี้คุณต้องการให้เวลากับเรื่องใดมากขึ้น?", "☁️"],
  ["ยอมรับความเหนื่อย", "การเหนื่อยไม่ได้แปลว่าอ่อนแอ แต่มันแปลว่าคุณพยายามมาไกลแล้ว", "พักอย่างตั้งใจ 15 นาทีโดยไม่รู้สึกผิด", "ร่างกายหรือหัวใจของคุณกำลังบอกอะไรอยู่?", "🌧️"],
  ["เห็นคุณค่าตัวเอง", "คุณมีคุณค่า แม้ในวันที่ไม่ได้สร้างผลงานอะไรเลย", "เขียนข้อดีของตัวเอง 3 ข้อ", "มีคุณสมบัติอะไรในตัวเองที่คุณอยากขอบคุณ?", "💜"],
  ["หยุดเปรียบเทียบ", "เส้นทางของคนอื่นไม่ได้ลดคุณค่าของเส้นทางที่คุณกำลังเดิน", "พักจากสิ่งที่ทำให้เปรียบเทียบตัวเอง 1 ชั่วโมง", "คุณกำลังเปรียบเทียบตัวเองกับเรื่องอะไร?", "🛤️"],
  ["เริ่มใหม่ได้", "วันที่ผิดพลาดไม่ใช่จุดจบ คุณสามารถเริ่มต้นใหม่ได้เสมอ", "แก้ไขเรื่องเล็ก ๆ ที่ค้างอยู่หนึ่งเรื่อง", "มีเรื่องอะไรที่คุณอยากให้โอกาสตัวเองเริ่มใหม่?", "🌱"],
  ["ขอบคุณตัวเอง", "อย่าลืมขอบคุณตัวเองที่ยังพยายามอยู่จนถึงวันนี้", "เขียนข้อความขอบคุณตัวเองหนึ่งประโยค", "ตลอดสัปดาห์ที่ผ่านมา คุณอยากขอบคุณตัวเองเรื่องอะไร?", "✨"],
  ["ความก้าวหน้าที่มองไม่เห็น", "บางความเปลี่ยนแปลงอาจยังมองไม่เห็น แต่มันกำลังเกิดขึ้นภายในตัวคุณ", "จดหนึ่งสิ่งที่คุณทำได้ดีกว่าเมื่อก่อน", "คุณคิดว่าตัวเองเติบโตขึ้นจากอดีตอย่างไร?", "🌿"],
  ["กล้าที่จะปฏิเสธ", "การปกป้องเวลาและพลังใจของตัวเองไม่ใช่ความเห็นแก่ตัว", "ปฏิเสธหรือเลื่อนหนึ่งเรื่องที่เกินกำลัง", "เรื่องใดกำลังใช้พลังของคุณมากเกินไป?", "🛡️"],
  ["ดูแลร่างกาย", "ร่างกายของคุณทำงานเพื่อคุณทุกวัน ลองดูแลมันอย่างอ่อนโยนบ้างนะ", "ดื่มน้ำหนึ่งแก้วและยืดร่างกาย 5 นาที", "ตอนนี้ร่างกายของคุณต้องการการดูแลแบบไหน?", "💧"],
  ["ไม่ต้องสมบูรณ์แบบ", "คุณไม่ต้องสมบูรณ์แบบ เพื่อให้ตัวเองคู่ควรกับความสุข", "ปล่อยผ่านข้อผิดพลาดเล็ก ๆ หนึ่งเรื่อง", "คุณกำลังคาดหวังความสมบูรณ์แบบกับตัวเองเรื่องใด?", "🫧"],
  ["ความสำเร็จเล็ก ๆ", "ความสำเร็จเล็ก ๆ คือส่วนประกอบของความเปลี่ยนแปลงที่ยิ่งใหญ่", "เขียนหนึ่งสิ่งที่คุณทำสำเร็จในวันนี้", "วันนี้มีช่วงเวลาไหนที่คุณรู้สึกภูมิใจ?", "⭐"],
  ["ผ่านวันที่ยาก", "คุณเคยผ่านวันที่คิดว่าไม่ไหวมาแล้ว และครั้งนี้คุณก็จะค่อย ๆ ผ่านมันไปได้", "นึกถึงปัญหาเก่าหนึ่งเรื่องที่คุณเคยผ่านมา", "ประสบการณ์ที่ผ่านมาเคยสอนอะไรคุณ?", "⛰️"],
  ["ใจดีกับตัวเอง", "ลองพูดกับตัวเองเหมือนที่คุณพูดกับคนที่คุณรัก", "เปลี่ยนคำตำหนิตัวเองหนึ่งประโยคให้เป็นคำให้กำลังใจ", "ถ้าเพื่อนเจอเรื่องเดียวกัน คุณจะพูดกับเขาว่าอะไร?", "🤍"],
  ["ครึ่งทางแล้ว", "คุณเดินมาได้ครึ่งทางแล้ว ทุกวันที่ผ่านมาคือหลักฐานว่าคุณทำได้", "ให้รางวัลเล็ก ๆ กับตัวเองหนึ่งอย่าง", "ตลอด 15 วันที่ผ่านมา คุณค้นพบอะไรเกี่ยวกับตัวเอง?", "🎉"],
  ["วางสิ่งที่ควบคุมไม่ได้", "บางเรื่องไม่ได้ต้องการคำตอบ แต่อาจต้องการให้เราค่อย ๆ วางมันลง", "เขียนหนึ่งสิ่งที่ควบคุมไม่ได้ แล้วปล่อยวาง", "เรื่องใดที่คุณกำลังพยายามควบคุมมากเกินไป?", "🪶"],
  ["ขอความช่วยเหลือ", "คุณไม่จำเป็นต้องแบกทุกอย่างไว้เพียงคนเดียว", "ส่งข้อความหาใครสักคนที่คุณไว้ใจ", "มีใครที่คุณสามารถพูดคุยด้วยอย่างสบายใจ?", "🤝"],
  ["อยู่กับวันนี้", "อย่าใช้พลังของวันนี้ไปกังวลกับทุกเรื่องของวันพรุ่งนี้", "เลือกสิ่งสำคัญที่สุดของวันนี้เพียงหนึ่งอย่าง", "สิ่งเดียวที่สำคัญกับคุณในตอนนี้คืออะไร?", "🌤️"],
  ["ความกล้า", "ความกล้าไม่ใช่การไม่กลัว แต่คือการลงมือแม้ยังรู้สึกกลัว", "ทำสิ่งที่ลังเลมานานเพียงหนึ่งขั้นตอน", "มีเรื่องอะไรที่คุณอยากกล้าขึ้นอีกนิด?", "🐞"],
  ["พักระหว่างทาง", "การพักไม่ได้ทำให้เป้าหมายไกลขึ้น แต่ช่วยให้คุณมีแรงเดินต่อ", "ปิดหน้าจอและพักสายตาอย่างน้อย 20 นาที", "คุณสังเกตสัญญาณอะไรเมื่อร่างกายต้องการพัก?", "🌙"],
  ["ให้อภัยตัวเอง", "ตัวคุณในอดีตตัดสินใจด้วยความรู้และความรู้สึกที่มีในเวลานั้น", "เขียนหนึ่งเรื่องที่คุณพร้อมจะให้อภัยตัวเอง", "คุณกำลังลงโทษตัวเองจากเรื่องใดในอดีต?", "🕊️"],
  ["เลือกสิ่งที่ดีต่อใจ", "ไม่ใช่ทุกเรื่องที่คุณต้องตอบสนอง และไม่ใช่ทุกคนที่ต้องเข้าใจคุณ", "เว้นระยะจากสิ่งที่ทำให้เหนื่อยใจหนึ่งชั่วโมง", "สิ่งใดทำให้พลังใจของคุณลดลงมากที่สุด?", "🏡"],
  ["ความสุขเล็ก ๆ", "ความสุขไม่จำเป็นต้องยิ่งใหญ่ บางครั้งมันซ่อนอยู่ในช่วงเวลาธรรมดา", "จดหนึ่งสิ่งเล็ก ๆ ที่ทำให้คุณยิ้ม", "วันนี้มีรายละเอียดเล็ก ๆ อะไรที่ทำให้รู้สึกดี?", "🌸"],
  ["เป็นตัวเอง", "คุณไม่ต้องลดแสงของตัวเอง เพื่อทำให้ใครรู้สึกสบายใจ", "ทำสิ่งหนึ่งที่สะท้อนความเป็นตัวเอง", "มีด้านใดของตัวเองที่คุณอยากแสดงออกมากขึ้น?", "🌈"],
  ["ยอมรับการเปลี่ยนแปลง", "การเปลี่ยนแปลงอาจน่ากลัว แต่มันอาจพาคุณไปยังที่ที่เหมาะสมกว่าเดิม", "เขียนหนึ่งเรื่องที่อยากเปลี่ยน พร้อมก้าวแรก", "การเปลี่ยนแปลงแบบใดที่หัวใจกำลังเรียกร้อง?", "🦋"],
  ["ความพยายามไม่สูญเปล่า", "ผลลัพธ์ยังไม่มาถึง ไม่ได้หมายความว่าความพยายามของคุณไม่มีความหมาย", "จดหนึ่งสิ่งที่คุณยังพยายามทำต่อเนื่อง", "มีความพยายามใดที่อยากชื่นชมตัวเอง?", "👣"],
  ["พื้นที่ปลอดภัย", "คุณมีสิทธิ์สร้างชีวิตและพื้นที่ที่ทำให้หัวใจรู้สึกปลอดภัย", "จัดมุมเล็ก ๆ รอบตัวให้สะอาดและสบายขึ้น", "สถานที่หรือคนแบบใดทำให้คุณรู้สึกปลอดภัย?", "🛋️"],
  ["เชื่อในอนาคต", "ชีวิตยังมีเรื่องดีอีกมากที่คุณยังไม่เคยพบ", "เขียนหนึ่งสิ่งที่อยากพบหรือสัมผัสในอนาคต", "มีภาพอนาคตแบบใดที่ทำให้อยากเดินต่อ?", "🌌"],
  ["มองย้อนกลับ", "ลองหันกลับไปดู คุณเดินมาไกลกว่าที่ตัวเองคิดไว้มาก", "เปรียบเทียบความรู้สึกของวันแรกกับวันนี้", "สิ่งใดในตัวคุณเปลี่ยนไปมากที่สุดตลอด 29 วัน?", "🛣️"],
  ["ฉลองตัวเอง", "คุณไม่ได้แค่ผ่าน 30 วัน แต่พิสูจน์แล้วว่าตัวเองคู่ควรกับการดูแลและความอ่อนโยน", "เขียนจดหมายถึงตัวเองในอีก 30 วันข้างหน้า", "หลังจากวันนี้ คุณอยากดูแลหัวใจตัวเองต่ออย่างไร?", "🎇"],
].map(([title, message, mission, reflection, icon], index) => ({ day: index + 1, title, message, mission, reflection, icon }));

const moodLabels = ["😔 เหนื่อยมาก", "😐 เฉย ๆ", "🙂 เริ่มดีขึ้น", "😊 รู้สึกดี", "🤩 ดีมาก"];
const todayKey = () => new Date().toISOString().slice(0, 10);
const emptyEntry = (): Entry => ({ completed: false, note: "", favorite: false });

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function KindHeartPage() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("today");
  const [profile, setProfile] = useState<Profile>({ name: "คุณ", startDate: todayKey() });
  const [settings, setSettings] = useState<Settings>({ darkMode: false, reduceMotion: false, demoMode: false });
  const [entries, setEntries] = useState<Record<number, Entry>>({});
  const [selectedDay, setSelectedDay] = useState(1);
  const [showBreathe, setShowBreathe] = useState(false);

  useEffect(() => {
    setProfile(readJson(STORAGE.profile, { name: "คุณ", startDate: todayKey() }));
    setSettings(readJson(STORAGE.settings, { darkMode: false, reduceMotion: false, demoMode: false }));
    setEntries(readJson(STORAGE.entries, {}));
    setReady(true);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", settings.darkMode);
    if (ready) localStorage.setItem(STORAGE.settings, JSON.stringify(settings));
  }, [settings, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE.profile, JSON.stringify(profile));
  }, [profile, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE.entries, JSON.stringify(entries));
  }, [entries, ready]);

  const unlockedDay = useMemo(() => {
    if (settings.demoMode) return 30;
    const start = new Date(profile.startDate);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 86400000) + 1;
    return Math.min(30, Math.max(1, diff));
  }, [profile.startDate, settings.demoMode]);

  useEffect(() => setSelectedDay(unlockedDay), [unlockedDay]);

  const day = DAYS[selectedDay - 1] ?? DAYS[0];
  const entry = entries[selectedDay] ?? emptyEntry();
  const completedCount = Object.values(entries).filter((item) => item.completed).length;
  const noteCount = Object.values(entries).filter((item) => item.note.trim()).length;
  const favoriteCount = Object.values(entries).filter((item) => item.favorite).length;
  const progress = Math.round((completedCount / 30) * 100);
  const motionProps = settings.reduceMotion ? { initial: false, animate: undefined, exit: undefined } : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 } };

  function updateEntry(dayNo: number, patch: Partial<Entry>) {
    setEntries((old) => ({ ...old, [dayNo]: { ...(old[dayNo] ?? emptyEntry()), ...patch } }));
  }

  function startProgram() {
    const next = { name: profile.name || "คุณ", startDate: todayKey() };
    setProfile(next);
    localStorage.setItem(STORAGE.onboarding, "done");
  }

  function completeToday() {
    updateEntry(selectedDay, { completed: true, completedAt: new Date().toISOString() });
    if (navigator.vibrate) navigator.vibrate(40);
  }

  async function shareDay() {
    const text = `ใจดี 30 วัน — วันที่ ${day.day}: ${day.title}\n${day.message}`;
    if (navigator.share) {
      await navigator.share({ title: "ใจดี 30 วัน", text }).catch(() => undefined);
    } else {
      await navigator.clipboard?.writeText(text);
      alert("คัดลอกข้อความแล้ว");
    }
  }

  function speakDay() {
    if (!("speechSynthesis" in window)) return alert("เบราว์เซอร์นี้ยังไม่รองรับการอ่านข้อความ");
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(day.message);
    utterance.lang = "th-TH";
    speechSynthesis.speak(utterance);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ profile, settings, entries }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "jaidee-30-days-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const payload = JSON.parse(await file.text()) as { profile?: Profile; settings?: Settings; entries?: Record<number, Entry> };
    if (payload.profile) setProfile(payload.profile);
    if (payload.settings) setSettings(payload.settings);
    if (payload.entries) setEntries(payload.entries);
  }

  function resetData() {
    if (!confirm("ต้องการล้างข้อมูลทั้งหมดใช่ไหม?")) return;
    localStorage.clear();
    setEntries({});
    setProfile({ name: "คุณ", startDate: todayKey() });
    setSettings({ darkMode: false, reduceMotion: false, demoMode: false });
    setSelectedDay(1);
  }

  if (!ready) return <main className="mobile-shell"><section className="glass card">กำลังเตรียมพื้นที่เล็ก ๆ ให้หัวใจ...</section></main>;

  return (
    <main className="mobile-shell">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">สวัสดี {profile.name || "คุณ"}</p>
          <h1 className="text-3xl font-black tracking-tight">ใจดี 30 วัน</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">วันละหนึ่งกำลังใจ เพื่อกลับมาดูแลตัวเองอีกครั้ง</p>
        </div>
        <div className="grid h-14 w-14 place-items-center rounded-3xl bg-white/70 text-2xl shadow">🌷</div>
      </header>

      {!localStorage.getItem(STORAGE.onboarding) ? (
        <motion.section className="glass card space-y-5" {...motionProps}>
          <div className="text-6xl">🌱</div>
          <h2 className="text-2xl font-black">วันนี้ไม่ต้องเก่งที่สุดก็ได้</h2>
          <p className="text-[var(--text-secondary)]">แค่ยังอยู่ตรงนี้และพยายามต่อก็เพียงพอแล้ว เว็บนี้จะเก็บข้อมูลไว้บนอุปกรณ์ของคุณเท่านั้น</p>
          <input className="input" value={profile.name === "คุณ" ? "" : profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value || "คุณ" })} placeholder="ชื่อเล่นของคุณ" aria-label="ชื่อเล่น" />
          <button className="primary-btn" onClick={startProgram}>เริ่มดูแลใจตัวเอง</button>
        </motion.section>
      ) : (
        <AnimatePresence mode="wait">
          {tab === "today" && (
            <motion.section key="today" className="space-y-4" {...motionProps}>
              <div className="glass card space-y-3">
                <div className="flex items-center justify-between"><b>วันที่ {selectedDay} จาก 30</b><span>{progress}%</span></div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
                <p className="text-sm text-[var(--text-secondary)]">กลับมาต่อได้เสมอ ทุกก้าวเล็ก ๆ มีความหมาย</p>
              </div>

              <div className="glass card space-y-4">
                <div className="flex items-center justify-between gap-3"><div className="text-6xl">{day.icon}</div><button className="icon-btn" onClick={() => updateEntry(selectedDay, { favorite: !entry.favorite })} aria-label="บันทึกรายการโปรด"><Heart fill={entry.favorite ? "currentColor" : "none"} /></button></div>
                <p className="text-sm font-bold text-[var(--primary)]">วันที่ {day.day} — {day.title}</p>
                <h2 className="text-2xl font-black leading-snug">{day.message}</h2>
                <div className="flex gap-2"><button className="soft-btn" onClick={speakDay}><Mic2 size={18} /> อ่าน</button><button className="soft-btn" onClick={shareDay}><Share2 size={18} /> แชร์</button></div>
              </div>

              <div className="glass card space-y-4">
                <h3 className="text-xl font-black">ภารกิจเล็ก ๆ ของวันนี้</h3>
                <p>{day.mission}</p>
                <button className="primary-btn" onClick={completeToday}>{entry.completed ? "สำเร็จแล้ว เก่งมาก" : "ทำสำเร็จแล้ว"}</button>
              </div>

              <div className="glass card space-y-4">
                <h3 className="text-xl font-black">ตอนนี้คุณรู้สึกอย่างไร?</h3>
                <div className="grid grid-cols-2 gap-2">
                  {moodLabels.map((label, index) => <button key={label} className={`mood-btn ${entry.mood === index + 1 ? "selected" : ""}`} onClick={() => updateEntry(selectedDay, { mood: index + 1 })}>{label}</button>)}
                </div>
              </div>

              <div className="glass card space-y-3">
                <h3 className="text-xl font-black">อยากบอกอะไรกับตัวเองไหม?</h3>
                <p className="text-sm text-[var(--text-secondary)]">{day.reflection}</p>
                <textarea className="textarea" maxLength={1000} value={entry.note} onChange={(e) => updateEntry(selectedDay, { note: e.target.value })} placeholder="เขียนบันทึกเล็ก ๆ ให้ตัวเอง..." aria-label="บันทึกใจ" />
                <p className="text-right text-xs text-[var(--text-soft)]">บันทึกอัตโนมัติ · {entry.note.length}/1000</p>
              </div>

              <button className="primary-btn" onClick={() => setShowBreathe(true)}>เปิดโหมดหายใจ 4-2-6</button>
            </motion.section>
          )}

          {tab === "calendar" && (
            <motion.section key="calendar" className="glass card space-y-4" {...motionProps}>
              <h2 className="text-2xl font-black">ปฏิทิน 30 วัน</h2>
              <p className="text-sm text-[var(--text-secondary)]">คุณไม่ได้แข่งขันกับใคร ทุกช่องที่เติมเต็มคือสิ่งที่คุณมอบให้ตัวเอง</p>
              <div className="day-grid">
                {DAYS.map((item) => {
                  const locked = item.day > unlockedDay;
                  const itemEntry = entries[item.day];
                  return <button key={item.day} className={`day-cell ${itemEntry?.completed ? "done" : ""} ${item.day === selectedDay ? "today" : ""} ${locked ? "locked" : ""}`} disabled={locked} onClick={() => { setSelectedDay(item.day); setTab("today"); }}><span>{locked ? "🔒" : item.day}</span><small>{itemEntry?.note ? "•" : itemEntry?.favorite ? "♥" : ""}</small></button>;
                })}
              </div>
            </motion.section>
          )}

          {tab === "journal" && (
            <motion.section key="journal" className="space-y-3" {...motionProps}>
              <h2 className="text-2xl font-black">บันทึกใจ</h2>
              {DAYS.filter((item) => entries[item.day]?.note?.trim()).length === 0 && <div className="glass card">พื้นที่นี้ยังว่างอยู่ เมื่อพร้อม ลองเขียนอะไรเล็ก ๆ ให้ตัวเองดูนะ</div>}
              {DAYS.filter((item) => entries[item.day]?.note?.trim()).reverse().map((item) => <article key={item.day} className="glass card space-y-2" onClick={() => { setSelectedDay(item.day); setTab("today"); }}><b>วันที่ {item.day}: {item.title}</b><p className="text-sm text-[var(--text-secondary)]">{entries[item.day]?.note}</p></article>)}
            </motion.section>
          )}

          {tab === "me" && (
            <motion.section key="me" className="space-y-4" {...motionProps}>
              <div className="glass card space-y-3">
                <h2 className="text-2xl font-black">ตัวฉัน</h2>
                <input className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} aria-label="ชื่อเล่น" />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-3xl bg-white/50 p-4"><b>{completedCount}</b><br />วันที่สำเร็จ</div>
                  <div className="rounded-3xl bg-white/50 p-4"><b>{noteCount}</b><br />บันทึก</div>
                  <div className="rounded-3xl bg-white/50 p-4"><b>{favoriteCount}</b><br />ข้อความโปรด</div>
                  <div className="rounded-3xl bg-white/50 p-4"><b>{progress}%</b><br />ความคืบหน้า</div>
                </div>
              </div>
              <div className="glass card space-y-3">
                <h3 className="text-xl font-black">Achievement Badges</h3>
                <p>{completedCount >= 1 ? "🏅 ก้าวแรก" : "🔒 ก้าวแรก"}</p>
                <p>{completedCount >= 7 ? "🌟 หนึ่งสัปดาห์ของเรา" : "🔒 หนึ่งสัปดาห์ของเรา"}</p>
                <p>{completedCount >= 15 ? "🎉 ครึ่งทางแล้วนะ" : "🔒 ครึ่งทางแล้วนะ"}</p>
                <p>{completedCount >= 30 ? "💜 ใจดีครบ 30 วัน" : "🔒 ใจดีครบ 30 วัน"}</p>
              </div>
              <div className="glass card space-y-3">
                <h3 className="text-xl font-black">ตั้งค่าและข้อมูล</h3>
                <label className="flex items-center justify-between gap-3"><span>Dark Mode</span><input type="checkbox" checked={settings.darkMode} onChange={(e) => setSettings({ ...settings, darkMode: e.target.checked })} /></label>
                <label className="flex items-center justify-between gap-3"><span>Reduce Motion</span><input type="checkbox" checked={settings.reduceMotion} onChange={(e) => setSettings({ ...settings, reduceMotion: e.target.checked })} /></label>
                <label className="flex items-center justify-between gap-3"><span>โหมดทดลองดูครบ 30 วัน</span><input type="checkbox" checked={settings.demoMode} onChange={(e) => setSettings({ ...settings, demoMode: e.target.checked })} /></label>
                <button className="soft-btn w-full" onClick={exportData}><Download size={18} /> Export JSON</button>
                <input className="input" type="file" accept="application/json" onChange={importData} aria-label="Import JSON" />
                <button className="soft-btn w-full" onClick={resetData}><RefreshCcw size={18} /> ล้างข้อมูลทั้งหมด</button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      )}

      <AnimatePresence>
        {showBreathe && <motion.div className="fixed inset-0 z-40 grid place-items-center bg-[#171329]/90 p-6 text-center text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><div className="space-y-8"><motion.div className="mx-auto grid h-48 w-48 place-items-center rounded-full bg-white/20 text-5xl" animate={settings.reduceMotion ? {} : { scale: [1, 1.25, 1.25, 1] }} transition={{ duration: 12, repeat: Infinity }}>🌬️</motion.div><h2 className="text-3xl font-black">หายใจเข้า 4 · กลั้น 2 · ออก 6</h2><p>คุณทำได้ดีมาก ค่อย ๆ วางทุกเรื่องลงก่อน</p><button className="primary-btn" onClick={() => setShowBreathe(false)}>กลับมา</button></div></motion.div>}
      </AnimatePresence>

      <nav className="bottom-nav" aria-label="เมนูหลัก">
        {[
          ["today", Home, "วันนี้"],
          ["calendar", CalendarDays, "30 วัน"],
          ["journal", BookHeart, "บันทึกใจ"],
          ["me", UserRound, "ตัวฉัน"],
        ].map(([key, Icon, label]) => {
          const I = Icon as typeof Home;
          return <button key={key as string} className={`nav-item ${tab === key ? "active" : ""}`} onClick={() => setTab(key as Tab)}><I size={20} />{label as string}</button>;
        })}
      </nav>
    </main>
  );
}
