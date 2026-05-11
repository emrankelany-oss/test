/** @type {import('next').NextConfig} */
// "standalone" output is required by the Coolify/Docker pipeline (Dockerfile +
// .github/workflows/deploy.yml). Vercel ships its own optimized output and
// breaks when standalone is forced, so we opt out when running on Vercel.
const isVercel = !!process.env.VERCEL;

const nextConfig = {
  output: isVercel ? undefined : "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
