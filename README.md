# ใจดี 30 วัน

เว็บแอป Mobile-first สำหรับรับกำลังใจวันละ 1 ชุด เป็นเวลา 30 วัน พร้อมภารกิจเล็ก ๆ, Mood Check-in, บันทึกใจ, ปฏิทิน, รายการโปรด, สถิติ, Badge, Share Card, Google Drive Cloud Backup, ระบบโลกของฉัน และ PWA

## Tech Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React
- LocalStorage พร้อม validation และ schema version
- Google Identity Services + Google Drive API v3 สำหรับ Cloud Backup แบบไฟล์ปกติ
- Web Speech API
- Web Share API
- Canvas Share Card
- Service Worker + Web App Manifest
- GitHub Actions CI

## โครงสร้างไฟล์หลัก

```text
jaidee-30-days/
  .github/workflows/ci.yml
  .env.example
  package.json
  next.config.ts
  tsconfig.json
  tailwind.config.ts
  postcss.config.mjs
  public/
    manifest.json
    sw.js
    offline.html
    icons/
      icon.svg
  src/
    app/
      layout.tsx
      page.tsx
      globals.css
      cloud-backup.css
      my-world.css
      my-world-access.css
    components/
      jaidee/
        JaideeApp.tsx
        GoogleDriveBackupPanel.tsx
        MyWorldGlobalAccess.tsx
        MyWorldPanel.tsx
    data/
      encouragement.ts
      myWorld.ts
    lib/
      dates.ts
      storage.ts
      googleDriveBackup.ts
      myWorldStorage.ts
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
3. เลือก Repository `Jaidee-30-day`
4. Framework Preset: **Next.js**
5. หากใช้ Google Drive Backup ให้เพิ่ม Environment Variable `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
6. กด Deploy

## ระบบโลกของฉัน

เพิ่มระบบใหม่ **โลกของฉัน** เป็นพื้นที่เล็ก ๆ ที่เติบโตขึ้นทุกครั้งที่ผู้ใช้ดูแลตัวเอง โดยไม่ลบหรือเปลี่ยนระบบ 30 วันเดิม

ฟีเจอร์เวอร์ชันแรก:

- Onboarding เลือกเพื่อนตัวน้อย 4 ตัว: ลูกหมา, แมว, แพนด้า, คาปิบาร่า
- ตั้งชื่อสัตว์เลี้ยง พร้อมชื่อแนะนำ เช่น โมจิ มะลิ โกโก้ เมฆ มูน
- Pet Dashboard พร้อม Level, XP, Speech Bubble และค่าสัตว์ด้านบวกเท่านั้น
- Resource Bar: หยดน้ำ, ดาวใจดี, หัวใจมิตรภาพ, เมล็ดพันธุ์
- สวนใจของฉัน: 4 แปลงเริ่มต้น ปลูก/รดน้ำ/เก็บเกี่ยวได้ พืชไม่ตายและไม่ลดระดับ
- บ้านเล็กของเรา: preview ห้องและของตกแต่งที่ปลดล็อก
- มินิเกมผ่อนคลาย 5 เกม: ดาวของวันนี้, เป่าปุยเมฆ, จัดมุมใจ, ครัวอบอุ่น, จับคู่ความรู้สึก
- Inbox จดหมายต้อนรับและ Achievement เบื้องต้น
- บันทึกข้อมูลถาวรใน LocalStorage key `kindheart30_my_world`
- Google Drive Backup จะรวมข้อมูลโลกของฉันไว้ใน `jaidee-backup.json` ด้วย

การออกแบบทำตามหลัก mobile-first, ใช้ safe area, bottom-sheet/drawer สำหรับมือถือ และ adaptive drawer สำหรับ tablet/desktop

## Google Drive Backup Setup

ระบบ Cloud Backup ใช้ Google Drive ของผู้ใช้แต่ละคนโดยตรง และสร้างไฟล์ที่ผู้ใช้เห็นได้ใน Drive:

```text
Google Drive/
  Jaidee 30 Days/
    jaidee-backup.json
```

### 1. สร้าง OAuth Client ID

1. เข้า Google Cloud Console
2. สร้างหรือเลือก Project
3. ไปที่ **APIs & Services → Library**
4. เปิดใช้งาน **Google Drive API**
5. ไปที่ **APIs & Services → Credentials**
6. สร้าง **OAuth Client ID** ชนิด **Web application**
7. เพิ่ม Authorized JavaScript origins เช่น:

```text
http://localhost:3000
https://your-vercel-domain.vercel.app
```

8. คัดลอก Client ID มาใส่ใน `.env.local`

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

9. Restart dev server

```bash
npm run dev
```

### 2. วิธีใช้งานในแอป

1. กดปุ่ม Cloud ด้านบนของแอป
2. กด **เชื่อมต่อ Google Drive**
3. กด **Backup Now** เพื่อสร้าง/อัปเดตไฟล์ `jaidee-backup.json`
4. กด **Restore from Google Drive** เพื่อดึงข้อมูลกลับเข้า LocalStorage
5. เปิด **Auto Backup** ได้หลังเชื่อมต่อ Google Drive แล้ว

### 3. Privacy

