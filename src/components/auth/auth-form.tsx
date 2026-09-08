"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BorderBeam } from "@/components/magicui/border-beam";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { Wordmark } from "@/components/wordmark";
import { apiFetch } from "@/lib/api-client";
import { loginSchema, registerSchema } from "@/lib/validations";
import { z } from "zod";

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export function AuthForm() {
  return (
    <main className="relative isolate flex min-h-svh flex-col items-center justify-center gap-8 overflow-hidden px-4 py-10">
      <DotPattern className="-z-10 text-primary/20" width={20} height={20} />
      <div className="flex flex-col items-center gap-2 text-center">
        <Wordmark />
        <p className="max-w-xs text-sm text-muted-foreground">
          Catat, atur, dan selesaikan tugas harianmu dengan kategori, prioritas, dan pengingat.
        </p>
      </div>

      <div className="relative w-full max-w-md rounded-xl">
        <BorderBeam size={90} duration={9} colorFrom="var(--primary)" colorTo="var(--accent)" />
        <Card className="w-full">
        <Tabs defaultValue="login">
          <CardHeader>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Masuk</TabsTrigger>
              <TabsTrigger value="register">Daftar</TabsTrigger>
            </TabsList>
          </CardHeader>
          <TabsContent value="login">
            <LoginForm />
          </TabsContent>
          <TabsContent value="register">
            <RegisterForm />
          </TabsContent>
        </Tabs>
      </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        <Link href="/forgot-password" className="underline underline-offset-4 hover:text-foreground">
          Lupa kata sandi?
        </Link>
      </p>
    </main>
  );
}

function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError("");
    try {
      await apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify(values) });
      toast.success("Selamat datang kembali");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Gagal masuk");
    }
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="login-email">Email</Label>
          <Input id="login-email" type="email" autoComplete="email" placeholder="nama@email.com" {...form.register("email")} />
          {form.formState.errors.email && (
            <p role="alert" className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Kata sandi</Label>
          </div>
          <Input id="login-password" type="password" autoComplete="current-password" {...form.register("password")} />
          {form.formState.errors.password && (
            <p role="alert" className="text-sm text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="remember" onCheckedChange={(v) => form.setValue("remember", v === true)} />
          <Label htmlFor="remember" className="text-sm font-normal">Ingat saya di perangkat ini</Label>
        </div>
        {serverError && (
          <p role="alert" aria-live="polite" className="text-sm text-destructive">{serverError}</p>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-3">
        <ShimmerButton
          type="submit"
          className="w-full text-primary-foreground disabled:pointer-events-none disabled:opacity-50"
          background="var(--primary)"
          shimmerColor="var(--primary-foreground)"
          borderRadius="0.625rem"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Memproses..." : "Masuk"}
        </ShimmerButton>
        <CardDescription>
          Belum punya akun? Buka tab Daftar di atas.
        </CardDescription>
      </CardFooter>
    </form>
  );
}

function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError("");
    try {
      await apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify(values) });
      toast.success("Akun dibuat, 7 kategori dan 3 status sudah disiapkan");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Gagal mendaftar");
    }
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="reg-name">Nama</Label>
          <Input id="reg-name" autoComplete="name" placeholder="Nama kamu" {...form.register("name")} />
          {form.formState.errors.name && (
            <p role="alert" className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="reg-email">Email</Label>
          <Input id="reg-email" type="email" autoComplete="email" placeholder="nama@email.com" {...form.register("email")} />
          {form.formState.errors.email && (
            <p role="alert" className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="reg-password">Kata sandi</Label>
          <Input id="reg-password" type="password" autoComplete="new-password" {...form.register("password")} />
          <p className="text-xs text-muted-foreground">Minimal 8 karakter.</p>
          {form.formState.errors.password && (
            <p role="alert" className="text-sm text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>
        {serverError && (
          <p role="alert" aria-live="polite" className="text-sm text-destructive">{serverError}</p>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-3">
        <ShimmerButton
          type="submit"
          className="w-full text-primary-foreground disabled:pointer-events-none disabled:opacity-50"
          background="var(--primary)"
          shimmerColor="var(--primary-foreground)"
          borderRadius="0.625rem"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Memproses..." : "Buat Akun"}
        </ShimmerButton>
        <CardDescription>Gratis, data tersimpan di perangkat server ini.</CardDescription>
      </CardFooter>
    </form>
  );
}
