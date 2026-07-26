import type { EncouragementDay } from "@/data/encouragement";
import type { UserProfile } from "@/lib/storage";

export type ShareCardSize = "story" | "square" | "wallpaper";

const SIZES: Record<ShareCardSize, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  wallpaper: { width: 1290, height: 2796 },
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  return lines;
}

export function createShareCard(day: EncouragementDay, profile: UserProfile, size: ShareCardSize = "story"): string {
  const { width, height } = SIZES[size];
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported on this device.");

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#fff9f5");
  gradient.addColorStop(0.48, "#f2edff");
  gradient.addColorStop(1, "#ffe0d7");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255,255,255,0.68)";
  ctx.beginPath();
  ctx.roundRect(width * 0.09, height * 0.12, width * 0.82, height * 0.68, 72);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.fillStyle = "#8374e8";
  ctx.font = `700 ${Math.round(width * 0.05)}px sans-serif`;
  ctx.fillText("ใจดี 30 วัน", width / 2, height * 0.19);

  ctx.font = `${Math.round(width * 0.13)}px sans-serif`;
  ctx.fillText(day.icon, width / 2, height * 0.31);

  ctx.fillStyle = "#302d3b";
  ctx.font = `800 ${Math.round(width * 0.056)}px sans-serif`;
  ctx.fillText(`วันที่ ${day.day} — ${day.title}`, width / 2, height * 0.4);

  ctx.font = `700 ${Math.round(width * 0.052)}px sans-serif`;
  wrapText(ctx, day.message, width * 0.68).slice(0, 5).forEach((line, index) => {
    ctx.fillText(line, width / 2, height * 0.49 + index * Math.round(width * 0.073));
  });

  ctx.fillStyle = "#767180";
  ctx.font = `500 ${Math.round(width * 0.032)}px sans-serif`;
  ctx.fillText(`มอบให้ ${profile.name || "คุณ"}`, width / 2, height * 0.72);
  ctx.fillText("เก็บไว้เตือนใจในวันที่ต้องการ", width / 2, height * 0.86);

  return canvas.toDataURL("image/png");
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
