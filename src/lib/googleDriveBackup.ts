import type { ExportPayload } from "@/lib/storage";

export const GOOGLE_DRIVE_FOLDER_NAME = "Jaidee 30 Days";
export const GOOGLE_DRIVE_BACKUP_FILE_NAME = "jaidee-backup.json";
export const GOOGLE_DRIVE_BACKUP_STATUS_KEY = "kindheart30_cloud_backup_status";
export const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

const GOOGLE_IDENTITY_SCRIPT_ID = "google-identity-services";
const GOOGLE_IDENTITY_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3";

export type GoogleDriveFile = {
  id: string;
  name: string;
  mimeType?: string;
  modifiedTime?: string;
  webViewLink?: string;
};

export type GoogleDriveFolder = GoogleDriveFile & {
  mimeType: "application/vnd.google-apps.folder";
};

export type GoogleDriveBackupStatus = {
  cloudBackupEnabled: boolean;
  lastCloudBackupAt?: string;
  lastCloudBackupFileId?: string;
  lastCloudBackupFolderId?: string;
  lastCloudRestoreAt?: string;
};

export type BackupResult = {
  ok: true;
  fileId: string;
  folderId: string;
  backedUpAt: string;
  fileName: string;
  folderName: string;
};

export type RestoreResult = {
  ok: true;
  payload: ExportPayload;
  fileId: string;
  restoredAt: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleTokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void;
};

type GoogleIdentity = {
  accounts?: {
    oauth2?: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: GoogleTokenResponse) => void;
      }) => GoogleTokenClient;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

export function readCloudBackupStatus(): GoogleDriveBackupStatus {
  if (typeof window === "undefined") return { cloudBackupEnabled: false };
  try {
    const raw = window.localStorage.getItem(GOOGLE_DRIVE_BACKUP_STATUS_KEY);
    if (!raw) return { cloudBackupEnabled: false };
    const parsed = JSON.parse(raw) as Partial<GoogleDriveBackupStatus>;
    return {
      cloudBackupEnabled: Boolean(parsed.cloudBackupEnabled),
      lastCloudBackupAt: typeof parsed.lastCloudBackupAt === "string" ? parsed.lastCloudBackupAt : undefined,
      lastCloudBackupFileId: typeof parsed.lastCloudBackupFileId === "string" ? parsed.lastCloudBackupFileId : undefined,
      lastCloudBackupFolderId: typeof parsed.lastCloudBackupFolderId === "string" ? parsed.lastCloudBackupFolderId : undefined,
      lastCloudRestoreAt: typeof parsed.lastCloudRestoreAt === "string" ? parsed.lastCloudRestoreAt : undefined,
    };
  } catch {
    return { cloudBackupEnabled: false };
  }
}

export function writeCloudBackupStatus(status: GoogleDriveBackupStatus): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GOOGLE_DRIVE_BACKUP_STATUS_KEY, JSON.stringify(status));
}

export function formatGoogleDriveError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("401") || error.message.includes("403")) return "สิทธิ์ Google Drive หมดอายุ กรุณาเชื่อมต่อใหม่";
    if (error.message.includes("404") || error.message.includes("not found")) return "ยังไม่พบไฟล์สำรองใน Google Drive";
    if (error.message.includes("invalid schema")) return "ไฟล์สำรองไม่ถูกต้องหรือเป็นคนละเวอร์ชัน";
    if (error.message.includes("client id")) return "ยังไม่ได้ตั้งค่า Google Client ID";
    if (error.message.includes("popup") || error.message.includes("OAuth")) return "เชื่อมต่อ Google Drive ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
  }
  return "เชื่อมต่อ Google Drive ไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่";
}

export function hasGoogleClientId(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
}

function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Google OAuth must run in browser"));
  if (window.google?.accounts?.oauth2) return Promise.resolve();

  const existingScript = document.getElementById(GOOGLE_IDENTITY_SCRIPT_ID) as HTMLScriptElement | null;
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Google Identity script failed")), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = GOOGLE_IDENTITY_SCRIPT_ID;
    script.src = GOOGLE_IDENTITY_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Identity script failed"));
    document.head.appendChild(script);
  });
}

