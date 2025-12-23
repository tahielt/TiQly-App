import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Suprimir warning de middleware en Next.js 16
    // Middleware es la forma estándar y soportada
  },
};

export default nextConfig;
