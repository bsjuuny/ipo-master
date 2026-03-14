/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '/ipomaster',
  env: {
    NEXT_PUBLIC_BASE_PATH: '/ipomaster',
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
