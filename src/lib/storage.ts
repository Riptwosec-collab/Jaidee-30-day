export const APP_SCHEMA_VERSION = 1;

export const STORAGE_KEYS = {
  profile: "kindheart30_profile",
  settings: "kindheart30_settings",
  dailyEntries: "kindheart30_daily_entries",
  onboarding: "kindheart30_onboarding",
} as const;

export type ThemeMode = "auto" | "morning" | "day" | "evening" | "night";

export type UserProfile = {
  name: string;
  avatar: string;
  startDate: string;
  createdAt: string;
};

export type DailyEntry = {
  day: number;
  dateUnlocked: string;
  completed: boolean;
  completedAt?: string;
  missionStarted: boolean;
  mood?: 1 | 2 | 3 | 4 | 5;
  note: string;
  favorite: boolean;
  lastUpdated: string;
};

export type UserSettings = {
  themeMode: ThemeMode;
  darkMode: boolean;
  fontScale: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  reduceMotion: boolean;
  reminderEnabled: boolean;
  reminderTime?: string;
  demoMode: boolean;
};

export type ExportPayload = {
  schemaVersion: number;
  exportedAt: string;
  profile: UserProfile;
  settings: UserSettings;
  dailyEntries: Record<number, DailyEntry>;
};

export const DEFAULT_SETTINGS: UserSettings = {
  themeMode: "auto",
  darkMode: false,
  fontScale: 1,
  soundEnabled: false,
  vibrationEnabled: true,
  reduceMotion: false,
  reminderEnabled: false,
  reminderTime: "20:30",
  demoMode: false,
};

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function createDefaultProfile(name = "คุณ"): UserProfile {
  const now = new Date().toISOString();
  return {
    name,
    avatar: "🌷",
    startDate: todayKey(),
    createdAt: now,
  };
}

