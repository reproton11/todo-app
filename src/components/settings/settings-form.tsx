"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Moon, Sun, SunMoon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiFetch, type CategoryData } from "@/lib/api-client";
import { PRIORITIES } from "@/lib/validations";
import { PRIORITY_META, type Priority } from "@/lib/priority";
import { cn } from "@/lib/utils";

type SettingData = {
  theme: string;
  emailNotification: boolean;
  pushNotification: boolean;
  defaultPriority: string;
  defaultCategoryId: string | null;
  reminderEmail?: string | null;
};

export function SettingsForm({
  user,
  setting: initial,
}: {
  user: { name: string; email: string; avatarUrl: string | null };
  setting: SettingData;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(user.name);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [reminderEmail, setReminderEmail] = useState(initial.reminderEmail ?? "");
  const [setting, setSetting] = useState(initial);
  const [deletePassword, setDeletePassword] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await apiFetch("/api/account", {
        method: "PATCH",
        body: JSON.stringify({ name, avatarUrl: avatarUrl || null }),
      });
      toast.success("Profil tersimpan");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan profil");
    } finally {
      setBusy(false);
    }
  }

  async function patchSetting(patch: Partial<SettingData>) {
    setSetting((s) => ({ ...s, ...patch }));
    try {
      await apiFetch("/api/settings", { method: "PATCH", body: JSON.stringify(patch) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan pengaturan");
    }
  }

  async function togglePush(enabled: boolean) {
    if (enabled) {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Izin notifikasi ditolak di browser");
        return;
      }
      try {
        const { publicKey } = await apiFetch<{ publicKey: string | null }>("/api/push");
        if (!publicKey) {
          toast.error("Kunci VAPID belum diatur di server");
          return;
        }
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
        const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh: string; auth: string } };
        await apiFetch("/api/push", { method: "POST", body: JSON.stringify(json) });
        await patchSetting({ pushNotification: true });
        toast.success("Notifikasi browser aktif");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal mengaktifkan notifikasi");
      }
    } else {
      try {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
          await apiFetch("/api/push", { method: "DELETE", body: JSON.stringify({ endpoint: sub.endpoint }) });
          await sub.unsubscribe();
        }
      } finally {
        await patchSetting({ pushNotification: false });
        toast.success("Notifikasi browser dimatikan");
      }
    }
  }

  function applyTheme(mode: "LIGHT" | "DARK" | "SYSTEM") {
    setTheme(mode.toLowerCase());
    void patchSetting({ theme: mode });
  }

  async function deleteAccount() {
    setBusy(true);
    try {
      await apiFetch("/api/account", { method: "DELETE", body: JSON.stringify({ password: deletePassword }) });
      toast.success("Akun dan seluruh data telah dihapus");
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus akun");
      setBusy(false);
    }
  }

  return (
    <Tabs defaultValue="profil">
      <TabsList className="grid w-full grid-cols-4 sm:w-fit sm:grid-cols-4">
        <TabsTrigger value="profil">Profil</TabsTrigger>
        <TabsTrigger value="tampilan">Tampilan</TabsTrigger>
        <TabsTrigger value="notifikasi">Notifikasi</TabsTrigger>
        <TabsTrigger value="data">Data</TabsTrigger>
      </TabsList>

      <TabsContent value="profil">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profil</CardTitle>
            <CardDescription>Nama dan avatar muncul di sidebar aplikasi.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="grid max-w-md gap-4" noValidate>
              <div className="grid gap-2">
                <Label htmlFor="profile-name">Nama</Label>
                <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input id="profile-email" value={user.email} disabled aria-describedby="email-hint" />
                <p id="email-hint" className="text-xs text-muted-foreground">
                  Email dipakai untuk masuk dan tidak bisa diubah di versi ini.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="profile-avatar">URL avatar (opsional)</Label>
                <Input
                  id="profile-avatar"
                  type="url"
                  placeholder="https://contoh.com/foto.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-fit" disabled={busy}>
                Simpan Profil
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="tampilan">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tema</CardTitle>
            <CardDescription>Pilihan ini juga disimpan ke akunmu.</CardDescription>
          </CardHeader>
          <CardContent>
            <div role="radiogroup" aria-label="Pilih tema" className="grid max-w-md grid-cols-3 gap-2">
              {[
                { mode: "LIGHT" as const, label: "Terang", icon: Sun },
                { mode: "DARK" as const, label: "Gelap", icon: Moon },
                { mode: "SYSTEM" as const, label: "Sistem", icon: SunMoon },
              ].map((opt) => {
                const active = (theme ?? "system").toUpperCase() === opt.mode;
                return (
                  <button
                    key={opt.mode}
                    role="radio"
                    aria-checked={active}
                    onClick={() => applyTheme(opt.mode)}
                    className={cn(
                      "flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-lg border text-sm font-medium transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "hover:bg-secondary/60",
                    )}
                  >
                    <opt.icon className="size-5" aria-hidden />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifikasi">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notifikasi</CardTitle>
            <CardDescription>
              Pengingat dikirim oleh server saat tugas mendekati tenggat (butuh cron memanggil
              <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">/api/cron/reminders</code>).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid max-w-md gap-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="push-switch">Notifikasi browser</Label>
                <p className="text-xs text-muted-foreground">
                  Push langsung ke perangkat ini lewat service worker.
                </p>
              </div>
              <Switch
                id="push-switch"
                checked={setting.pushNotification}
                onCheckedChange={(v) => void togglePush(v)}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="email-switch">Notifikasi email</Label>
                <p className="text-xs text-muted-foreground">
                  Butuh kunci layanan email di server; tanpa itu pengingat hanya masuk ke dalam aplikasi.
                </p>
              </div>
              <Switch
                id="email-switch"
                checked={setting.emailNotification}
                onCheckedChange={(v) => void patchSetting({ emailNotification: v })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reminder-email">Email penerima pengingat</Label>
              <div className="flex gap-2">
                <Input
                  id="reminder-email"
                  type="email"
                  placeholder={`Kosongkan untuk pakai ${user.email}`}
                  value={reminderEmail}
                  onChange={(e) => setReminderEmail(e.target.value)}
                  onBlur={() => {
                    if (reminderEmail === (setting.reminderEmail ?? "")) return;
                    void patchSetting({ reminderEmail: reminderEmail || null });
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy || reminderEmail === (setting.reminderEmail ?? "")}
                  onClick={() => void patchSetting({ reminderEmail: reminderEmail || null })}
                >
                  Simpan Email
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Pengingat dikirim ke alamat ini saat tugas mendekati tenggat. Kosongkan untuk memakai email akunmu.
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="data" className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preferensi tugas baru</CardTitle>
            <CardDescription>Nilai awal saat membuat tugas.</CardDescription>
          </CardHeader>
          <CardContent className="grid max-w-md gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="default-priority">Prioritas bawaan</Label>
              <Select
                value={setting.defaultPriority}
                onValueChange={(v) => void patchSetting({ defaultPriority: v })}
              >
                <SelectTrigger id="default-priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_META[p as Priority].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="default-category">Kategori bawaan</Label>
              <DefaultCategorySelect
                value={setting.defaultCategoryId}
                onValueChange={(v) => void patchSetting({ defaultCategoryId: v })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ekspor data</CardTitle>
            <CardDescription>Unduh salinan seluruh tugas, kategori, status, dan tag.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <a href="/api/settings/export?format=json" download>
                <Download className="size-4" aria-hidden /> Unduh JSON
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/api/settings/export?format=csv" download>
                <Download className="size-4" aria-hidden /> Unduh CSV
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Zona bahaya</CardTitle>
            <CardDescription>
              Menghapus akun berarti menghapus permanen semua tugas, kategori, dan tag. Tindakan ini tidak bisa dibatalkan.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid max-w-md gap-3">
            <div className="grid gap-2">
              <Label htmlFor="delete-password">Konfirmasi dengan kata sandi</Label>
              <Input
                id="delete-password"
                type="password"
                autoComplete="current-password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
            </div>
            <Button
              variant="destructive"
              className="w-fit"
              disabled={!deletePassword || busy}
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="size-4" aria-hidden /> Hapus Akun Permanen
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus akun selamanya?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua data akan hilang dan kamu akan keluar dari aplikasi. Lanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void deleteAccount();
              }}
            >
              Ya, hapus akun
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  );
}

function DefaultCategorySelect({
  value,
  onValueChange,
}: {
  value: string | null;
  onValueChange: (value: string | null) => void;
}) {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  useEffect(() => {
    apiFetch<{ categories: CategoryData[] }>("/api/categories")
      .then((res) => setCategories(res.categories))
      .catch(() => {});
  }, []);

  return (
    <Select
      value={value ?? "none"}
      onValueChange={(v) => onValueChange(v === "none" ? null : v)}
    >
      <SelectTrigger id="default-category" className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Tanpa kategori</SelectItem>
        {categories.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}
