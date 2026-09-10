"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ListChecks,
  LogOut,
  Plus,
  Settings,
  SquareKanban,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsBell } from "@/components/notifications-bell";
import { ShortcutManager } from "@/components/shortcut-manager";
const TaskModal = dynamic(() => import("@/components/tasks/task-modal").then((m) => m.TaskModal));
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { Wordmark } from "@/components/wordmark";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dasbor", icon: LayoutDashboard },
  { href: "/tasks", label: "Tugas", icon: ListChecks },
  { href: "/board", label: "Papan", icon: SquareKanban },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

type ShellUser = { id: string; name: string; email: string; avatarUrl: string | null };

export function AppShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    function onNewTask() {
      setModalOpen(true);
    }
    window.addEventListener("tugasku:new-task", onNewTask);
    return () => window.removeEventListener("tugasku:new-task", onNewTask);
  }, []);

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-svh md:grid md:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-svh flex-col justify-between border-r bg-sidebar px-3 py-4 md:flex">
        <div>
          <div className="px-2 pb-4">
            <Wordmark href="/dashboard" />
          </div>
          <nav aria-label="Navigasi utama">
            <ul className="grid gap-1">
              {NAV_ITEMS.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-secondary text-secondary-foreground"
                          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                      )}
                    >
                      <item.icon className="size-4" aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
        <div className="flex items-center gap-2 px-1">
          <ThemeToggle />
          <UserMenu user={user} initials={initials} onLogout={logout} />
        </div>
      </aside>

      <div className="flex min-h-svh flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 px-4 py-2.5 md:justify-end">
          <div className="md:hidden">
            <Wordmark href="/dashboard" />
          </div>
          <div className="flex items-center gap-1">
            <NotificationsBell />
            <ThemeToggle />
            <div className="md:hidden">
              <UserMenu user={user} initials={initials} onLogout={logout} />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 pb-28 md:px-8 md:pb-10">{children}</main>
      </div>

      <ShimmerButton
        onClick={() => setModalOpen(true)}
        aria-label="Tambah tugas"
        aria-keyshortcuts="n"
        title="Tambah tugas (N)"
        background="var(--primary)"
        shimmerColor="var(--primary-foreground)"
        borderRadius="9999px"
        className="fixed bottom-20 right-4 z-40 size-14 p-0 text-primary-foreground shadow-lg md:bottom-6 md:right-6"
      >
        <Plus className="size-6" aria-hidden />
      </ShimmerButton>

      <nav
        aria-label="Navigasi bawah"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <ShortcutManager />
      <TaskModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}

function UserMenu({
  user,
  initials,
  onLogout,
}: {
  user: ShellUser;
  initials: string;
  onLogout: () => void;
}) {
  const busy = useRef(false);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2 px-2" aria-label="Menu pengguna">
          <Avatar className="size-8">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
            <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="truncate font-medium">{user.name}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2">
            <Settings className="size-4" aria-hidden /> Pengaturan
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={async () => {
            if (busy.current) return;
            busy.current = true;
            await onLogout();
            busy.current = false;
          }}
        >
          <LogOut className="size-4" aria-hidden /> Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
