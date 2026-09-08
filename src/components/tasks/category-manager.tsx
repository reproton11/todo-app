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
import { apiFetch, type CategoryData } from "@/lib/api-client";

export function CategoryManager({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#0d9488");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function load() {
    const res = await apiFetch<{ categories: CategoryData[] }>("/api/categories");
    setCategories(res.categories);
  }

  useEffect(() => {
    if (open) load().catch(() => toast.error("Gagal memuat kategori"));
  }, [open]);

  async function add() {
    if (!name.trim()) {
      toast.error("Nama kategori wajib diisi");
      return;
    }
    try {
      await apiFetch("/api/categories", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), color }),
      });
      setName("");
      await load();
      window.dispatchEvent(new CustomEvent("tugasku:refresh"));
      toast.success("Kategori ditambahkan");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menambah kategori");
    }
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return;
    try {
      const current = categories.find((c) => c.id === id);
      await apiFetch(`/api/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: editName.trim(), color: current?.color ?? "#64748b" }),
      });
      setEditingId(null);
      await load();
      window.dispatchEvent(new CustomEvent("tugasku:refresh"));
      toast.success("Kategori diperbarui");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui kategori");
    }
  }

  async function remove(id: string, name: string) {
    try {
      await apiFetch(`/api/categories/${id}`, { method: "DELETE" });
      await load();
      window.dispatchEvent(new CustomEvent("tugasku:refresh"));
      toast.success(`Kategori "${name}" dihapus. Tugasnya tetap ada tanpa kategori.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus kategori");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kelola kategori</DialogTitle>
          <DialogDescription>
            Kategori membantu mengelompokkan tugas. Tugas tetap aman saat kategorinya dihapus.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="new-category">Kategori baru</Label>
            <div className="flex gap-2">
              <Input
                id="new-category"
                value={name}
                placeholder="Nama kategori"
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
              />
              <Input
                type="color"
                aria-label="Warna kategori baru"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 cursor-pointer p-1"
              />
              <Button onClick={add} aria-label="Tambah kategori">
                <Plus className="size-4" aria-hidden />
              </Button>
            </div>
          </div>

          <ul className="grid gap-1">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center gap-2 rounded-md border px-2 py-1.5">
                <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: c.color }} aria-hidden />
                {editingId === c.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8"
                      aria-label={`Ubah nama kategori ${c.name}`}
                    />
                    <Button size="icon" variant="ghost" aria-label="Simpan nama" onClick={() => saveEdit(c.id)}>
                      <Check className="size-4" aria-hidden />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 truncate text-sm">{c.name}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Ubah kategori ${c.name}`}
                      onClick={() => {
                        setEditingId(c.id);
                        setEditName(c.name);
                      }}
                    >
                      <Pencil className="size-4" aria-hidden />
                    </Button>
                  </>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Hapus kategori ${c.name}`}
                  onClick={() => remove(c.id, c.name)}
                >
                  <Trash2 className="size-4 text-destructive" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
