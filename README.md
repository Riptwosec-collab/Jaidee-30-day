# ใจดี 30 วัน

เว็บแอป Mobile-first สำหรับรับกำลังใจวันละ 1 ชุด เป็นเวลา 30 วัน พร้อมภารกิจเล็ก ๆ, Mood Check-in, บันทึกใจ, ปฏิทิน, รายการโปรด, สถิติ, Badge, Share Card และ PWA

## Tech Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React
- LocalStorage
- Web Speech API
- Web Share API
- Canvas Share Card
- Service Worker + Web App Manifest

## โครงสร้างไฟล์หลัก

```text
jaidee-30-days/
  package.json
  next.config.ts
  tsconfig.json
  tailwind.config.ts
  postcss.config.mjs
  public/
    manifest.json
    sw.js
    icons/
      icon-192.png
      icon-512.png
  src/
    app/
      layout.tsx
      page.tsx
      globals.css
    components/
      KindHeartApp.tsx
    data/
      encouragement.ts
    lib/
      storage.ts
      shareCard.ts
```

## วิธีติดตั้งและรัน

```bash
npm install
npm run dev
```

เปิดเว็บที่:

```text
http://localhost:3000
```

## Build Production

```bash
npm run build
npm run start
```

## Deploy ขึ้น Vercel

1. Push โปรเจกต์นี้ขึ้น GitHub
2. เข้า Vercel แล้วกด **Add New Project**
3. เลือก Repository `jaidee-30-days`
4. Framework Preset: **Next.js**
5. กด Deploy

ไม่ต้องตั้งค่า Environment Variables เพราะเวอร์ชันนี้ใช้ LocalStorage และไม่มี Backend

## ฟังก์ชันสำคัญอยู่ไฟล์ไหน

| ฟังก์ชัน | ไฟล์ |
|---|---|
| หน้าหลักทั้งหมด, Navigation, Calendar, Journal, Stats, Settings | `src/components/KindHeartApp.tsx` |
| ข้อมูลกำลังใจ 30 วัน | `src/data/encouragement.ts` |
| LocalStorage, Data Model, Export Payload | `src/lib/storage.ts` |
| Canvas Share Card | `src/lib/shareCard.ts` |
| Theme, Mobile-first CSS, Safe Area | `src/app/globals.css` |
| PWA Manifest | `public/manifest.json` |
| Offline Cache | `public/sw.js` |

## LocalStorage Keys

```ts
kindheart30_profile
kindheart30_settings
kindheart30_progress
kindheart30_daily_entries
kindheart30_favorites
kindheart30_achievements
kindheart30_onboarding
```

## ตัวอย่างการทดสอบ

1. เปิดเว็บครั้งแรก จะเห็น Splash Screen และ Onboarding
2. กด “เริ่มดูแลใจตัวเอง”
3. เลือกอารมณ์ในหน้า “วันนี้”
4. เขียนบันทึก แล้ว Refresh เพื่อเช็กว่าข้อมูลไม่หาย
5. กด “ทำสำเร็จแล้ว” เพื่ออัปเดต Progress และ Calendar
6. กดหัวใจเพื่อเพิ่มรายการโปรด
7. ไปที่ “ตัวฉัน” → “ข้อมูล” → เปิด “โหมดทดลองดูครบ 30 วัน” เพื่อดูทุกวัน
8. ทดสอบ Export / Import JSON
9. กด “สร้างภาพแชร์” เพื่อดาวน์โหลด PNG
10. ทดสอบ Add to Home Screen บนมือถือ

## หมายเหตุ

- ข้อมูลบันทึกถูกเก็บในเครื่องผู้ใช้เท่านั้น ไม่ส่งขึ้น Server
- Notification permission ขอสิทธิ์อย่างสุภาพ และไม่บันทึกข้อความส่วนตัวใน Notification
- เสียงพื้นหลังเป็นตัวเลือก UI ในเวอร์ชันนี้ ยังไม่แนบไฟล์เสียงจริง เพื่อหลีกเลี่ยงการเปิดเสียงอัตโนมัติและลดขนาดโปรเจกต์
- หาก Browser ไม่รองรับ Web Speech API หรือ Web Share API ระบบจะ fallback เป็นข้อความแจ้งหรือคัดลอกข้อความแทน
