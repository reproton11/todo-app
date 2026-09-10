import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // lucide-react & recharts sudah dioptimasi bawaan Next; ini untuk barrel lain yang berat.
    optimizePackageImports: ["radix-ui", "@dnd-kit/core", "@dnd-kit/sortable", "sonner"],
  },
};

export default nextConfig;