- แอปไม่ใช้ database กลางสำหรับ Cloud Backup
- ข้อมูล backup ถูกเก็บใน Google Drive ของผู้ใช้นั้น ๆ
- แอปขอ scope `https://www.googleapis.com/auth/drive.file`
- Access token ถูกเก็บเฉพาะใน React state/memory ของ session ปัจจุบัน
- ไม่บันทึก access token ลง LocalStorage
- ไฟล์ backup ใช้ schema เดียวกับ Export/Import JSON เดิม และเพิ่ม field `myWorld` สำหรับข้อมูลโลกของฉัน

## ฟังก์ชันสำคัญอยู่ไฟล์ไหน

| ฟังก์ชัน | ไฟล์ |
|---|---|
| Shell หลัก, Navigation, Today, Calendar, Journal, Stats, Settings | `src/components/jaidee/JaideeApp.tsx` |
| โลกของฉัน Global Access | `src/components/jaidee/MyWorldGlobalAccess.tsx` |
| โลกของฉัน Dashboard | `src/components/jaidee/MyWorldPanel.tsx` |
| ข้อมูลสัตว์/สวน/บ้าน/มินิเกม | `src/data/myWorld.ts` |
| LocalStorage และ migration ของโลกของฉัน | `src/lib/myWorldStorage.ts` |
| Google Drive Backup UI | `src/components/jaidee/GoogleDriveBackupPanel.tsx` |
| Google Drive OAuth/Drive API helper | `src/lib/googleDriveBackup.ts` |
| ข้อมูลกำลังใจ 30 วัน | `src/data/encouragement.ts` |
| LocalStorage, Data Model, Validation, Export/Import | `src/lib/storage.ts` |
| Date unlock, Thai date, greeting | `src/lib/dates.ts` |
| Canvas Share Card | `src/lib/shareCard.ts` |
| Theme, Mobile-first CSS, Safe Area, Breathing UI | `src/app/globals.css` |
| Cloud Backup styles | `src/app/cloud-backup.css` |
| My World styles | `src/app/my-world.css`, `src/app/my-world-access.css` |
| PWA Manifest | `public/manifest.json` |
| Offline Cache | `public/sw.js` |
| Offline fallback | `public/offline.html` |
| Build check | `.github/workflows/ci.yml` |

## LocalStorage Keys

```ts
kindheart30_profile
kindheart30_settings
kindheart30_daily_entries
kindheart30_onboarding
kindheart30_cloud_backup_status
kindheart30_my_world
```

## ตัวอย่างการทดสอบ

1. เปิดเว็บครั้งแรก จะเห็น Splash Screen และ Onboarding
2. กด “เริ่มดูแลใจตัวเอง”
3. เลือกอารมณ์ในหน้า “วันนี้”
4. เขียนบันทึก แล้ว Refresh เพื่อเช็กว่าข้อมูลไม่หาย
5. กด “ทำสำเร็จแล้ว” เพื่ออัปเดต Progress และ Calendar
6. กดหัวใจเพื่อเพิ่มรายการโปรด
7. กดปุ่ม “โลกของฉัน” เหนือ bottom navigation
8. เลือกสัตว์เริ่มต้นและตั้งชื่อ
9. ทดสอบลูบหัว ให้อาหาร เล่นด้วย ปลูก/รดน้ำ/เก็บเกี่ยว และเล่นมินิเกม
10. Refresh หน้า แล้วตรวจว่าโลกของฉันยังไม่หาย
11. ไปที่ “ตัวฉัน” → เปิด “โหมดทดลองดูครบ 30 วัน” เพื่อดูทุกวัน
12. ทดสอบ Export / Import JSON
13. กด Cloud → เชื่อมต่อ Google Drive → Backup Now
14. ตรวจใน Google Drive ว่ามีโฟลเดอร์ `Jaidee 30 Days` และไฟล์ `jaidee-backup.json`
15. ทดสอบ Restore from Google Drive แล้วข้อมูลโลกของฉันกลับมาด้วย
16. กด “สร้างภาพแชร์” เพื่อดาวน์โหลด PNG
17. ทดสอบ Add to Home Screen บนมือถือ
18. ตรวจ GitHub Actions ว่า `npm run build` ผ่านหลัง push

## CI

ทุกครั้งที่ push เข้า `main` หรือเปิด Pull Request ระบบจะรัน:

```bash
npm install
npm run build
```

## หมายเหตุ

- ข้อมูลบันทึกถูกเก็บในเครื่องผู้ใช้ และสามารถสำรองไป Google Drive ของผู้ใช้เองได้
- Import JSON และ Restore from Google Drive จะตรวจ `schemaVersion` ก่อนเขียนข้อมูลกลับเข้า LocalStorage
- ระบบโลกของฉันใช้ค่าด้านบวกเท่านั้น ไม่มีการลงโทษ ไม่มีพืชตาย และไม่มีสัตว์เศร้า
- Service Worker มี offline fallback สำหรับกรณีไม่มีอินเทอร์เน็ต
- เสียงพื้นหลังเป็นตัวเลือก UI ในเวอร์ชันนี้ ยังไม่แนบไฟล์เสียงจริง เพื่อหลีกเลี่ยงการเปิดเสียงอัตโนมัติและลดขนาดโปรเจกต์
- หาก Browser ไม่รองรับ Web Speech API หรือ Web Share API ระบบจะ fallback เป็นข้อความแจ้งหรือคัดลอกข้อความแทน
