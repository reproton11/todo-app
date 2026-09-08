"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/kbd";

const SHORTCUTS = [
  { keys: ["N"], desc: "Tugas baru" },
  { keys: ["/"], desc: "Fokus ke pencarian" },
  { keys: ["Esc"], desc: "Tutup dialog" },
  { keys: ["?"], desc: "Bantuan pintasan" },
];

export function ShortcutManager() {
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("tugasku:new-task"));
      } else if (e.key === "/") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("tugasku:focus-search"));
      } else if (e.key === "?") {
        e.preventDefault();
        setHelpOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pintasan keyboard</DialogTitle>
          <DialogDescription>Kerjakan lebih cepat tanpa mouse.</DialogDescription>
        </DialogHeader>
        <ul className="grid gap-3">
          {SHORTCUTS.map((s) => (
            <li key={s.desc} className="flex items-center justify-between text-sm">
              <span>{s.desc}</span>
              <span className="flex gap-1">
                {s.keys.map((k) => (
                  <Kbd key={k}>{k}</Kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
