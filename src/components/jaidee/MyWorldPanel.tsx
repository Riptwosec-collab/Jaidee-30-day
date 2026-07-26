"use client";

import { Home, Mail, PawPrint, Play, Seedling } from "lucide-react";
import { useMemo, useState } from "react";
import { miniGames, petNameSuggestions, plantDefinitions, roomItems, starterPets, type PetDefinition, type PetId, type PlantDefinition, type ResourceKey } from "@/data/myWorld";
import { addAchievement, rewardFromSelfCare, type GardenPlot, type MyWorldState, writeMyWorldState } from "@/lib/myWorldStorage";

type Props = {
  world: MyWorldState;
  setWorld: (world: MyWorldState) => void;
  onToast?: (message: string) => void;
};

type WorldSection = "pet" | "garden" | "room" | "games";
type PetAction = "pet" | "feed" | "play" | "quest" | "breathe";

const resourceLabels: Record<ResourceKey, { icon: string; label: string; help: string }> = {
  waterDrops: { icon: "💧", label: "หยดน้ำ", help: "ได้จาก Mood Check-in และเกมหายใจ ใช้รดต้นไม้" },
  kindStars: { icon: "⭐", label: "ดาวใจดี", help: "ได้จากภารกิจและมินิเกม ใช้ปลดล็อกของตกแต่ง" },
  friendshipHearts: { icon: "💗", label: "หัวใจมิตรภาพ", help: "ได้จากบันทึกและเล่นกับสัตว์ ใช้เพิ่มความสนิท" },
  seeds: { icon: "🌱", label: "เมล็ดพันธุ์", help: "ได้จาก Daily Reward และการเก็บเกี่ยว ใช้ปลูกสวน" },
};

const petQuests = [
  "ดื่มน้ำหนึ่งแก้วแล้วกลับมาบอกเรานะ",
  "พักสายตา 5 นาที แล้วมาลูบหัวเพื่อนตัวน้อย",
  "เขียนสิ่งที่ภูมิใจในวันนี้ 1 ข้อ",
  "หายใจช้า ๆ 3 รอบไปพร้อมกัน",
  "จัดโต๊ะหรือมุมเล็ก ๆ ให้สบายตาขึ้นนิดหนึ่ง",
];

function saveWorld(next: MyWorldState, setWorld: (world: MyWorldState) => void) {
  setWorld(next);
  writeMyWorldState(next);
}

function currentPet(world: MyWorldState): PetDefinition {
  return starterPets.find((pet) => pet.id === world.selectedPetId) ?? starterPets[0];
}

function getPetLine(world: MyWorldState): string {
  const pet = currentPet(world);
  const lines = [pet.sampleLine, ...pet.lines];
  return lines[(world.petXp + world.petLevel) % lines.length] ?? pet.sampleLine;
}

function stageIcon(plot: GardenPlot, plant?: PlantDefinition): string {
  if (!plot.plantId) return "＋";
  if (plot.readyToHarvest || plot.stage === 4) return plant?.icon ?? "🌿";
  const stages = ["▫️", "🌱", "🌿", "🪴", plant?.icon ?? "🌼"];
  return stages[plot.stage] ?? "🌱";
}

function rewardTypeForAction(kind: PetAction): "journal" | "mission" | "breathing" {
  if (kind === "quest") return "mission";
  if (kind === "breathe") return "breathing";
  return "journal";
}

