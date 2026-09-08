"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wordmark } from "@/components/wordmark";
import { apiFetch } from "@/lib/api-client";

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter");
      return;
    }
    if (password !== confirm) {
      setError("Konfirmasi kata sandi tidak sama");
      return;
    }
    setBusy(true);
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "PATCH",
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengatur ulang");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <CardContent>
        <p className="text-sm">Tautan tidak memiliki token yang valid. Minta tautan baru lewat halaman lupa kata sandi.</p>
      </CardContent>
    );
  }

  if (done) {
    return (
      <CardContent className="grid gap-4">
        <p className="text-sm">Kata sandi berhasil diubah.</p>
        <Button onClick={() => router.push("/")}>Masuk dengan kata sandi baru</Button>
      </CardContent>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="reset-password">Kata sandi baru</Label>
          <Input
            id="reset-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="reset-confirm">Ulangi kata sandi</Label>
          <Input
            id="reset-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        {error && (
          <p role="alert" aria-live="polite" className="text-sm text-destructive">{error}</p>
        )}
      </CardContent>
      <CardFooter className="pt-6">
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
        </Button>
      </CardFooter>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 px-4 py-10">
      <Wordmark href="/" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Kata sandi baru</CardTitle>
          <CardDescription>Buat kata sandi baru untuk akunmu.</CardDescription>
        </CardHeader>
        <Suspense fallback={<CardContent className="text-sm text-muted-foreground">Memuat...</CardContent>}>
          <ResetForm />
        </Suspense>
      </Card>
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        Kembali ke halaman masuk
      </Link>
    </main>
  );
}
