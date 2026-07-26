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

export function getTimeGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return "สวัสดีตอนเช้า วันนี้เริ่มใหม่ได้เสมอ";
  if (hour >= 11 && hour < 17) return "พักหายใจสักนิด คุณทำได้ดีมากแล้ว";
  if (hour >= 17 && hour < 20) return "ขอบคุณตัวเองที่ผ่านวันนี้มาได้";
  return "คืนนี้วางทุกเรื่องลงก่อน แล้วพักให้เต็มที่นะ";
}