export function createDefaultEntry(day: number): DailyEntry {
  return {
    day,
    dateUnlocked: todayKey(),
    completed: false,
    missionStarted: false,
    note: "",
    favorite: false,
    lastUpdated: new Date().toISOString(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeParse<T>(raw: string | null, fallback: T, validate: (value: unknown) => T): T {
  if (!raw) return fallback;
  try {
    return validate(JSON.parse(raw));
  } catch {
    return fallback;
  }
}

export function readProfile(): UserProfile {
  return safeParse(localStorage.getItem(STORAGE_KEYS.profile), createDefaultProfile(), (value) => {
    if (!isRecord(value)) return createDefaultProfile();
    const fallback = createDefaultProfile();
    return {
      name: typeof value.name === "string" && value.name.trim() ? value.name : fallback.name,
      avatar: typeof value.avatar === "string" && value.avatar.trim() ? value.avatar : fallback.avatar,
      startDate: typeof value.startDate === "string" ? value.startDate : fallback.startDate,
      createdAt: typeof value.createdAt === "string" ? value.createdAt : fallback.createdAt,
    };
  });
}

export function readSettings(): UserSettings {
  return safeParse(localStorage.getItem(STORAGE_KEYS.settings), DEFAULT_SETTINGS, (value) => {
    if (!isRecord(value)) return DEFAULT_SETTINGS;
    const allowedThemes: ThemeMode[] = ["auto", "morning", "day", "evening", "night"];
    return {
      ...DEFAULT_SETTINGS,
      themeMode: allowedThemes.includes(value.themeMode as ThemeMode) ? (value.themeMode as ThemeMode) : DEFAULT_SETTINGS.themeMode,
      darkMode: typeof value.darkMode === "boolean" ? value.darkMode : DEFAULT_SETTINGS.darkMode,
      fontScale: typeof value.fontScale === "number" && value.fontScale >= 0.9 && value.fontScale <= 1.2 ? value.fontScale : DEFAULT_SETTINGS.fontScale,
      soundEnabled: typeof value.soundEnabled === "boolean" ? value.soundEnabled : DEFAULT_SETTINGS.soundEnabled,
      vibrationEnabled: typeof value.vibrationEnabled === "boolean" ? value.vibrationEnabled : DEFAULT_SETTINGS.vibrationEnabled,
      reduceMotion: typeof value.reduceMotion === "boolean" ? value.reduceMotion : DEFAULT_SETTINGS.reduceMotion,
      reminderEnabled: typeof value.reminderEnabled === "boolean" ? value.reminderEnabled : DEFAULT_SETTINGS.reminderEnabled,
      reminderTime: typeof value.reminderTime === "string" ? value.reminderTime : DEFAULT_SETTINGS.reminderTime,
      demoMode: typeof value.demoMode === "boolean" ? value.demoMode : DEFAULT_SETTINGS.demoMode,
    };
  });
}

export function readDailyEntries(): Record<number, DailyEntry> {
  return safeParse<Record<number, DailyEntry>>(localStorage.getItem(STORAGE_KEYS.dailyEntries), {}, (value) => {
    if (!isRecord(value)) return {};
    return Object.entries(value).reduce<Record<number, DailyEntry>>((acc, [key, entry]) => {
      const day = Number(key);
      if (!Number.isInteger(day) || day < 1 || day > 30 || !isRecord(entry)) return acc;
      const base = createDefaultEntry(day);
      const mood = Number(entry.mood);
      acc[day] = {
        day,
        dateUnlocked: typeof entry.dateUnlocked === "string" ? entry.dateUnlocked : base.dateUnlocked,
        completed: typeof entry.completed === "boolean" ? entry.completed : base.completed,
        completedAt: typeof entry.completedAt === "string" ? entry.completedAt : undefined,
        missionStarted: typeof entry.missionStarted === "boolean" ? entry.missionStarted : base.missionStarted,
        mood: mood >= 1 && mood <= 5 ? (mood as 1 | 2 | 3 | 4 | 5) : undefined,
        note: typeof entry.note === "string" ? entry.note.slice(0, 1000) : base.note,
        favorite: typeof entry.favorite === "boolean" ? entry.favorite : base.favorite,
        lastUpdated: typeof entry.lastUpdated === "string" ? entry.lastUpdated : base.lastUpdated,
      };
      return acc;
    }, {});
  });
}

export function writeProfile(profile: UserProfile): void {
  localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
}

export function writeSettings(settings: UserSettings): void {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

export function writeDailyEntries(entries: Record<number, DailyEntry>): void {
  localStorage.setItem(STORAGE_KEYS.dailyEntries, JSON.stringify(entries));
}

export function readOnboardingDone(): boolean {
  return localStorage.getItem(STORAGE_KEYS.onboarding) === "done";
}

export function writeOnboardingDone(): void {
  localStorage.setItem(STORAGE_KEYS.onboarding, "done");
}

export function resetAllData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}

export function buildExportPayload(profile: UserProfile, settings: UserSettings, dailyEntries: Record<number, DailyEntry>): ExportPayload {
  return {
    schemaVersion: APP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    profile,
    settings,
    dailyEntries,
  };
}

export function validateImportPayload(value: unknown): ExportPayload | null {
  if (!isRecord(value)) return null;
  const schemaVersion = Number(value.schemaVersion);
  if (schemaVersion !== APP_SCHEMA_VERSION) return null;
  const profile = isRecord(value.profile) ? value.profile : null;
  const settings = isRecord(value.settings) ? value.settings : null;
  const dailyEntries = isRecord(value.dailyEntries) ? value.dailyEntries : null;
  if (!profile || !settings || !dailyEntries) return null;
  return {
    schemaVersion,
    exportedAt: typeof value.exportedAt === "string" ? value.exportedAt : new Date().toISOString(),
    profile: {
      ...createDefaultProfile(),
      name: typeof profile.name === "string" ? profile.name : "คุณ",
      avatar: typeof profile.avatar === "string" ? profile.avatar : "🌷",
      startDate: typeof profile.startDate === "string" ? profile.startDate : todayKey(),
      createdAt: typeof profile.createdAt === "string" ? profile.createdAt : new Date().toISOString(),
    },
    settings: {
      ...DEFAULT_SETTINGS,
      ...settings,
    } as UserSettings,
    dailyEntries: Object.entries(dailyEntries).reduce<Record<number, DailyEntry>>((acc, [key, entry]) => {
      const day = Number(key);
      if (!Number.isInteger(day) || day < 1 || day > 30 || !isRecord(entry)) return acc;
      acc[day] = {
        ...createDefaultEntry(day),
        ...entry,
        day,
        note: typeof entry.note === "string" ? entry.note.slice(0, 1000) : "",
      } as DailyEntry;
      return acc;
    }, {}),
  };
}
