/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict Mode double-invokes effects in dev, which re-initialises Lenis on
  // every refresh and causes a visible "jump back to top" + reveal replay.
  reactStrictMode: false,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