export async function requestGoogleDriveAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("missing google client id");
  await loadGoogleIdentityScript();
  const oauth = window.google?.accounts?.oauth2;
  if (!oauth) throw new Error("Google OAuth is unavailable");

  return new Promise((resolve, reject) => {
    const client = oauth.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_DRIVE_SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error_description ?? response.error ?? "OAuth failed"));
          return;
        }
        resolve(response.access_token);
      },
    });
    client.requestAccessToken({ prompt: "consent" });
  });
}

async function driveRequest<T>(accessToken: string, url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`${response.status} ${response.statusText} ${text}`.trim());
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function driveSearchQuery(query: string): string {
  return `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent("files(id,name,mimeType,modifiedTime,webViewLink)")}`;
}

function escapeDriveName(name: string): string {
  return name.replace(/'/g, "\\'");
}

export async function findOrCreateBackupFolder(accessToken: string): Promise<GoogleDriveFolder> {
  const folderName = escapeDriveName(GOOGLE_DRIVE_FOLDER_NAME);
  const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const result = await driveRequest<{ files: GoogleDriveFile[] }>(accessToken, driveSearchQuery(query));
  const existing = result.files[0];
  if (existing?.id) return { ...existing, mimeType: "application/vnd.google-apps.folder" };

  return driveRequest<GoogleDriveFolder>(accessToken, `${DRIVE_API_BASE}/files?fields=id,name,mimeType,modifiedTime,webViewLink`, {
    method: "POST",
    body: JSON.stringify({
      name: GOOGLE_DRIVE_FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });
}

export async function findBackupFile(accessToken: string, folderId: string): Promise<GoogleDriveFile | null> {
  const fileName = escapeDriveName(GOOGLE_DRIVE_BACKUP_FILE_NAME);
  const query = `name='${fileName}' and '${folderId}' in parents and mimeType='application/json' and trashed=false`;
  const result = await driveRequest<{ files: GoogleDriveFile[] }>(accessToken, driveSearchQuery(query));
  return result.files[0] ?? null;
}

function createMultipartBody(metadata: Record<string, unknown>, json: string): FormData {
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", new Blob([json], { type: "application/json" }), GOOGLE_DRIVE_BACKUP_FILE_NAME);
  return form;
}

async function createBackupFile(accessToken: string, folderId: string, json: string): Promise<GoogleDriveFile> {
  const metadata = {
    name: GOOGLE_DRIVE_BACKUP_FILE_NAME,
    mimeType: "application/json",
    parents: [folderId],
  };
  return driveRequest<GoogleDriveFile>(accessToken, `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,webViewLink`, {
    method: "POST",
    body: createMultipartBody(metadata, json),
  });
}

async function updateBackupFile(accessToken: string, fileId: string, json: string): Promise<GoogleDriveFile> {
  return driveRequest<GoogleDriveFile>(accessToken, `${DRIVE_UPLOAD_BASE}/files/${fileId}?uploadType=media&fields=id,name,mimeType,modifiedTime,webViewLink`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: json,
  });
}

export async function backupToGoogleDrive(accessToken: string, payload: ExportPayload): Promise<BackupResult> {
  const folder = await findOrCreateBackupFolder(accessToken);
  const existingFile = await findBackupFile(accessToken, folder.id);
  const json = JSON.stringify(payload, null, 2);
  const file = existingFile ? await updateBackupFile(accessToken, existingFile.id, json) : await createBackupFile(accessToken, folder.id, json);
  const backedUpAt = new Date().toISOString();

  writeCloudBackupStatus({
    ...readCloudBackupStatus(),
    cloudBackupEnabled: true,
    lastCloudBackupAt: backedUpAt,
    lastCloudBackupFileId: file.id,
    lastCloudBackupFolderId: folder.id,
  });

  return {
    ok: true,
    fileId: file.id,
    folderId: folder.id,
    backedUpAt,
    fileName: GOOGLE_DRIVE_BACKUP_FILE_NAME,
    folderName: GOOGLE_DRIVE_FOLDER_NAME,
  };
}

export async function downloadBackupPayload(accessToken: string): Promise<{ file: GoogleDriveFile; raw: unknown }> {
  const folder = await findOrCreateBackupFolder(accessToken);
  const file = await findBackupFile(accessToken, folder.id);
  if (!file) throw new Error("backup file not found");

  const response = await fetch(`${DRIVE_API_BASE}/files/${file.id}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const raw = await response.json();
  return { file, raw };
}

export function formatBackupDate(value?: string): string {
  if (!value) return "ยังไม่เคยสำรอง";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
