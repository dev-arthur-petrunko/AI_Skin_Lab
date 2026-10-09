/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    const backend = process.env.BACKEND_URL || "http://localhost:8000";
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/images/:path*", destination: `${backend}/images/:path*` },
      { source: "/cutouts/:path*", destination: `${backend}/cutouts/:path*` },
    ];
  },
};

module.exports = nextConfig;

