"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { AuroraText } from "@/components/magicui/aurora-text";

const AURORA_LIGHT = ["#115e59", "#0f766e", "#0d9488"];
const AURORA_DARK = ["#5eead4", "#2dd4bf", "#14b8a6"];

export function Wordmark({ href }: { href?: string }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const content = (
    <span className="text-xl font-bold tracking-tight text-foreground">
      Tugas
      {mounted ? (
        <AuroraText colors={resolvedTheme === "dark" ? AURORA_DARK : AURORA_LIGHT}>
          Ku
        </AuroraText>
      ) : (
        <span className="text-primary">Ku</span>
      )}
      <span className="ml-1 inline-block size-2 rounded-full bg-accent align-super" aria-hidden />
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex">
        {content}
      </Link>
    );
  }
  return content;
}
