export type TimeTheme = "morning" | "day" | "evening" | "night";

export function daysBetween(startDate: string, current = new Date()): number {
  const start = new Date(`${startDate}T00:00:00`);
  const now = new Date(current.getFullYear(), current.getMonth(), current.getDate());
  if (Number.isNaN(start.getTime())) return 0;
  const diff = now.getTime() - start.getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}

export function getUnlockedDay(startDate: string, demoMode = false): number {
  if (demoMode) return 30;
  return Math.min(30, daysBetween(startDate) + 1);
}

export function formatThaiDate(date = new Date()): string {
  return new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function getTimeTheme(date = new Date()): TimeTheme {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "evening";
  return "night";
}

export function getTimeGreeting(date = new Date()): string {
  const theme = getTimeTheme(date);
  if (theme === "morning") return "สวัสดีตอนเช้า วันนี้เริ่มใหม่ได้เสมอ";
  if (theme === "day") return "พักหายใจสักนิด คุณทำได้ดีมากแล้ว";
  if (theme === "evening") return "ขอบคุณตัวเองที่ผ่านวันนี้มาได้";
  return "คืนนี้วางทุกเรื่องลงก่อน แล้วพักให้เต็มที่นะ";
}

export function getThemeLabel(theme: TimeTheme): string {
  if (theme === "morning") return "Sunrise Cream";
  if (theme === "day") return "Soft Sky";
  if (theme === "evening") return "Sunset Peach";
  return "Lavender Night";
}
