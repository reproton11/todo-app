import { z } from "zod";

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const RECURRENCES = ["NONE", "DAILY", "WEEKLY", "MONTHLY", "CUSTOM"] as const;

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Warna harus format #RRGGBB");

export const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(80),
  email: z.email("Email tidak valid").max(200),
  password: z.string().min(8, "Kata sandi minimal 8 karakter").max(100),
});

export const loginSchema = z.object({
  email: z.email("Email tidak valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
  remember: z.boolean().optional(),
});

export const forgotSchema = z.object({
  email: z.email("Email tidak valid"),
});

export const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Kata sandi minimal 8 karakter").max(100),
});

export const taskCreateSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(200),
  description: z.string().max(5000).nullish(),
  statusId: z.string().min(1, "Status wajib dipilih"),
  priority: z.enum(PRIORITIES).default("MEDIUM"),
  categoryId: z.string().nullish(),
  dueDate: z.coerce.date().nullish(),
  recurrence: z.enum(RECURRENCES).default("NONE"),
  recurrenceInterval: z.number().int().min(1).max(365).nullish(),
  tags: z.array(z.string().min(1).max(30)).max(10).default([]),
});

// PENTING: schema update dibuat eksplisit, BUKAN taskCreateSchema.partial().
// Di Zod 4, .partial() pada field ber-default() tetap menerapkan default saat key tidak ada,
// sehingga PATCH {statusId} saja akan menimpa recurrence/tags/priority.
export const taskUpdateSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(200).optional(),
  description: z.string().max(5000).nullish(),
  statusId: z.string().min(1).optional(),
  priority: z.enum(PRIORITIES).optional(),
  categoryId: z.string().nullish(),
  dueDate: z.coerce.date().nullish(),
  recurrence: z.enum(RECURRENCES).optional(),
  recurrenceInterval: z.number().int().min(1).max(365).nullish(),
  tags: z.array(z.string().min(1).max(30)).max(10).optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi").max(40),
  color: hexColor,
});

export const statusSchema = z.object({
  name: z.string().min(1, "Nama status wajib diisi").max(40),
  color: hexColor,
  isDone: z.boolean().optional(),
  order: z.number().int().optional(),
});

export const profileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(80),
  avatarUrl: z.url("URL avatar tidak valid").nullish().or(z.literal("")),
});

export const settingsSchema = z.object({
  theme: z.enum(["LIGHT", "DARK", "SYSTEM"]).optional(),
  emailNotification: z.boolean().optional(),
  pushNotification: z.boolean().optional(),
  defaultPriority: z.enum(PRIORITIES).optional(),
  defaultCategoryId: z.string().nullish(),
  reminderEmail: z
    .union([z.email("Alamat email tidak valid"), z.literal(""), z.null()])
    .optional(),
});

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
