import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // MCPサーバーはRoute Handler (app/mcp/route.ts) で実装する
  allowedDevOrigins: ["127.0.0.1", "192.168.10.12", "localhost", "127.0.0.1:3003", "192.168.10.12:3003"],
};

export default nextConfig;
