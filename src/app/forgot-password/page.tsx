"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
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
import { forgotSchema } from "@/lib/validations";

type ForgotValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [result, setResult] = useState<{ message: string; devLink?: string } | null>(null);
  const form = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await apiFetch<{ message: string; devLink?: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(values),
    });
    setResult(res);
  });

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 px-4 py-10">
      <Wordmark href="/" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Atur ulang kata sandi</CardTitle>
          <CardDescription>
            Masukkan email akunmu. Kami kirim tautan pengaturan ulang yang berlaku 1 jam.
          </CardDescription>
        </CardHeader>
        {result ? (
          <CardContent className="grid gap-4">
            <p aria-live="polite" className="text-sm">{result.message}</p>
            {result.devLink && (
              <div className="rounded-md border border-dashed p-3 text-sm">
                <p className="mb-2 font-medium text-muted-foreground">
                  Mode dev (email belum diatur), tautan reset:
                </p>
                <Link className="break-all text-primary underline underline-offset-4" href={result.devLink}>
                  {result.devLink}
                </Link>
              </div>
            )}
          </CardContent>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="forgot-email">Email</Label>
                <Input id="forgot-email" type="email" autoComplete="email" {...form.register("email")} />
                {form.formState.errors.email && (
                  <p role="alert" className="text-sm text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-3 pt-6">
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Mengirim..." : "Kirim Tautan Reset"}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
      <Link href="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Kembali ke halaman masuk
      </Link>
    </main>
  );
}
