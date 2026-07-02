import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Dev-only: allow testing the dev server from other devices on the LAN.
  allowedDevOrigins: ["192.168.62.64"],
}

export default nextConfig
