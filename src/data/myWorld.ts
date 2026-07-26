export type PetId = "dog" | "cat" | "panda" | "capybara";
export type ResourceKey = "waterDrops" | "kindStars" | "friendshipHearts" | "seeds";
export type PlantCategory = "vegetable" | "flower" | "fantasy";
export type GrowthStage = 0 | 1 | 2 | 3 | 4;

export type PetDefinition = {
  id: PetId;
  name: string;
  emoji: string;
  personality: string;
  sampleLine: string;
  favoriteFood: string;
  colorClass: string;
  traits: string[];
  lines: string[];
};

export type PlantDefinition = {
  id: string;
  name: string;
  icon: string;
  category: PlantCategory;
  requiredWater: number;
  requiredSunlight: number;
  rewardType: ResourceKey;
  rewardAmount: number;
  rarity: "common" | "rare" | "epic";
};

export type MiniGameDefinition = {
  id: string;
  name: string;
  icon: string;
  type: string;
  duration: string;
  description: string;
  reward: string;
};

export const starterPets: PetDefinition[] = [
  {
    id: "dog",
    name: "ลูกหมา",
    emoji: "🐶",
    personality: "ร่าเริง ซื่อสัตย์ ชอบเล่น และตื่นเต้นเมื่อคุณกลับมา",
    sampleLine: "ดีใจที่สุดเลยที่คุณกลับมา!",
    favoriteFood: "คุกกี้รูปกระดูก",
    colorClass: "pet-peach",
    traits: ["ร่าเริง", "ซื่อสัตย์", "ชอบคำชม"],
    lines: ["วันนี้คุณเก่งมากเลยนะ", "ไปทำภารกิจเล็ก ๆ ด้วยกันไหม?", "เราภูมิใจในตัวคุณมากเลย"],
  },
  {
    id: "cat",
    name: "แมว",
    emoji: "🐱",
    personality: "สุขุม นุ่มนวล ขี้อ้อน และชอบนั่งอยู่ข้าง ๆ",
    sampleLine: "มานั่งเงียบ ๆ ข้างเราก็ได้นะ",
    favoriteFood: "ปลาย่าง",
    colorClass: "pet-lavender",
    traits: ["สุขุม", "นุ่มนวล", "รักความสงบ"],
    lines: ["วันนี้ไม่ต้องรีบก็ได้", "คุณไม่จำเป็นต้องเก่งตลอดเวลา", "เราอยู่ตรงนี้เสมอ"],
  },
  {
    id: "panda",
    name: "แพนด้า",
    emoji: "🐼",
    personality: "ใจเย็น อบอุ่น ชอบพัก และให้ความรู้สึกปลอดภัย",
    sampleLine: "พักก่อนก็ได้นะ การพักไม่ผิดเลย",
    favoriteFood: "ไผ่อ่อน",
    colorClass: "pet-mint",
    traits: ["ใจเย็น", "อบอุ่น", "ชอบพัก"],
    lines: ["ค่อย ๆ ไป เราไม่รีบ", "วันนี้ทำได้แค่นี้ก็เก่งมากแล้ว", "อย่าลืมใจดีกับตัวเองนะ"],
  },
  {
    id: "capybara",
    name: "คาปิบาร่า",
    emoji: "🦫",
    personality: "ชิล ใจดี เป็นมิตร ไม่รีบร้อน และชอบน้ำอุ่น",
    sampleLine: "วันนี้เอาแบบชิล ๆ ก็พอ",
    favoriteFood: "แตงโม",
    colorClass: "pet-sage",
    traits: ["ชิล", "ใจดี", "ไม่รีบร้อน"],
    lines: ["ทุกอย่างค่อย ๆ ดีขึ้นได้", "มานั่งพักริมน้ำด้วยกันไหม?", "วันนี้คุณกลับมาแล้ว แค่นี้ก็ดีมาก"],
  },
];

export const plantDefinitions: PlantDefinition[] = [
  { id: "carrot", name: "แครอต", icon: "🥕", category: "vegetable", requiredWater: 2, requiredSunlight: 2, rewardType: "seeds", rewardAmount: 1, rarity: "common" },
  { id: "tomato", name: "มะเขือเทศ", icon: "🍅", category: "vegetable", requiredWater: 3, requiredSunlight: 2, rewardType: "kindStars", rewardAmount: 1, rarity: "common" },
  { id: "sunflower", name: "ทานตะวัน", icon: "🌻", category: "flower", requiredWater: 2, requiredSunlight: 3, rewardType: "friendshipHearts", rewardAmount: 1, rarity: "rare" },
  { id: "lavender", name: "ลาเวนเดอร์", icon: "🪻", category: "flower", requiredWater: 2, requiredSunlight: 2, rewardType: "waterDrops", rewardAmount: 2, rarity: "rare" },
  { id: "heart-tree", name: "ต้นหัวใจ", icon: "💗", category: "fantasy", requiredWater: 4, requiredSunlight: 4, rewardType: "friendshipHearts", rewardAmount: 3, rarity: "epic" },
  { id: "cloud-flower", name: "ดอกเมฆ", icon: "☁️", category: "fantasy", requiredWater: 3, requiredSunlight: 3, rewardType: "kindStars", rewardAmount: 2, rarity: "epic" },
];

export const miniGames: MiniGameDefinition[] = [
  { id: "daily-stars", name: "ดาวของวันนี้", icon: "⭐", type: "Tap Game", duration: "30–45 วินาที", description: "แตะเก็บดาวใจดีและอ่านข้อความกำลังใจที่ลอยลงมา", reward: "ดาวใจดี + XP" },
  { id: "cloud-breath", name: "เป่าปุยเมฆ", icon: "☁️", type: "Breathing Game", duration: "3 รอบ", description: "หายใจเข้า 4 กลั้น 2 ออก 6 พร้อมเพื่อนตัวน้อย", reward: "Comfort + หยดน้ำ" },
  { id: "cozy-corner", name: "จัดมุมใจ", icon: "🧺", type: "Drag & Drop", duration: "30–60 วินาที", description: "จัดหนังสือ หมอน และต้นไม้ให้มุมใจน่าอยู่ขึ้น", reward: "เฟอร์นิเจอร์ + XP บ้าน" },
  { id: "warm-kitchen", name: "ครัวอบอุ่น", icon: "🍲", type: "Cooking", duration: "1 นาที", description: "เลือกวัตถุดิบแล้วทำของกินอุ่น ๆ ให้เพื่อนตัวน้อย", reward: "อาหารโปรด + Friendship" },
  { id: "feeling-match", name: "จับคู่ความรู้สึก", icon: "🃏", type: "Memory Card", duration: "6–12 ใบ", description: "จับคู่คำอย่าง เหนื่อย—พัก และ กังวล—หายใจ", reward: "หัวใจมิตรภาพ + คำแนะนำ" },
];

export const roomItems = ["พื้นไม้ละมุน", "หน้าต่างแสงเช้า", "โซฟาเมฆ", "พรมหัวใจ", "โคมไฟพระจันทร์", "ชั้นหนังสือใจดี"];
export const petNameSuggestions = ["โมจิ", "มะลิ", "โกโก้", "มิลค์", "เมฆ", "ข้าวปั้น", "ซันนี่", "พุดดิ้ง", "ถั่วแดง", "มูน"];
