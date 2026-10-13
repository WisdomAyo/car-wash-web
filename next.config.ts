import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Editorial photos are served as AVIF/WebP at the size the page needs.
    formats: ["image/avif", "image/webp"],
  },
}

export default nextConfig
