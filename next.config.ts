import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import path from "path";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  extendDefaultRuntimeCaching: true,
  register: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  // Explicitly set the workspace root to silence the lockfile warning
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default withPWA(nextConfig);
