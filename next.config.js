/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Force restart dev server
  env: {
    RESTART: Date.now().toString(),
  },
};

module.exports = nextConfig;
