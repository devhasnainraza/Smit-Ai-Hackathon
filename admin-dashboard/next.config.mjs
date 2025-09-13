/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'assets.indolj.io' },
      { protocol: 'https', hostname: 'foodsinn.co' },
    ],
  },
};

export default nextConfig;


