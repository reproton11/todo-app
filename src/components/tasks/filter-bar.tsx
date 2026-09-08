"use client";

import { useState } from "react";
import { FolderKanban, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryManager } from "@/components/tasks/category-manager";
import { PRIORITIES } from "@/lib/validations";
import { PRIORITY_META, type Priority } from "@/lib/priority";
import type { CategoryData, StatusData, TagData } from "@/lib/api-client";
import { useTaskFilters } from "@/stores/filters";

export function FilterBar({
  statuses,
  categories,
  tags,
  searchRef,
}: {
  statuses: StatusData[];
  categories: CategoryData[];
  tags: TagData[];
  searchRef: React.RefObject<HTMLInputElement | null>;
}) {
  const { filters, setFilter, reset } = useTaskFilters();
  const [manageOpen, setManageOpen] = useState(false);

  const hasActive =
    filters.q || filters.statusId || filters.priority || filters.categoryId || filters.tagId || filters.dueFrom || filters.dueTo;

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          ref={searchRef}
          type="search"
          placeholder="Cari judul atau deskripsi... ( / )"
          value={filters.q}
          onChange={(e) => setFilter("q", e.target.value)}
          className="h-9 w-full sm:w-64"
          aria-label="Cari tugas"
        />

        <Select value={filters.statusId || "all"} onValueChange={(v) => setFilter("statusId", v === "all" ? "" : v)}>
          <SelectTrigger className="h-9 w-full sm:w-40" aria-label="Filter status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua status</SelectItem>
            <SelectItem value="pending">Belum selesai</SelectItem>
            <SelectItem value="done">Selesai</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.priority || "all"} onValueChange={(v) => setFilter("priority", v === "all" ? "" : v)}>
          <SelectTrigger className="h-9 w-full sm:w-36" aria-label="Filter prioritas">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua prioritas</SelectItem>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {PRIORITY_META[p as Priority].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.categoryId || "all"} onValueChange={(v) => setFilter("categoryId", v === "all" ? "" : v)}>
          <SelectTrigger className="h-9 w-full sm:w-40" aria-label="Filter kategori">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua kategori</SelectItem>
            <SelectItem value="none">Tanpa kategori</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.tagId || "all"} onValueChange={(v) => setFilter("tagId", v === "all" ? "" : v)}>
          <SelectTrigger className="h-9 w-full sm:w-36" aria-label="Filter tag">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua tag</SelectItem>
            {tags.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Input
            type="date"
            aria-label="Tenggat dari"
            value={filters.dueFrom}
            onChange={(e) => setFilter("dueFrom", e.target.value)}
            className="h-9 w-[8.5rem]"
          />
          <span aria-hidden>s/d</span>
          <Input
            type="date"
            aria-label="Tenggat sampai"
            value={filters.dueTo}
            onChange={(e) => setFilter("dueTo", e.target.value)}
            className="h-9 w-[8.5rem]"
          />
        </div>

        {hasActive && (
          <Button variant="ghost" size="sm" onClick={reset} className="h-9">
            <RotateCcw className="size-4" aria-hidden /> Reset filter
          </Button>
        )}

        <Button variant="outline" size="sm" className="h-9 sm:ml-auto" onClick={() => setManageOpen(true)}>
          <FolderKanban className="size-4" aria-hidden /> Kelola kategori
        </Button>
      </div>

      <CategoryManager open={manageOpen} onOpenChange={setManageOpen} />
    </div>
  );
}
