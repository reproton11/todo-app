"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { apiFetch, type StatusData } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export function StatusManager({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const [statuses, setStatuses] = useState<StatusData[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#64748b");
  const [isDone, setIsDone] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ name: string; color: string; isDone: boolean } | null>(null);

  async function load() {
    const res = await apiFetch<{ statuses: StatusData[] }>("/api/statuses");
    setStatuses(res.statuses);
  }

  useEffect(() => {
    if (open) load().catch(() => toast.error("Gagal memuat status"));
  }, [open]);

  async function add() {
    if (!name.trim()) {
      toast.error("Nama status wajib diisi");
      return;
    }
    try {
      await apiFetch("/api/statuses", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), color, isDone }),
      });
      setName("");
      setIsDone(false);
      await load();
      onSaved?.();
      toast.success("Status ditambahkan");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menambah status");
    }
  }

  async function saveEdit(id: string) {
    if (!draft || !draft.name.trim()) return;
    try {
      await apiFetch(`/api/statuses/${id}`, { method: "PATCH", body: JSON.stringify(draft) });
      setEditingId(null);
      await load();
      onSaved?.();
      toast.success("Status diperbarui");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui status");
    }
  }

  async function remove(s: StatusData) {
    try {
      await apiFetch(`/api/statuses/${s.id}`, { method: "DELETE" });
      await load();
      onSaved?.();
      toast.success(`Status "${s.name}" dihapus`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus status");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kelola status</DialogTitle>
          <DialogDescription>
            Status jadi kolom di papan. Aktifkan label Selesai pada kolom yang dianggap selesai. Tugas di dalamnya tidak bisa dihapus langsung.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="new-status">Status baru</Label>
            <div className="flex items-center gap-2">
              <Input
                id="new-status"
                value={name}
                placeholder="Contoh: Review"
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
              />
              <Input
                type="color"
                aria-label="Warna status baru"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 cursor-pointer p-1"
              />
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Switch checked={isDone} onCheckedChange={setIsDone} aria-label="Tandai sebagai status selesai" />
                Selesai
              </label>
              <Button onClick={add} aria-label="Tambah status">
                <Plus className="size-4" aria-hidden />
              </Button>
            </div>
          </div>

          <ul className="grid gap-1">
            {statuses.map((s) =>
              editingId === s.id && draft ? (
                <li key={s.id} className="flex items-center gap-2 rounded-md border px-2 py-1.5">
                  <Input
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    className="h-8"
                    aria-label={`Ubah nama status ${s.name}`}
                  />
                  <Input
                    type="color"
                    value={draft.color}
                    onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                    aria-label={`Warna status ${s.name}`}
                    className="w-10 cursor-pointer p-1"
                  />
                  <Switch
                    checked={draft.isDone}
                    onCheckedChange={(v) => setDraft({ ...draft, isDone: v })}
                    aria-label="Tandai sebagai status selesai"
                  />
                  <Button size="icon" variant="ghost" aria-label="Simpan status" onClick={() => saveEdit(s.id)}>
                    <Check className="size-4" aria-hidden />
                  </Button>
                </li>
              ) : (
                <li key={s.id} className="flex items-center gap-2 rounded-md border px-2 py-1.5">
                  <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
                  <span className={cn("flex-1 truncate text-sm", s.isDone && "font-medium")}>{s.name}</span>
                  {s.isDone && (
                    <span className="rounded bg-primary/15 px-1.5 py-0.5 text-xs text-primary">selesai</span>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Ubah status ${s.name}`}
                    onClick={() => {
                      setEditingId(s.id);
                      setDraft({ name: s.name, color: s.color, isDone: s.isDone });
                    }}
                  >
                    <Pencil className="size-4" aria-hidden />
                  </Button>
                  <Button size="icon" variant="ghost" aria-label={`Hapus status ${s.name}`} onClick={() => remove(s)}>
                    <Trash2 className="size-4 text-destructive" aria-hidden />
                  </Button>
                </li>
              ),
            )}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
