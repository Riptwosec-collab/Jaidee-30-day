import type { Metadata, Viewport } from "next";
import ThemeBridge from "./ThemeBridge";
import "./globals.css";
import "./extras.css";
import "./readability.css";
import "./nav-readability.css";

export const metadata: Metadata = {
  title: "ใจดี 30 วัน",
  description: "วันละหนึ่งกำลังใจ เพื่อกลับมารักและดูแลตัวเองอีกครั้ง",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#8374e8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        {children}
        <ThemeBridge />
      </body>
    </html>
  );
}
