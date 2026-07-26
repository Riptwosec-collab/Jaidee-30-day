"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PawPrint, X } from "lucide-react";
import { useEffect, useState } from "react";
import MyWorldPanel from "@/components/jaidee/MyWorldPanel";
import { createDefaultMyWorldState, readMyWorldState, rewardFromSelfCare, type MyWorldState, writeMyWorldState } from "@/lib/myWorldStorage";

function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export default function MyWorldGlobalAccess() {
  const [open, setOpen] = useState(false);
  const [world, setWorld] = useState<MyWorldState>(() => createDefaultMyWorldState());
  const [toast, setToast] = useState("โลกเล็ก ๆ ของคุณพร้อมเติบโตแล้ว");

  useEffect(() => {
    const next = readMyWorldState();
    const today = todayKey();
    if (next.lastRewardAt !== today) {
      const rewarded = rewardFromSelfCare(next, "visit");
      setWorld(rewarded);
      writeMyWorldState(rewarded);
      return;
    }
    setWorld(next);
  }, []);

  function persistWorld(next: MyWorldState) {
    setWorld(next);
    writeMyWorldState(next);
  }

  return (
    <>
      <button className="my-world-access-button" onClick={() => setOpen(true)} aria-label="เปิดโลกของฉัน">
        <PawPrint size={19} />
        <span>โลกของฉัน</span>
        {world.inbox.some((mail) => !mail.read) && <i aria-hidden="true" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div className="my-world-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="my-world-drawer" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 240 }}>
              <div className="my-world-drawer-header">
                <div>
                  <p className="kicker">ระบบใหม่</p>
                  <h2>โลกของฉัน</h2>
                </div>
                <button onClick={() => setOpen(false)} aria-label="ปิดโลกของฉัน"><X size={20} /></button>
              </div>
              <div className="my-world-drawer-toast glass">{toast}</div>
              <MyWorldPanel world={world} setWorld={persistWorld} onToast={setToast} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
