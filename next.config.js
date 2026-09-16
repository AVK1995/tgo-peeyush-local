/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    // Tree-shake the icon barrel so only the used glyphs ship.
    optimizePackageImports: ['@phosphor-icons/react'],
  },
};

module.exports = nextConfig;
