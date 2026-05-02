/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://analog-crossing-466701-h8.firebaseapp.com/__/auth/:path*',
      },
    ];
  },
};

export default nextConfig;
