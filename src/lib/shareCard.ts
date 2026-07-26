import type { EncouragementDay } from "@/data/encouragement";
import type { UserProfile } from "@/lib/storage";

export type ShareCardSize = "story" | "square" | "wallpaper";
export type ShareCardTheme = "peach" | "lavender" | "night" | "cream";

export type ShareCardOptions = {
  size?: ShareCardSize;
  theme?: ShareCardTheme;
  showName?: boolean;
  showDay?: boolean;
};

const SIZES: Record<ShareCardSize, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  wallpaper: { width: 1290, height: 2796 },
};

const THEMES: Record<ShareCardTheme, [string, string, string]> = {
  peach: ["#fff7ec", "#ffe5dc", "#f2eaff"],
  lavender: ["#f9f4ff", "#eee7ff", "#ffdfe0"],
  night: ["#211a3e", "#433274", "#f0d6ff"],
  cream: ["#fffaf2", "#fff0dd", "#f8e8ff"],
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const chars = Array.from(text);
  const lines: string[] = [];
  let line = "";
  chars.forEach((char) => {
    const candidate = `${line}${char}`;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function normalizeOptions(options?: ShareCardOptions | ShareCardSize): Required<ShareCardOptions> {
  if (typeof options === "string") {
    return { size: options, theme: "peach", showName: true, showDay: true };
  }
  return {
    size: options?.size ?? "story",
    theme: options?.theme ?? "peach",
    showName: options?.showName ?? true,
    showDay: options?.showDay ?? true,
  };
}

export function createShareCard(day: EncouragementDay, profile: UserProfile, options?: ShareCardOptions | ShareCardSize): string {
  const normalized = normalizeOptions(options);
  const { width, height } = SIZES[normalized.size];
  const palette = THEMES[normalized.theme];
  const isNight = normalized.theme === "night";
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported on this device.");

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, palette[0]);
  gradient.addColorStop(0.52, palette[1]);
  gradient.addColorStop(1, palette[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 60; i += 1) {
    ctx.fillStyle = isNight ? "rgba(255,255,255,.78)" : "rgba(255,255,255,.72)";
    ctx.beginPath();
    ctx.arc((i * 173) % width, (i * 251) % height, 2 + (i % 4), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = isNight ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.72)";
  ctx.beginPath();
  ctx.roundRect(width * 0.09, height * 0.13, width * 0.82, height * 0.66, 72);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.fillStyle = isNight ? "#fff8ff" : "#6f57bd";
  ctx.font = `800 ${Math.round(width * 0.06)}px sans-serif`;
  ctx.fillText("ใจดี 30 วัน", width / 2, height * 0.2);

  ctx.font = `${Math.round(width * 0.15)}px sans-serif`;
  ctx.fillText(day.icon, width / 2, height * 0.32);

  ctx.fillStyle = isNight ? "#fff8ff" : "#2f2955";
  ctx.font = `800 ${Math.round(width * 0.052)}px sans-serif`;
  const title = normalized.showDay ? `วันที่ ${day.day} — ${day.title}` : day.title;
  ctx.fillText(title, width / 2, height * 0.41);

  ctx.font = `700 ${Math.round(width * 0.047)}px sans-serif`;
  wrapText(ctx, day.message, width * 0.68).slice(0, 6).forEach((line, index) => {
    ctx.fillText(line, width / 2, height * 0.5 + index * Math.round(width * 0.064));
  });

  ctx.fillStyle = isNight ? "#dbcfff" : "#81768f";
  ctx.font = `600 ${Math.round(width * 0.032)}px sans-serif`;
  if (normalized.showName) ctx.fillText(`มอบให้ ${profile.name || "คุณ"}`, width / 2, height * 0.73);
  ctx.fillText("เก็บไว้เตือนใจในวันที่ต้องการ", width / 2, height * 0.86);

  return canvas.toDataURL("image/png");
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
