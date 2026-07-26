"use client";

import { Cloud, CloudUpload, DownloadCloud, RefreshCw, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  GOOGLE_DRIVE_BACKUP_FILE_NAME,
  GOOGLE_DRIVE_FOLDER_NAME,
  backupToGoogleDrive,
  downloadBackupPayload,
  formatBackupDate,
  formatGoogleDriveError,
  hasGoogleClientId,
  readCloudBackupStatus,
  requestGoogleDriveAccessToken,
  writeCloudBackupStatus,
  type GoogleDriveBackupStatus,
} from "@/lib/googleDriveBackup";
import {
  buildExportPayload,
  readDailyEntries,
  readProfile,
  readSettings,
  validateImportPayload,
  writeDailyEntries,
  writeProfile,
  writeSettings,
} from "@/lib/storage";

function createLocalSnapshot(): string {
  return JSON.stringify({
    profile: readProfile(),
    settings: readSettings(),
    dailyEntries: readDailyEntries(),
  });
}

function createExportPayloadFromLocalStorage() {
  return buildExportPayload(readProfile(), readSettings(), readDailyEntries());
}

export default function GoogleDriveBackupPanel() {
  const [open, setOpen] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [status, setStatus] = useState<GoogleDriveBackupStatus>(() => ({ cloudBackupEnabled: false }));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("ข้อมูลจะถูกสำรองเป็นไฟล์ JSON ใน Google Drive ของคุณเอง");
  const [error, setError] = useState("");
  const lastSnapshotRef = useRef("");
  const autoBackupTimerRef = useRef<number | null>(null);
  const hasClientId = hasGoogleClientId();
  const connected = Boolean(accessToken);

  useEffect(() => {
    const nextStatus = readCloudBackupStatus();
    setStatus(nextStatus);
    lastSnapshotRef.current = createLocalSnapshot();
  }, []);

  const statusText = useMemo(() => {
    if (!hasClientId) return "ยังไม่ได้ตั้งค่า Google Client ID";
    if (!connected) return "ยังไม่ได้เชื่อมต่อ Google Drive";
    return "เชื่อมต่อ Google Drive แล้ว";
  }, [connected, hasClientId]);

  function persistStatus(next: GoogleDriveBackupStatus) {
    setStatus(next);
    writeCloudBackupStatus(next);
  }

  async function connectGoogleDrive() {
    setBusy(true);
    setError("");
    try {
      const token = await requestGoogleDriveAccessToken();
      setAccessToken(token);
      setMessage("เชื่อมต่อ Google Drive แล้ว สามารถ Backup หรือ Restore ได้เลย");
    } catch (err) {
      setError(formatGoogleDriveError(err));
    } finally {
      setBusy(false);
    }
  }

  async function runBackup(options?: { silent?: boolean }) {
    if (!accessToken) {
      if (!options?.silent) setError("กรุณาเชื่อมต่อ Google Drive ก่อนสำรองข้อมูล");
      return;
    }

    if (!options?.silent) {
      setBusy(true);
      setError("");
    }

    try {
      const result = await backupToGoogleDrive(accessToken, createExportPayloadFromLocalStorage());
      const nextStatus = {
        ...readCloudBackupStatus(),
        cloudBackupEnabled: true,
        lastCloudBackupAt: result.backedUpAt,
        lastCloudBackupFileId: result.fileId,
        lastCloudBackupFolderId: result.folderId,
      };
      persistStatus(nextStatus);
      lastSnapshotRef.current = createLocalSnapshot();
      if (!options?.silent) setMessage("สำรองข้อมูลไปยัง Google Drive แล้ว");
    } catch (err) {
      if (!options?.silent) setError(formatGoogleDriveError(err));
    } finally {
      if (!options?.silent) setBusy(false);
    }
  }

  async function restoreFromGoogleDrive() {
    if (!accessToken) {
      setError("กรุณาเชื่อมต่อ Google Drive ก่อนกู้คืนข้อมูล");
      return;
    }

    const confirmed = window.confirm("ต้องการกู้คืนข้อมูลจาก Google Drive ใช่ไหม? ข้อมูลในเครื่องปัจจุบันจะถูกแทนที่");
    if (!confirmed) return;

    setBusy(true);
    setError("");
    try {
      const { file, raw } = await downloadBackupPayload(accessToken);
      const payload = validateImportPayload(raw);
      if (!payload) throw new Error("invalid schema");

      writeProfile(payload.profile);
      writeSettings(payload.settings);
      writeDailyEntries(payload.dailyEntries);

      const restoredAt = new Date().toISOString();
      persistStatus({
        ...readCloudBackupStatus(),
        cloudBackupEnabled: status.cloudBackupEnabled,
        lastCloudBackupFileId: file.id,
        lastCloudRestoreAt: restoredAt,
      });
      setMessage("กู้คืนข้อมูลจาก Google Drive สำเร็จแล้ว กำลังโหลดข้อมูลใหม่");
      window.setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      setError(formatGoogleDriveError(err));
    } finally {
      setBusy(false);
    }
  }

  function toggleAutoBackup(value: boolean) {
    if (value && !connected) {
      setError("เปิด Auto Backup ได้หลังเชื่อมต่อ Google Drive");
      return;
    }
    persistStatus({ ...status, cloudBackupEnabled: value });
    setMessage(value ? "เปิด Auto Backup แล้ว ระบบจะสำรองเมื่อข้อมูลเปลี่ยนใน session นี้" : "ปิด Auto Backup แล้ว");
  }

  useEffect(() => {
    if (!status.cloudBackupEnabled || !accessToken) return;

    const intervalId = window.setInterval(() => {
      const snapshot = createLocalSnapshot();
      if (snapshot === lastSnapshotRef.current) return;
      if (autoBackupTimerRef.current) window.clearTimeout(autoBackupTimerRef.current);
      autoBackupTimerRef.current = window.setTimeout(() => {
        void runBackup({ silent: true });
      }, 5000);
    }, 2500);

    return () => {
      window.clearInterval(intervalId);
      if (autoBackupTimerRef.current) window.clearTimeout(autoBackupTimerRef.current);
    };
  }, [accessToken, status.cloudBackupEnabled]);

  return (
    <div className="cloud-backup-widget">
      <button className="cloud-backup-trigger" onClick={() => setOpen((value) => !value)} aria-label="Cloud Backup">
        <Cloud size={18} />
      </button>

      {open && (
        <section className="cloud-backup-panel glass card" aria-label="Cloud Backup">
          <div className="cloud-backup-header">
            <div>
              <p className="kicker">Cloud Backup</p>
              <h2>Google Drive Backup</h2>
            </div>
            <button className="cloud-backup-close" onClick={() => setOpen(false)} aria-label="ปิด Cloud Backup"><X size={18} /></button>
          </div>

          <p className="cloud-backup-note">ข้อมูลจะถูกสำรองเป็นไฟล์ JSON ใน Google Drive ของคุณเอง แอปนี้ไม่เก็บข้อมูลไว้บนเซิร์ฟเวอร์กลาง</p>

          <div className="cloud-backup-status-grid">
            <div><span>สถานะ</span><strong>{statusText}</strong></div>
            <div><span>สำรองล่าสุด</span><strong>{formatBackupDate(status.lastCloudBackupAt)}</strong></div>
            <div><span>โฟลเดอร์</span><strong>{GOOGLE_DRIVE_FOLDER_NAME}</strong></div>
            <div><span>ไฟล์</span><strong>{GOOGLE_DRIVE_BACKUP_FILE_NAME}</strong></div>
          </div>

          {message && <p className="cloud-backup-message">{message}</p>}
          {error && <p className="cloud-backup-error">{error}</p>}

          <div className="cloud-backup-actions">
            <button className="soft-btn" onClick={connectGoogleDrive} disabled={busy || !hasClientId}>
              <Cloud size={16} /> เชื่อมต่อ Google Drive
            </button>
            <button className="primary-btn" onClick={() => void runBackup()} disabled={busy || !connected}>
              {busy ? <RefreshCw size={16} /> : <CloudUpload size={16} />} Backup Now
            </button>
            <button className="soft-btn" onClick={restoreFromGoogleDrive} disabled={busy || !connected}>
              <DownloadCloud size={16} /> Restore from Google Drive
            </button>
          </div>

          <label className="cloud-backup-toggle">
            <span>
              <strong>Auto Backup</strong>
              <small>{connected ? "สำรองอัตโนมัติหลังข้อมูลเปลี่ยน 5 วินาที" : "เปิด Auto Backup ได้หลังเชื่อมต่อ Google Drive"}</small>
            </span>
            <input type="checkbox" checked={status.cloudBackupEnabled} onChange={(event) => toggleAutoBackup(event.target.checked)} />
          </label>
        </section>
      )}
    </div>
  );
}
