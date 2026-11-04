import type { NextConfig } from "next";

// Where the Express API (householdme-be) runs. The browser never talks to it directly:
// /api/* and /uploads/* are proxied, so the admin session cookie is first-party.
const API_URL = process.env.API_URL ?? "http://localhost:4100";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image
  output: "standalone",
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API_URL}/api/:path*` },
      { source: "/uploads/:path*", destination: `${API_URL}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
