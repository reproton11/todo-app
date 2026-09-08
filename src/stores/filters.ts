"use client";

import { create } from "zustand";

export type SortField = "createdAt" | "dueDate" | "priority" | "title";

export type TaskFilters = {
  q: string;
  statusId: string;
  priority: string;
  categoryId: string;
  tagId: string;
  dueFrom: string;
  dueTo: string;
  sort: SortField;
  dir: "asc" | "desc";
};

const DEFAULTS: TaskFilters = {
  q: "",
  statusId: "",
  priority: "",
  categoryId: "",
  tagId: "",
  dueFrom: "",
  dueTo: "",
  sort: "createdAt",
  dir: "desc",
};

export const useTaskFilters = create<{
  filters: TaskFilters;
  setFilter: <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => void;
  reset: () => void;
}>((set) => ({
  filters: DEFAULTS,
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),
  reset: () => set({ filters: DEFAULTS }),
}));

export function filtersToQuery(filters: TaskFilters) {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  if (filters.statusId) sp.set("statusId", filters.statusId);
  if (filters.priority) sp.set("priority", filters.priority);
  if (filters.categoryId) sp.set("categoryId", filters.categoryId);
  if (filters.tagId) sp.set("tagId", filters.tagId);
  if (filters.dueFrom) sp.set("dueFrom", filters.dueFrom);
  if (filters.dueTo) sp.set("dueTo", filters.dueTo);
  sp.set("sort", filters.sort);
  sp.set("dir", filters.dir);
  return sp.toString();
}
