export function tasksToCsv(
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    statusName: string;
    priority: string;
    categoryName: string | null;
    dueDate: Date | null;
    completedAt: Date | null;
    createdAt: Date;
  }>,
) {
  const header = [
    "id",
    "judul",
    "deskripsi",
    "status",
    "prioritas",
    "kategori",
    "tenggat",
    "selesai_pada",
    "dibuat_pada",
  ];
  const rows = tasks.map((t) =>
    [
      t.id,
      t.title,
      t.description ?? "",
      t.statusName,
      t.priority,
      t.categoryName ?? "",
      t.dueDate ? t.dueDate.toISOString() : "",
      t.completedAt ? t.completedAt.toISOString() : "",
      t.createdAt.toISOString(),
    ]
      .map(csvEscape)
      .join(","),
  );
  return [header.join(","), ...rows].join("\r\n");
}

function csvEscape(value: string) {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
