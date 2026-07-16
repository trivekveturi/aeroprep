import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep native modules server-side — don't bundle into client JS
  serverExternalPackages: ['bcryptjs', 'mysql2'],

  // Allow access from local network devices (phones, tablets on same WiFi)
  // so Hot Module Replacement WebSocket works when testing on mobile
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '192.168.1.7',   // your local network IP — update if your IP changes
    '192.168.1.*',
  ],
};

export default nextConfig;
