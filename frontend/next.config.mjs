/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Reduce build output noise
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;