export default function MyWorldPanel({ world, setWorld, onToast }: Props) {
  const [section, setSection] = useState<WorldSection>("pet");
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [draftPetId, setDraftPetId] = useState<PetId>(world.selectedPetId ?? starterPets[0].id);
  const [draftName, setDraftName] = useState(world.petName || "โมจิ");

  const pet = currentPet(world);
  const petQuest = petQuests[new Date().getDate() % petQuests.length] ?? petQuests[0];
  const unreadMail = world.inbox.filter((mail) => !mail.read).length;
  const readyPlots = world.gardenPlots.filter((plot) => plot.readyToHarvest || plot.stage === 4).length;
  const activePlant = useMemo(() => plantDefinitions[world.petXp % plantDefinitions.length] ?? plantDefinitions[0], [world.petXp]);

  function finishOnboarding() {
    const next = addAchievement({
      ...world,
      onboarded: true,
      selectedPetId: draftPetId,
      petName: draftName.trim() || "โมจิ",
    }, "เพื่อนตัวแรก");
    saveWorld(next, setWorld);
    onToast?.(`${next.petName} จะอยู่ข้างคุณเสมอ`);
  }

  function updateStats(kind: PetAction) {
    let next = rewardFromSelfCare(world, rewardTypeForAction(kind));
    next = {
      ...next,
      petStats: {
        friendship: Math.min(100, next.petStats.friendship + (kind === "pet" ? 5 : 3)),
        happiness: Math.min(100, next.petStats.happiness + (kind === "play" ? 6 : 3)),
        comfort: Math.min(100, next.petStats.comfort + (kind === "breathe" ? 8 : 2)),
        trust: Math.min(100, next.petStats.trust + 2),
      },
    };
    saveWorld(next, setWorld);
    onToast?.(kind === "feed" ? `${pet.name} ได้กิน${pet.favoriteFood}แบบน่ารัก ๆ` : "โลกของคุณเติบโตขึ้นอีกนิดแล้ว");
  }

  function plantSeed(plotId: string) {
    if (world.resources.seeds <= 0) {
      onToast?.("เมล็ดพันธุ์ยังไม่พอ ลองกลับมาเช็กอินหรือเล่นมินิเกมก่อนนะ");
      return;
    }
    const next: MyWorldState = {
      ...world,
      resources: { ...world.resources, seeds: world.resources.seeds - 1 },
      gardenPlots: world.gardenPlots.map((plot) => plot.id === plotId && !plot.plantId ? { ...plot, plantId: activePlant.id, stage: 1 } : plot),
    };
    saveWorld(addAchievement(next, "ปลูกต้นแรก"), setWorld);
    onToast?.(`ปลูก${activePlant.name}แล้ว รอให้ใจค่อย ๆ เติบโตนะ`);
  }

  function waterPlot(plotId: string) {
    const plot = world.gardenPlots.find((item) => item.id === plotId);
    if (!plot?.plantId) {
      plantSeed(plotId);
      return;
    }
    if (world.resources.waterDrops <= 0) {
      onToast?.("หยดน้ำยังไม่พอ ลองเลือกอารมณ์หรือฝึกหายใจก่อนนะ");
      return;
    }
    const next: MyWorldState = {
      ...world,
      resources: { ...world.resources, waterDrops: world.resources.waterDrops - 1 },
      gardenPlots: world.gardenPlots.map((item) => {
        if (item.id !== plotId) return item;
        const nextStage = Math.min(4, item.stage + 1) as GardenPlot["stage"];
        return { ...item, water: item.water + 1, stage: nextStage, readyToHarvest: nextStage === 4 };
      }),
    };
    saveWorld(next, setWorld);
    onToast?.("รดน้ำแล้ว ต้นไม้โตขึ้นอย่างอ่อนโยน");
  }

  function harvestPlot(plotId: string) {
    const plot = world.gardenPlots.find((item) => item.id === plotId);
    const plant = plantDefinitions.find((item) => item.id === plot?.plantId);
    if (!plot?.readyToHarvest || !plant) {
      waterPlot(plotId);
      return;
    }
    const rewardType = plant.rewardType;
    const nextResources = {
      ...world.resources,
      [rewardType]: world.resources[rewardType] + plant.rewardAmount,
      seeds: world.resources.seeds + 1,
    };
    const next: MyWorldState = {
      ...world,
      petXp: world.petXp + 16,
      resources: nextResources,
      gardenPlots: world.gardenPlots.map((item) => item.id === plotId ? { ...item, plantId: undefined, stage: 0, water: 0, sunlight: 0, readyToHarvest: false } : item),
    };
    saveWorld(addAchievement(next, "เก็บเกี่ยวครั้งแรก"), setWorld);
    onToast?.(`เก็บเกี่ยว${plant.name}แล้ว ได้รางวัลน่ารัก ๆ กลับมา`);
  }

  function playGame(gameId: string) {
    const game = miniGames.find((item) => item.id === gameId);
    const score = Math.floor(60 + Math.random() * 40);
    const rewarded = rewardFromSelfCare(world, "mission");
    const next = addAchievement({
      ...rewarded,
      miniGameHighScores: { ...world.miniGameHighScores, [gameId]: Math.max(world.miniGameHighScores[gameId] ?? 0, score) },
    }, "เล่นมินิเกมครั้งแรก");
    saveWorld(next, setWorld);
    onToast?.(`${game?.name ?? "มินิเกม"} จบแล้ว ได้ ${score} คะแนนแบบสบาย ๆ`);
  }

  if (!world.onboarded) {
    const selectedPet = starterPets.find((item) => item.id === draftPetId) ?? starterPets[0];
    return (
      <section className="my-world-shell space-y-4">
        <div className="glass card text-center">
          <p className="kicker">โลกของฉัน</p>
          <h2 className="brand-title text-3xl font-black">โลกเล็ก ๆ ที่เติบโตไปพร้อมกับคุณ</h2>
          <p className="soft-muted text-sm">ทุกครั้งที่คุณดูแลใจตัวเอง คุณจะได้รับของรางวัลสำหรับดูแลเพื่อนตัวน้อย ปลูกสวน และตกแต่งบ้าน</p>
        </div>

        {onboardingStep === 0 && (
          <section className="glass card my-world-intro text-center">
            <div className="my-world-planet">🌎</div>
            <h3 className="text-2xl font-black">เริ่มสร้างพื้นที่ใจดี</h3>
            <p className="soft-muted text-sm">ระบบนี้ไม่มีการลงโทษ ไม่มีพืชตาย และไม่มีสัตว์เศร้า ทุกอย่างค่อย ๆ โตตามจังหวะของคุณ</p>
            <button className="primary-btn" onClick={() => setOnboardingStep(1)}>เริ่มเลือกเพื่อน</button>
          </section>
        )}

        {onboardingStep === 1 && (
          <section className="space-y-3">
            <h3 className="px-1 text-xl font-black">ใครจะเป็นเพื่อนตัวแรกของคุณ?</h3>
            <div className="pet-select-grid">
              {starterPets.map((item) => (
                <button key={item.id} className={`pet-choice-card ${draftPetId === item.id ? "selected" : ""} ${item.colorClass}`} onClick={() => setDraftPetId(item.id)}>
                  <span className="pet-choice-emoji">{item.emoji}</span>
                  <strong>{item.name}</strong>
                  <small>{item.traits.join(" · ")}</small>
                  <p>{item.sampleLine}</p>
                </button>
              ))}
            </div>
            <button className="primary-btn" onClick={() => setOnboardingStep(2)}>เลือก {selectedPet.name}</button>
          </section>
        )}

        {onboardingStep === 2 && (
          <section className="glass card space-y-3 text-center">
            <span className="text-6xl">{selectedPet.emoji}</span>
            <h3 className="text-2xl font-black">ตั้งชื่อให้เพื่อนตัวน้อยของคุณ</h3>
            <input className="input text-center" value={draftName} onChange={(event) => setDraftName(event.target.value)} maxLength={24} aria-label="ชื่อสัตว์เลี้ยง" />
            <p className="soft-muted text-sm">“{draftName || "โมจิ"}จะอยู่ข้างคุณเสมอ”</p>
            <div className="name-chip-grid">
              {petNameSuggestions.map((name) => <button key={name} className="soft-btn" onClick={() => setDraftName(name)}>{name}</button>)}
            </div>
            <button className="primary-btn" onClick={finishOnboarding}>ยืนยันและเข้าสู่โลกของฉัน</button>
          </section>
        )}
      </section>
    );
  }

  return (
    <section className="my-world-shell space-y-4">
      <header className="glass card my-world-header">
        <div>
          <p className="kicker">โลกของฉัน</p>
          <h2 className="brand-title text-3xl font-black">สวัสดี {world.petName} กำลังรอคุณอยู่</h2>
          <p className="soft-muted text-sm">พื้นที่เล็ก ๆ ที่เติบโตขึ้นทุกครั้งที่คุณดูแลตัวเอง</p>
        </div>
        <div className="my-world-mail"><Mail size={18} />{unreadMail > 0 && <span>{unreadMail}</span>}</div>
      </header>

      <div className="resource-bar glass">
        {(Object.keys(resourceLabels) as ResourceKey[]).map((key) => {
          const meta = resourceLabels[key];
          return (
            <button key={key} className="resource-chip" title={meta.help}>
              <span>{meta.icon}</span>
              <strong>{world.resources[key]}</strong>
              <small>{meta.label}</small>
            </button>
          );
        })}
      </div>

      <div className="world-tabs segmented">
        <button className={section === "pet" ? "active" : ""} onClick={() => setSection("pet")}><PawPrint size={16} /> เพื่อน</button>
        <button className={section === "garden" ? "active" : ""} onClick={() => setSection("garden")}><Seedling size={16} /> สวนใจ</button>
        <button className={section === "room" ? "active" : ""} onClick={() => setSection("room")}><Home size={16} /> บ้าน</button>
        <button className={section === "games" ? "active" : ""} onClick={() => setSection("games")}><Play size={16} /> เกม</button>
      </div>

      {section === "pet" && (
        <section className="space-y-4">
          <article className={`pet-scene glass card ${pet.colorClass}`}>
            <div className="scene-sun" />
            <div className="scene-window">☁️</div>
            <button className="pet-avatar" onClick={() => updateStats("pet")}>{pet.emoji}</button>
            <div className="pet-speech">{getPetLine(world)}</div>
            <div className="pet-level">Lv.{world.petLevel} · {world.petXp} XP</div>
          </article>

          <div className="pet-action-grid">
            <button className="action-tile" onClick={() => updateStats("pet")}><span>💗</span><span>ลูบหัว</span></button>
            <button className="action-tile" onClick={() => updateStats("feed")}><span>🍪</span><span>ให้อาหาร</span></button>
            <button className="action-tile" onClick={() => updateStats("play")}><span>🫧</span><span>เล่นด้วย</span></button>
            <button className="action-tile" onClick={() => onToast?.("ตู้เสื้อผ้าจะเปิดเต็มรูปแบบในอัปเกรดถัดไป")}><span>🎀</span><span>แต่งตัว</span></button>
          </div>

          <section className="glass card space-y-3">
            <h3 className="text-lg font-black">ภารกิจจากเพื่อนตัวน้อย</h3>
            <p className="soft-muted text-sm">{petQuest}</p>
            <button className="primary-btn" onClick={() => updateStats("quest")}>ทำแล้ว รับรางวัลเล็ก ๆ</button>
          </section>

          <div className="grid grid-cols-2 gap-3">
            {Object.entries(world.petStats).map(([key, value]) => (
              <div key={key} className="glass card pet-stat-card">
                <small>{key}</small>
                <strong>{value}/100</strong>
                <span><i style={{ width: `${value}%` }} /></span>
              </div>
            ))}
          </div>
        </section>
      )}

      {section === "garden" && (
        <section className="space-y-4">
          <section className="glass card">
            <h3 className="text-xl font-black">สวนใจของฉัน</h3>
            <p className="soft-muted text-sm">พืชไม่ตาย ไม่เหี่ยวถาวร แค่ค่อย ๆ โตเมื่อคุณกลับมาดูแลใจ</p>
            {readyPlots > 0 && <p className="reward-note">มีพืชพร้อมเก็บเกี่ยว {readyPlots} แปลง</p>}
          </section>
          <div className="garden-grid">
            {world.gardenPlots.map((plot) => {
              const plant = plantDefinitions.find((item) => item.id === plot.plantId);
              return (
                <button key={plot.id} className={`garden-plot ${plot.readyToHarvest ? "ready" : ""}`} onClick={() => plot.readyToHarvest ? harvestPlot(plot.id) : waterPlot(plot.id)}>
                  <span>{stageIcon(plot, plant)}</span>
                  <strong>{plant?.name ?? "แปลงว่าง"}</strong>
                  <small>{plot.plantId ? `ระยะ ${plot.stage}/4` : "แตะเพื่อปลูก"}</small>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {section === "room" && (
        <section className="space-y-4">
          <section className="room-scene glass card">
            <div className="room-window">🌤️</div>
            <div className="room-pet">{pet.emoji}</div>
            <div className="room-rug" />
            <p>{world.petName} นั่งพักอยู่ในบ้านเล็กของเรา</p>
          </section>
          <section className="glass card space-y-3">
            <h3 className="text-xl font-black">ของตกแต่งที่ปลดล็อก</h3>
            <div className="decor-grid">
              {roomItems.map((item) => (
                <button key={item} className={world.unlockedDecorations.includes(item) ? "unlocked" : "locked"} onClick={() => {
                  if (!world.unlockedDecorations.includes(item)) {
                    onToast?.("ของชิ้นนี้จะปลดล็อกจาก Level หรือ Achievement ถัดไป");
                    return;
                  }
                  const equippedDecorations = world.equippedDecorations.includes(item) ? world.equippedDecorations.filter((decor) => decor !== item) : [...world.equippedDecorations, item];
                  saveWorld({ ...world, equippedDecorations }, setWorld);
                }}>{item}</button>
              ))}
            </div>
          </section>
        </section>
      )}

      {section === "games" && (
        <section className="space-y-3">
          {miniGames.map((game) => (
            <article key={game.id} className="glass card mini-game-card">
              <div>
                <span>{game.icon}</span>
                <div>
                  <h3>{game.name}</h3>
                  <p>{game.description}</p>
                  <small>{game.type} · {game.duration} · {game.reward}</small>
                </div>
              </div>
              <button className="primary-btn" onClick={() => playGame(game.id)}>เล่นแบบสบาย ๆ</button>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}
