import { plantDefinitions, starterPets, type GrowthStage, type PetId, type ResourceKey } from "@/data/myWorld";

export const MY_WORLD_SCHEMA_VERSION = 1;
export const MY_WORLD_STORAGE_KEY = "kindheart30_my_world";

export type PetStats = {
  friendship: number;
  happiness: number;
  comfort: number;
  trust: number;
};

export type GameResources = Record<ResourceKey, number>;

export type GardenPlot = {
  id: string;
  plantId?: string;
  stage: GrowthStage;
  water: number;
  sunlight: number;
  readyToHarvest: boolean;
};

export type MyWorldState = {
  schemaVersion: number;
  onboarded: boolean;
  selectedPetId?: PetId;
  petName: string;
  petLevel: number;
  petXp: number;
  petStats: PetStats;
  resources: GameResources;
  gardenPlots: GardenPlot[];
  unlockedDecorations: string[];
  equippedDecorations: string[];
  inbox: Array<{ id: string; title: string; body: string; read: boolean; createdAt: string }>;
  achievements: string[];
  lastRewardAt?: string;
  miniGameHighScores: Record<string, number>;
};

function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export function createDefaultMyWorldState(): MyWorldState {
  return {
    schemaVersion: MY_WORLD_SCHEMA_VERSION,
    onboarded: false,
    petName: "โมจิ",
    petLevel: 1,
    petXp: 0,
    petStats: {
      friendship: 12,
      happiness: 14,
      comfort: 15,
      trust: 10,
    },
    resources: {
      waterDrops: 3,
      kindStars: 1,
      friendshipHearts: 1,
      seeds: 3,
    },
    gardenPlots: Array.from({ length: 4 }, (_, index) => ({
      id: `plot-${index + 1}`,
      plantId: index === 0 ? plantDefinitions[0]?.id : undefined,
      stage: index === 0 ? 1 : 0,
      water: 0,
      sunlight: 0,
      readyToHarvest: false,
    })),
    unlockedDecorations: ["พื้นไม้ละมุน", "หน้าต่างแสงเช้า"],
    equippedDecorations: ["พื้นไม้ละมุน"],
    inbox: [
      {
        id: "welcome-letter",
        title: "จดหมายต้อนรับ",
        body: "เราไม่ได้มาเร่งให้คุณเก่งขึ้น แค่อยากอยู่ข้าง ๆ ตอนคุณดูแลตัวเองทีละนิด",
        read: false,
        createdAt: new Date().toISOString(),
      },
    ],
    achievements: [],
    miniGameHighScores: {},
  };
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeWorld(value: unknown): MyWorldState {
  const fallback = createDefaultMyWorldState();
  if (!isRecord(value)) return fallback;
  const petId = typeof value.selectedPetId === "string" && starterPets.some((pet) => pet.id === value.selectedPetId) ? (value.selectedPetId as PetId) : undefined;
  const resources = isRecord(value.resources) ? value.resources : {};
  const petStats = isRecord(value.petStats) ? value.petStats : {};
  const gardenPlots = Array.isArray(value.gardenPlots) ? value.gardenPlots : fallback.gardenPlots;
  return {
    ...fallback,
    schemaVersion: MY_WORLD_SCHEMA_VERSION,
    onboarded: typeof value.onboarded === "boolean" ? value.onboarded : fallback.onboarded,
    selectedPetId: petId,
    petName: typeof value.petName === "string" && value.petName.trim() ? value.petName.slice(0, 24) : fallback.petName,
    petLevel: typeof value.petLevel === "number" ? Math.min(5, Math.max(1, Math.floor(value.petLevel))) : fallback.petLevel,
    petXp: typeof value.petXp === "number" ? Math.max(0, Math.floor(value.petXp)) : fallback.petXp,
    petStats: {
      friendship: clamp(Number(petStats.friendship ?? fallback.petStats.friendship)),
      happiness: clamp(Number(petStats.happiness ?? fallback.petStats.happiness)),
      comfort: clamp(Number(petStats.comfort ?? fallback.petStats.comfort)),
      trust: clamp(Number(petStats.trust ?? fallback.petStats.trust)),
    },
    resources: {
      waterDrops: Math.max(0, Math.floor(Number(resources.waterDrops ?? fallback.resources.waterDrops))),
      kindStars: Math.max(0, Math.floor(Number(resources.kindStars ?? fallback.resources.kindStars))),
      friendshipHearts: Math.max(0, Math.floor(Number(resources.friendshipHearts ?? fallback.resources.friendshipHearts))),
      seeds: Math.max(0, Math.floor(Number(resources.seeds ?? fallback.resources.seeds))),
    },
    gardenPlots: gardenPlots.slice(0, 12).map((plot, index) => {
      const record = isRecord(plot) ? plot : {};
      const plantId = typeof record.plantId === "string" && plantDefinitions.some((plant) => plant.id === record.plantId) ? record.plantId : undefined;
      const stage = Number(record.stage);
      return {
        id: typeof record.id === "string" ? record.id : `plot-${index + 1}`,
        plantId,
        stage: stage >= 0 && stage <= 4 ? (stage as GrowthStage) : 0,
        water: Math.max(0, Math.floor(Number(record.water ?? 0))),
        sunlight: Math.max(0, Math.floor(Number(record.sunlight ?? 0))),
        readyToHarvest: typeof record.readyToHarvest === "boolean" ? record.readyToHarvest : false,
      };
    }),
    unlockedDecorations: Array.isArray(value.unlockedDecorations) ? value.unlockedDecorations.filter((item): item is string => typeof item === "string") : fallback.unlockedDecorations,
    equippedDecorations: Array.isArray(value.equippedDecorations) ? value.equippedDecorations.filter((item): item is string => typeof item === "string") : fallback.equippedDecorations,
    inbox: Array.isArray(value.inbox) ? value.inbox.filter(isRecord).map((mail, index) => ({
      id: typeof mail.id === "string" ? mail.id : `mail-${index}`,
      title: typeof mail.title === "string" ? mail.title : "จดหมายจากเพื่อนตัวน้อย",
      body: typeof mail.body === "string" ? mail.body : "ขอบคุณที่กลับมาดูแลตัวเองนะ",
      read: typeof mail.read === "boolean" ? mail.read : false,
      createdAt: typeof mail.createdAt === "string" ? mail.createdAt : new Date().toISOString(),
    })) : fallback.inbox,
    achievements: Array.isArray(value.achievements) ? value.achievements.filter((item): item is string => typeof item === "string") : fallback.achievements,
    lastRewardAt: typeof value.lastRewardAt === "string" ? value.lastRewardAt : undefined,
    miniGameHighScores: isRecord(value.miniGameHighScores)
      ? Object.fromEntries(Object.entries(value.miniGameHighScores).filter(([, score]) => typeof score === "number")) as Record<string, number>
      : {},
  };
}

export function readMyWorldState(): MyWorldState {
  if (!canUseStorage()) return createDefaultMyWorldState();
  try {
    return sanitizeWorld(JSON.parse(window.localStorage.getItem(MY_WORLD_STORAGE_KEY) ?? "null"));
  } catch {
    return createDefaultMyWorldState();
  }
}

export function writeMyWorldState(state: MyWorldState): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(MY_WORLD_STORAGE_KEY, JSON.stringify(sanitizeWorld(state)));
}

export function rewardFromSelfCare(state: MyWorldState, type: "visit" | "mood" | "journal" | "mission" | "breathing"): MyWorldState {
  const next = sanitizeWorld(state);
  if (type === "visit") next.resources.seeds += 1;
  if (type === "mood") next.resources.waterDrops += 1;
  if (type === "journal") next.resources.friendshipHearts += 1;
  if (type === "mission") next.resources.kindStars += 1;
  if (type === "breathing") next.petStats.comfort = clamp(next.petStats.comfort + 4);
  next.petXp += type === "mission" ? 18 : 8;
  next.petLevel = next.petXp >= 850 ? 5 : next.petXp >= 500 ? 4 : next.petXp >= 250 ? 3 : next.petXp >= 100 ? 2 : 1;
  next.lastRewardAt = todayKey();
  return next;
}

export function addAchievement(state: MyWorldState, achievement: string): MyWorldState {
  if (state.achievements.includes(achievement)) return state;
  return { ...state, achievements: [...state.achievements, achievement] };
}
